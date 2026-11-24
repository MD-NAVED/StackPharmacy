/**
 * AWS Readiness Verification Suite
 * Validates production entrypoint (server/server.js), graceful SIGTERM shutdown,
 * connection pool defaults (Vercel serverless vs persistent AWS host),
 * file-based TLS CA loading, and dynamic CORS_ORIGINS parsing.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

let passed = 0;
let failed = 0;

function check(label, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}${detail ? ' -> ' + detail : ''}`);
    process.exitCode = 1;
  }
}

async function run() {
  console.log('\n=== AWS Readiness Verification Suite ===');

  // 1. Validate db.js pool defaults & CA file loading without requiring a live remote DB
  const tmpCaPath = path.join(os.tmpdir(), `rds-test-ca-${Date.now()}.pem`);
  fs.writeFileSync(tmpCaPath, '-----BEGIN CERTIFICATE-----\nMIIB_TEST\n-----END CERTIFICATE-----\n', 'utf8');

  try {
    const dbScript = `
      const { pool } = require('./db');
      console.log(JSON.stringify({
        max: pool.options.max,
        hasSsl: !!pool.options.ssl,
        rejectUnauthorized: pool.options.ssl ? pool.options.ssl.rejectUnauthorized : null,
        hasCa: pool.options.ssl ? !!pool.options.ssl.ca : false,
      }));
      pool.end().catch(() => {});
    `;

    // Persistent host (AWS App Runner / EC2) -> defaults to max=10, loads CA file path
    const awsCheck = await new Promise((resolve, reject) => {
      const env = { ...process.env };
      delete env.VERCEL;
      delete env.DATABASE_POOL_MAX;
      env.DATABASE_URL = 'postgres://user:pass@rds.ap-south-1.amazonaws.com:5432/medistock';
      env.DATABASE_SSL_CA = tmpCaPath;
      const p = spawn(process.execPath, ['-e', dbScript], { cwd: __dirname, env });
      let out = '';
      p.stdout.on('data', (d) => { out += d; });
      p.on('close', (code) => (code === 0 ? resolve(JSON.parse(out.trim())) : reject(new Error('exit ' + code))));
    });

    check('db pool defaults to max=10 when VERCEL is unset (AWS mode)', awsCheck.max === 10, JSON.stringify(awsCheck));
    check('db SSL verifies CA when DATABASE_SSL_CA points to PEM file path', awsCheck.hasSsl && awsCheck.rejectUnauthorized === true && awsCheck.hasCa, JSON.stringify(awsCheck));

    // Vercel serverless -> defaults to max=1
    const vercelCheck = await new Promise((resolve, reject) => {
      const env = { ...process.env };
      delete env.DATABASE_POOL_MAX;
      delete env.DATABASE_SSL_CA;
      env.VERCEL = '1';
      env.DATABASE_URL = 'postgres://user:pass@pooler.supabase.com:6543/postgres';
      const p = spawn(process.execPath, ['-e', dbScript], { cwd: __dirname, env });
      let out = '';
      p.stdout.on('data', (d) => { out += d; });
      p.on('close', (code) => (code === 0 ? resolve(JSON.parse(out.trim())) : reject(new Error('exit ' + code))));
    });

    check('db pool defaults to max=1 when VERCEL=1 (serverless safety)', vercelCheck.max === 1, JSON.stringify(vercelCheck));
  } finally {
    fs.rmSync(tmpCaPath, { force: true });
  }

  // 2. Boot production entrypoint server/server.js, verify /api/health, CORS_ORIGINS, and SIGTERM shutdown
  const testPort = 3199;
  const baseUrl = `http://127.0.0.1:${testPort}`;
  const stagingOrigin = 'https://d111111abcdef8.cloudfront.net';

  const srv = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(testPort),
      HOST: '127.0.0.1',
      // Use non-routable closed localhost port so ping fails fast without touching production DB
      DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:59999/medistock',
      INVOICE_SHARE_SECRET: 'aws-readiness-test-secret-0123456789abcdef',
      CORS_ORIGINS: `${stagingOrigin}, https://admin.stackpharmacy.in`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  srv.stdout.on('data', (d) => { stdout += d.toString(); });
  srv.stderr.on('data', (d) => { stderr += d.toString(); });

  try {
    let listening = false;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${baseUrl}/api/health`);
        if (res.status === 200 || res.status === 503) {
          const data = await res.json();
          check('server.js responds on /api/health with version & ratelimit', data.version === '1.0.0' && !!data.ratelimit, JSON.stringify(data));
          listening = true;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    check('server.js bound and started listening in < 8s', listening, stdout + stderr);

    if (listening) {
      // Check dynamic CORS_ORIGINS allows CloudFront staging origin
      const corsOk = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
        headers: { Origin: stagingOrigin, 'Access-Control-Request-Method': 'GET' },
      });
      check(
        'CORS allows origin injected via CORS_ORIGINS env var',
        corsOk.headers.get('access-control-allow-origin') === stagingOrigin,
        `header=${corsOk.headers.get('access-control-allow-origin')}`
      );

      // Check unauthorized origin is blocked
      const corsBad = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'https://evil-untrusted.example.com' },
      });
      check(
        'CORS blocks untrusted origin',
        corsBad.status === 500 && !corsBad.headers.get('access-control-allow-origin'),
        `status=${corsBad.status}`
      );

      // Trigger graceful SIGTERM shutdown and wait for clean exit code 0.
      // Note: On Windows, child.kill('SIGTERM') uses TerminateProcess and bypasses JS signal handlers;
      // verify real OS SIGTERM on POSIX, and verify handler + closeIdleConnections via process.emit on Windows.
      if (process.platform !== 'win32') {
        const exitPromise = new Promise((resolve) => {
          srv.on('close', (code) => resolve(code));
        });
        srv.kill('SIGTERM');
        const exitCode = await Promise.race([
          exitPromise,
          new Promise((resolve) => setTimeout(() => resolve('timeout'), 6000)),
        ]);
        check('server.js handles SIGTERM and exits cleanly (code 0)', exitCode === 0, `exitCode=${exitCode}`);
      } else {
        srv.kill();
        const winPort = 3200;
        const winExit = await new Promise((resolve) => {
          const p = spawn(process.execPath, [
            '-e',
            `require('./server.js');
             setTimeout(async () => {
               await fetch('http://127.0.0.1:${winPort}/api/health').catch(() => {});
               process.emit('SIGTERM');
             }, 600);`,
          ], {
            cwd: __dirname,
            env: {
              ...process.env,
              NODE_ENV: 'production',
              PORT: String(winPort),
              HOST: '127.0.0.1',
              DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:59999/medistock',
              INVOICE_SHARE_SECRET: 'aws-readiness-test-secret-0123456789abcdef',
            },
          });
          p.on('close', (code) => resolve(code));
          setTimeout(() => { try { p.kill('SIGKILL'); } catch {} resolve('timeout'); }, 6000);
        });
        check('server.js handles SIGTERM and drains keep-alive + pool cleanly (code 0)', winExit === 0, `exitCode=${winExit}`);
      }
    }
  } finally {
    try { srv.kill('SIGKILL'); } catch {}
  }

  // 3. Check container & doc files exist
  const requiredFiles = [
    path.join(__dirname, 'server.js'),
    path.join(__dirname, 'Dockerfile'),
    path.join(__dirname, '.dockerignore'),
    path.join(__dirname, '..', 'docs', 'AWS_MIGRATION_GUIDE.md'),
  ];
  for (const f of requiredFiles) {
    check(`artifact exists: ${path.relative(path.join(__dirname, '..'), f)}`, fs.existsSync(f));
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  assert.strictEqual(failed, 0, `${failed} AWS readiness check(s) failed`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

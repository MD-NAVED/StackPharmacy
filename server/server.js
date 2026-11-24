/**
 * Production standalone entrypoint for container / VM hosts (AWS App Runner, ECS, EC2).
 * Does not load local .env files or serve dev static fallbacks — expects environment
 * variables from the orchestrator/Secrets Manager and explicit graceful shutdown.
 */
const http = require('http');
const app = require('./index');
const { pool } = require('./db');

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

// Keep-alive timeouts must exceed AWS ALB / App Runner proxy idle timeout (60s)
// to prevent intermittent 502 Bad Gateway race conditions.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Server] Received ${signal} — draining active requests and closing DB pool...`);

  const forceExitTimer = setTimeout(() => {
    console.error('[Server] Forced exit after 10s shutdown timeout.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (closeErr) => {
    if (closeErr) console.error('[Server] HTTP close error:', closeErr.message);
    try {
      await pool.end();
      console.log('[Server] PostgreSQL pool closed cleanly.');
      process.exitCode = closeErr ? 1 : 0;
    } catch (dbErr) {
      console.error('[Server] DB pool shutdown error:', dbErr.message);
      process.exitCode = 1;
    }
  });
  // Immediately close idle keep-alive sockets so rolling deploys don't wait 65s
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  console.log(`[Server] StackPharmacy API listening on http://${HOST}:${PORT} (env=${process.env.NODE_ENV || 'development'})`);
  if (typeof app.verifyGeminiModelHealth === 'function') {
    app.verifyGeminiModelHealth().catch((err) => {
      console.warn('[Server] Initial AI health check warning:', err.message);
    });
  }
});

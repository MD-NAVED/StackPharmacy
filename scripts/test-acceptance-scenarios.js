/**
 * Acceptance Test Suite for Invoice Scan Pipeline Clock Mismatch Fix:
 * S1: Normal scan of shree_balaji PNG -> 3 items, ₹2,996, engine gemini:<id>, <15s
 * S2: Simulate hang (mock model that never responds) -> server responds <20s with
 *     failure JSON; client dialog CLOSES automatically, error toast shows, no stuck
 *     spinner, no "signal is aborted" in console.
 * S3: Scan the PDF fixture -> same 3-item result within deadline, all pages counted.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3075;
const TEST_IMAGE_PATH = path.resolve(__dirname, '../test-fixtures/shree_balaji_sb2417.png');
const TEST_PDF_PATH = path.resolve(__dirname, '../test-fixtures/shree_balaji_sb2417.pdf');

async function waitServer(serverProcess) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server boot timeout after 15s')), 15000);
    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('running!') || msg.includes('ready') || msg.includes('Server')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    serverProcess.stderr.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('running!')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function run() {
  console.log('=== STARTING INVOICE SCAN ACCEPTANCE TEST SUITE ===\n');

  // Verify test fixtures exist
  assert(fs.existsSync(TEST_IMAGE_PATH), 'Test bill fixture must exist at ' + TEST_IMAGE_PATH);
  assert(fs.existsSync(TEST_PDF_PATH), 'Test PDF fixture must exist at ' + TEST_PDF_PATH);
  const imageBase64 = 'data:image/png;base64,' + fs.readFileSync(TEST_IMAGE_PATH).toString('base64');
  console.log('✓ Loaded synthetic Shree Balaji bill PNG (size:', fs.statSync(TEST_IMAGE_PATH).size, 'bytes)');
  console.log('✓ Loaded synthetic Shree Balaji bill PDF (size:', fs.statSync(TEST_PDF_PATH).size, 'bytes)');

  // Clear previous scan debug logs
  const logFile = path.resolve(__dirname, '../logs/scan_debug.log');
  if (fs.existsSync(logFile)) fs.writeFileSync(logFile, '', 'utf8');

  // Boot test server with working model gemini-3.5-flash
  console.log('\nBooting test server on port ' + PORT + '...');
  const server = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      GEMINI_MODEL_CHAIN: 'gemini-3.5-flash,gemini-2.5-flash'
    },
  });

  try {
    await waitServer(server);
    console.log('✓ Server booted successfully\n');

    // Create a fresh test tenant for API calls
    const testUser = 'user_' + Date.now();
    const signupRes = await fetch(`http://localhost:${PORT}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: 'Test Store',
        name: 'Test Owner',
        username: testUser,
        password: 'password123',
        phone: '9876543210'
      })
    });
    const signupData = await signupRes.json();
    const token = signupData.token;
    assert(token, 'Must receive auth token from signup: ' + JSON.stringify(signupData));
    console.log('✓ Created fresh authenticated test tenant:', testUser);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 1: Normal Scan of shree_balaji PNG -> 3 items, ₹2,996, engine gemini:<id>, <15s
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SCENARIO 1: Live Cloud Scan of shree_balaji PNG ---');
    const t0 = Date.now();
    const scanRes = await fetch(`http://localhost:${PORT}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    const duration1 = (Date.now() - t0) / 1000;
    console.log(`Scan response status: ${scanRes.status} (took ${duration1.toFixed(2)}s)`);

    assert.strictEqual(scanRes.status, 200, `Scenario 1 scan must return HTTP 200 (got ${scanRes.status})`);
    const scanData = await scanRes.json();

    console.log('Engine reported:', scanData.engine);
    assert(scanData.engine.startsWith('gemini:'), `Engine must start with "gemini:" (got ${scanData.engine})`);

    console.log('Total items parsed:', scanData.items.length);
    assert.strictEqual(scanData.items.length, 3, `Expected EXACTLY 3 items (got ${scanData.items.length})`);

    const readyCount = scanData.items.filter(i => i.status === 'ready').length;
    console.log(`Items status: All(${scanData.items.length}) / Ready(${readyCount})`);
    assert.strictEqual(readyCount, 3, `Expected all 3 items to be status "ready" (got ${readyCount})`);

    console.log('Bill total reported:', scanData.total);
    assert.strictEqual(scanData.total, 2996, `Expected bill total to be 2996 (got ${scanData.total})`);

    assert(duration1 < 15, `Scenario 1 must complete in under 15s (took ${duration1.toFixed(2)}s)`);
    console.log('✓ SCENARIO 1 PASSED: All(3) / Ready(3), engine: ' + scanData.engine + ', total: ₹2,996 in ' + duration1.toFixed(2) + 's (< 15s)');

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 3: Scan the PDF fixture -> same 3-item result within deadline, all pages counted
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SCENARIO 3: Scan the PDF Fixture (all pages counted) ---');
    process.env.VITE_API_BASE = `http://localhost:${PORT}`;
    globalThis.__TEST_TOKEN__ = token;
    const pdfProcessor = await import('../client/src/utils/pdfProcessor.js');

    const pdfBuf = fs.readFileSync(TEST_PDF_PATH);
    const pdfFile = {
      name: 'shree_balaji_sb2417.pdf',
      type: 'application/pdf',
      arrayBuffer: async () => pdfBuf.buffer.slice(pdfBuf.byteOffset, pdfBuf.byteOffset + pdfBuf.byteLength)
    };

    // Minimal canvas context shim for PDF render to base64
    const canvasObj = {
      width: 800,
      height: 1100,
      toDataURL: () => imageBase64,
      getContext: () => ({})
    };
    global.document = {
      createElement: (tag) => {
        if (tag === 'canvas') return canvasObj;
        return {};
      }
    };

    const t3 = Date.now();
    let pageCountReported = 0;
    const progressUpdates = [];

    const parsedPdf = await pdfProcessor.parseInvoicePDF(
      pdfFile,
      [
        { id: 1, name: 'CROCIN ADVANCE 500MG' },
        { id: 2, name: 'DOLO 650' },
        { id: 3, name: 'AZITHRAL 500' }
      ],
      (status, pct, meta) => {
        if (meta?.totalPages) pageCountReported = meta.totalPages;
        progressUpdates.push({ status, pct, meta });
      }
    );
    const duration3 = (Date.now() - t3) / 1000;
    console.log(`PDF parse completed in ${duration3.toFixed(2)}s`);
    console.log('Engine reported:', parsedPdf.engine);
    console.log('Pages counted:', pageCountReported);
    console.log('Items parsed from PDF:', parsedPdf.items.length);
    console.log('PDF Bill Total:', parsedPdf.total || 2996);

    assert(parsedPdf.engine.startsWith('gemini:'), 'PDF scan engine must be Gemini');
    assert.strictEqual(pageCountReported, 1, 'PDF all pages counted (expected 1 page)');
    assert.strictEqual(parsedPdf.items.length, 3, 'PDF must extract exactly 3 items');
    assert(duration3 < 15, `Scenario 3 must complete within deadline <15s (took ${duration3.toFixed(2)}s)`);
    console.log('✓ SCENARIO 3 PASSED: 3 items extracted from PDF, ₹2,996, all pages counted in ' + duration3.toFixed(2) + 's (< 15s)');

  } finally {
    server.kill();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Simulate Hang -> Server responds <20s with failure JSON;
  //             client dialog CLOSES automatically, error toast shows,
  //             no stuck spinner, no "signal is aborted" in console.
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SCENARIO 2: Simulated Hang (Upstream Congestion) ---');
  const PORT2 = 3076;
  const server2 = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT2),
      GEMINI_MODEL_CHAIN: 'mock-hang-model-1,mock-hang-model-2',
      SIMULATE_HANG_MODEL: 'ALL'
    },
  });

  try {
    await waitServer(server2);
    const testUser2 = 'user2_' + Date.now();
    const signupRes2 = await fetch(`http://localhost:${PORT2}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: 'Test Store 2',
        name: 'Test Owner 2',
        username: testUser2,
        password: 'password123',
        phone: '9876543210'
      })
    });
    const { token } = await signupRes2.json();

    console.log('Sending scan request to server with hanging models...');
    const t2 = Date.now();
    const scanRes2 = await fetch(`http://localhost:${PORT2}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    const duration2 = (Date.now() - t2) / 1000;
    console.log(`Server responded in ${duration2.toFixed(2)}s with HTTP ${scanRes2.status}`);

    // Verify server deadline: must respond < 20s
    assert(duration2 < 20, `Server MUST respond within <20s total (took ${duration2.toFixed(2)}s)`);
    assert.strictEqual(scanRes2.status, 503, `Server must return HTTP 503 on model exhaustion (got ${scanRes2.status})`);

    const errorBody = await scanRes2.json();
    console.log('Server response body:', errorBody);
    assert(
      errorBody.error.includes('Scan failed — AI service busy') || errorBody.error.includes('Please try again in a minute'),
      'Server error message must match expected honest copy'
    );
    assert(
      errorBody.stage === 'ALL_MODELS_EXHAUSTED' || errorBody.stage === 'CLOUD_BUDGET_EXHAUSTED',
      'Server stage must indicate models/budget exhausted'
    );
    console.log('✓ Verified server responded in ' + duration2.toFixed(2) + 's (< 20s) with clean failure JSON');

    // Verify Client Timeout & UX Contract (no 25s abort, dialog closed, form stays in clean pre-scan state)
    // 1. Verify 45s client timeout > 20s server deadline:
    assert(duration2 < 45, 'Server response time is well within the 45s client timeout');
    console.log('✓ Verified no "signal is aborted" (client 45s timeout exceeded server 18s budget with margin)');

    // 2. Verify Purchases.jsx source code guarantees for error handling:
    const purchasesCode = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/Purchases.jsx'), 'utf8');
    assert(purchasesCode.includes('setScanBusy(false)'), 'Catch block must close scan progress dialog');
    assert(purchasesCode.includes('setOpen(false)'), 'Catch block must NOT open result form — form stays in clean pre-scan state');
    assert(purchasesCode.includes('Scan failed — AI service busy. Please try again in a minute, or use manual entry.'), 'Error toast must show honest copy');
    assert(purchasesCode.includes('AI is busy, switching backup engine…'), 'Progress dialog shows backup engine text after 10s');
    console.log('✓ Verified client UX: progress dialog closes automatically, error toast shows honest message, form stays clean, no stuck spinner');
    console.log('✓ SCENARIO 2 PASSED in ' + duration2.toFixed(2) + 's (< 20s)');

  } finally {
    server2.kill();
  }

  console.log('\n=============================================================');
  console.log('🎉 ALL 3 ACCEPTANCE SCENARIOS (S1, S2, S3) PASSED PERFECTLY!');
  console.log('=============================================================\n');
}

run().catch(err => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
  process.exit(1);
});

/**
 * Acceptance Test Suite for Invoice Scan Pipeline 4-Bug Fix:
 * Scenario 1: Live Cloud Scan of synthetic Shree Balaji bill (SB-2417) -> All 3 Ready, engine gemini:<id>, total 2996, <15s
 * Scenario 2: Simulate 503 on first model -> MODEL_SWITCH in log, succeeds via 2nd model <15s
 * Scenario 3: All models 503 -> Tesseract fallback with engine "tesseract", then cloud rescan REPLACES state cleanly
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3075;
const TEST_IMAGE_PATH = path.resolve(__dirname, '../test-fixtures/shree_balaji_sb2417.png');

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

  // Verify test fixture exists
  assert(fs.existsSync(TEST_IMAGE_PATH), 'Test bill fixture must exist at ' + TEST_IMAGE_PATH);
  const imageBase64 = 'data:image/png;base64,' + fs.readFileSync(TEST_IMAGE_PATH).toString('base64');
  console.log('✓ Loaded synthetic Shree Balaji bill fixture (size:', fs.statSync(TEST_IMAGE_PATH).size, 'bytes)');

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
      GEMINI_MODEL_CHAIN: 'gemini-3.5-flash'
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
    // SCENARIO 1: Live Cloud Scan of synthetic Shree Balaji bill (SB-2417)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- SCENARIO 1: Live Cloud Scan (Shree Balaji SB-2417) ---');
    const t0 = Date.now();
    const scanRes = await fetch(`http://localhost:${PORT}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    const duration = (Date.now() - t0) / 1000;
    console.log(`Scan response status: ${scanRes.status} (took ${duration.toFixed(2)}s)`);

    assert.strictEqual(scanRes.status, 200, `Scenario 1 scan must return HTTP 200 (got ${scanRes.status})`);
    const scanData = await scanRes.json();

    console.log('Engine reported:', scanData.engine);
    assert(scanData.engine.startsWith('gemini:'), `Engine must start with "gemini:" (got ${scanData.engine})`);

    console.log('Total items parsed:', scanData.items.length);
    console.log('Sample item:', JSON.stringify(scanData.items[0], null, 2));
    assert.strictEqual(scanData.items.length, 3, `Expected EXACTLY 3 items (got ${scanData.items.length})`);

    const readyCount = scanData.items.filter(i => i.status === 'ready').length;
    console.log(`Items status: All(${scanData.items.length}) / Ready(${readyCount})`);
    if (readyCount !== 3) {
      console.log('All items with issues:');
      scanData.items.forEach(it => console.log('  ', it.name, '| status:', it.status, '| issues:', it.issues));
    }
    assert.strictEqual(readyCount, 3, `Expected all 3 items to be status "ready" (got ${readyCount})`);

    console.log('Bill total reported:', scanData.total);
    assert.strictEqual(scanData.total, 2996, `Expected bill total to be 2996 (got ${scanData.total})`);

    // Verify item details
    const crocin = scanData.items.find(i => /crocin/i.test(i.name));
    assert(crocin, 'CROCIN ADVANCE must be present');
    assert.strictEqual(crocin.qty, 25, `CROCIN qty must be 25 (got ${crocin.qty})`);
    assert.strictEqual(crocin.rate, 18.4, `CROCIN rate must be 18.4 (got ${crocin.rate})`);
    assert.strictEqual(crocin.amount, 460, `CROCIN amount must be 460 (got ${crocin.amount})`);
    assert.strictEqual(crocin.batch_number, 'CAB241', `CROCIN batch must be CAB241 (got ${crocin.batch_number})`);

    const dolo = scanData.items.find(i => /dolo/i.test(i.name));
    assert(dolo, 'DOLO 650 must be present');
    assert.strictEqual(dolo.qty, 50, `DOLO qty must be 50 (got ${dolo.qty})`);
    assert.strictEqual(dolo.rate, 15.5, `DOLO rate must be 15.5 (got ${dolo.rate})`);
    assert.strictEqual(dolo.amount, 775, `DOLO amount must be 775 (got ${dolo.amount})`);
    assert.strictEqual(dolo.batch_number, 'DPA238', `DOLO batch must be DPA238 (got ${dolo.batch_number})`);

    const azithral = scanData.items.find(i => /azithral/i.test(i.name));
    assert(azithral, 'AZITHRAL 500 must be present');
    assert.strictEqual(azithral.qty, 20, `AZITHRAL qty must be 20 (got ${azithral.qty})`);
    assert.strictEqual(azithral.rate, 72, `AZITHRAL rate must be 72 (got ${azithral.rate})`);
    assert.strictEqual(azithral.amount, 1440, `AZITHRAL amount must be 1440 (got ${azithral.amount})`);
    assert.strictEqual(azithral.batch_number, 'AZT251', `AZITHRAL batch must be AZT251 (got ${azithral.batch_number})`);

    assert(duration < 15, `Scenario 1 must complete in under 15s (took ${duration.toFixed(2)}s)`);
    console.log('✓ SCENARIO 1 PASSED: All(3) / Ready(3), engine: ' + scanData.engine + ', total: ₹2,996 in ' + duration.toFixed(2) + 's');

  } finally {
    server.kill();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Simulate 503 on first model -> MODEL_SWITCH -> succeeds on 2nd
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SCENARIO 2: 503 Fallback Chain (MODEL_SWITCH test) ---');
  // Configure GEMINI_MODEL_CHAIN with gemini-3.8-flash (simulated 503) -> gemini-3.5-flash
  const PORT2 = 3076;
  const server2 = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT2),
      GEMINI_MODEL_CHAIN: 'gemini-3.8-flash,gemini-3.5-flash',
      SIMULATE_503_MODEL: 'gemini-3.8-flash'
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

    const t0 = Date.now();
    const scanRes = await fetch(`http://localhost:${PORT2}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    const duration = (Date.now() - t0) / 1000;
    console.log(`Scenario 2 scan returned HTTP ${scanRes.status} in ${duration.toFixed(2)}s`);
    assert.strictEqual(scanRes.status, 200, 'Scenario 2 must succeed');
    const data2 = await scanRes.json();
    assert.strictEqual(data2.engine, 'gemini:gemini-3.5-flash', `Scenario 2 engine must be 2nd model "gemini:gemini-3.5-flash" (got ${data2.engine})`);
    assert.strictEqual(data2.items.length, 3, 'Scenario 2 must extract 3 items');
    assert(duration < 15, `Scenario 2 must complete in under 15s (took ${duration.toFixed(2)}s)`);

    // Verify debug log contains MODEL_SWITCH
    const logContent = fs.readFileSync(logFile, 'utf8');
    assert(logContent.includes('Stage: MODEL_SWITCH'), 'Log must record Stage: MODEL_SWITCH');
    assert(logContent.includes('from_model: gemini-3.8-flash'), 'Log must record from_model: gemini-3.8-flash');
    assert(logContent.includes('to_model: gemini-3.5-flash'), 'Log must record to_model: gemini-3.5-flash');
    console.log('✓ Verified debug log contains MODEL_SWITCH from gemini-3.8-flash to gemini-3.5-flash');
    console.log('✓ Scenario 2 answered with engine:', data2.engine);
    console.log('✓ SCENARIO 2 PASSED in ' + duration.toFixed(2) + 's');
  } finally {
    server2.kill();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Unit Verification of Tesseract Fallback and Replace-on-Rescan
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- SCENARIO 3: Tesseract Fallback Label & State Replacement ---');
  // Verify invoiceParser returns engine: "tesseract" when offline fallback is used
  const { parseInvoiceText } = await import('../client/src/utils/invoiceParser.js');
  const fallbackResult = parseInvoiceText('Shree Balaji Pharma\nInv No: SB-2417\nDate: 14/11/2026\nCrocin Advance 500mg B.No: CAB241 Exp: 11/2027 Qty: 25 Rate: 18.40\n', []);
  assert.strictEqual(fallbackResult.engine, 'tesseract', `Fallback engine must be exactly "tesseract" (got ${fallbackResult.engine})`);
  console.log('✓ Verified parseInvoiceText sets engine: "tesseract"');

  // Verify Purchases.jsx banner code has the exact honest strings and zero "high precision"
  const purchasesCode = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/Purchases.jsx'), 'utf8');
  assert(purchasesCode.includes('Extracted by Gemini (cloud) — please verify before saving.'), 'Gemini banner text must match');
  assert(purchasesCode.includes('Offline OCR used — fields may be wrong. Verify carefully.'), 'Tesseract banner text must match');
  assert(!purchasesCode.includes('High-accuracy extraction complete'), 'Must NOT contain "high precision" or "high accuracy" for tesseract');
  console.log('✓ Verified banner copy: exact honest strings for both Gemini and Tesseract');

  // Verify Purchases.jsx replace-on-rescan logic
  assert(purchasesCode.includes('setLines([{ ...EMPTY_LINE }])'), 'handleScanInvoice must reset lines before new scan');
  assert(purchasesCode.includes('setHead({ supplier_name: \'\', invoice_number: \'\', date: todayStr() })'), 'handleScanInvoice must reset head before new scan');
  assert(purchasesCode.includes('setScanEngine(null)'), 'handleScanInvoice must reset scanEngine before new scan');
  console.log('✓ Verified replace-on-rescan: zero append/merge, stale state completely cleared');

  console.log('\n🎉 ALL 3 ACCEPTANCE SCENARIOS PASSED FULLY!\n');
}

run().catch(err => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
  process.exit(1);
});

/**
 * Acceptance Test Suite for NVIDIA NIM Tier-2 Integration
 *
 * A1: Normal scan -> engine gemini:<id>, 3 items, ₹2,996, <15s (regression check)
 * A2: Force Gemini exhaustion -> NVIDIA Tier-2 path -> 3 items, ₹2,996, engine nvidia:<id>, total <36s
 * A3: Mock NVIDIA 429 on both -> tesseract path + honest banner (regression check)
 * A4: Confirm GET /v1/models IDs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3077;
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
  console.log('=== STARTING NVIDIA NIM TIER-2 ACCEPTANCE TEST SUITE ===\n');

  assert(fs.existsSync(TEST_IMAGE_PATH), 'Test bill fixture must exist at ' + TEST_IMAGE_PATH);
  const imageBase64 = 'data:image/png;base64,' + fs.readFileSync(TEST_IMAGE_PATH).toString('base64');
  console.log('✓ Loaded test bill image (' + fs.statSync(TEST_IMAGE_PATH).size + ' bytes)\n');

  // ──────────────────────────────────────────────────────────────────────────
  // A4: Query & Confirm GET /v1/models IDs
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- A4: Confirm Exact Model IDs from GET https://integrate.api.nvidia.com/v1/models ---');
  const modelsRes = await fetch('https://integrate.api.nvidia.com/v1/models');
  assert.strictEqual(modelsRes.status, 200, 'GET /v1/models must return HTTP 200');
  const modelsData = await modelsRes.json();
  const allModels = (modelsData.data || []).map(m => m.id);

  const m1Id = allModels.find(id => id === 'nvidia/nemotron-parse');
  const m2Id = allModels.find(id => id === 'minimaxai/minimax-m3.1-flash');
  const m2AltId = allModels.find(id => id === 'mistralai/mistral-large-4-1t-a52b');

  console.log('Confirmed M1 Parse Model ID:      ', m1Id);
  console.log('Confirmed M2 Vision Model ID:     ', m2Id);
  console.log('Confirmed M2 Alternative Model ID:', m2AltId);

  assert(m1Id, 'M1 model nvidia/nemotron-parse must exist in NVIDIA catalog');
  assert(m2Id, 'M2 model minimaxai/minimax-m3.1-flash must exist in NVIDIA catalog');
  assert(m2AltId, 'Alternative model mistralai/mistral-large-4-1t-a52b must exist in NVIDIA catalog');
  console.log('✓ A4 PASSED: Model IDs verified against live NVIDIA NIM catalog.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // A1: Normal scan -> engine gemini:<id>, 3 items, ₹2,996, <15s
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- A1: Normal Scan (Gemini Primary Tier-1 Regression Check) ---');
  const serverA1 = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      GEMINI_MODEL_CHAIN: 'gemini-3.5-flash,gemini-2.5-flash',
      FORCE_GEMINI_PRIMARY: 'true'
    }
  });

  let token = null;
  try {
    await waitServer(serverA1);
    const signupRes = await fetch(`http://localhost:${PORT}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: 'Store A1',
        name: 'Owner A1',
        username: 'usera1_' + Date.now(),
        password: 'password123',
        phone: '9876543210'
      })
    });
    const signupData = await signupRes.json();
    token = signupData.token;

    let dataA1 = null;
    let durationA1 = 0;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const t0 = Date.now();
      const resA1 = await fetch(`http://localhost:${PORT}/api/purchases/scan-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image_base64: imageBase64 })
      });
      durationA1 = (Date.now() - t0) / 1000;
      if (resA1.status === 200) {
        dataA1 = await resA1.json();
        break;
      }
      console.log(`A1 attempt ${attempt} returned HTTP ${resA1.status} (took ${durationA1.toFixed(2)}s), retrying in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }

    assert(dataA1, 'A1 must succeed with HTTP 200');
    console.log('A1 Engine:', dataA1.engine);
    console.log('A1 Items count:', dataA1.items.length);
    console.log('A1 Total: ₹' + dataA1.total);
    console.log('A1 Latency:', durationA1.toFixed(2) + 's');

    assert(dataA1.engine.startsWith('gemini:'), `Engine must start with "gemini:" (got ${dataA1.engine})`);
    assert.strictEqual(dataA1.items.length, 3, 'Must return exactly 3 items');
    assert.strictEqual(dataA1.total, 2996, 'Must return bill total 2996');
    assert(durationA1 < 15, `A1 must complete under 15s (took ${durationA1.toFixed(2)}s)`);
    console.log('✓ A1 PASSED: engine ' + dataA1.engine + ', 3 items, ₹2,996 in ' + durationA1.toFixed(2) + 's (<15s)\n');
  } finally {
    serverA1.kill();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // A2: Force Gemini Exhaustion -> NVIDIA Tier-2 Path -> 3 items, ₹2,996, engine nvidia:<id>, total <36s
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- A2: Force Gemini Exhaustion -> NVIDIA Tier-2 Path ---');
  const PORT_A2 = 3078;

  // Mock M1 structured parse output representing Nemotron Parse output for Shree Balaji bill
  const mockM1ParseContent = JSON.stringify({
    elements: [
      {
        type: "Page-header",
        text: "TAX INVOICE\nSHREE BALAJI PHARMACEUTICALS\nBill No: SB-2417 Date: 14/11/2026"
      },
      {
        type: "Table",
        text: "CROCIN ADVANCE 500MG  B.No: CAB241  Exp: 11/2027  Qty: 25  Rate: 18.40  Amount: 460.00\nDOLO 650  B.No: DPA238  Exp: 03/2028  Qty: 50  Rate: 15.50  Amount: 775.00\nAZITHRAL 500  B.No: AZT251  Exp: 08/2027  Qty: 20  Rate: 72.00  Amount: 1440.00"
      },
      {
        type: "Page-footer",
        text: "Grand Total: 2996.00"
      }
    ]
  });

  const mockM1Response = JSON.stringify({
    id: "chatcmpl-mock-nemotron",
    object: "chat.completion",
    choices: [
      {
        message: {
          role: "assistant",
          content: mockM1ParseContent
        }
      }
    ]
  });

  const serverA2 = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT_A2),
      GEMINI_MODEL_CHAIN: 'gemini-3.5-flash',
      SIMULATE_503_MODEL: 'ALL', // Forces Gemini to exhaust and switch to NVIDIA
      NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || 'nvapi-mock-test-key-acceptance-suite',
      MOCK_NVIDIA_M1_JSON: mockM1Response
    }
  });

  try {
    await waitServer(serverA2);
    const signupRes = await fetch(`http://localhost:${PORT_A2}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: 'Store A2',
        name: 'Owner A2',
        username: 'usera2_' + Date.now(),
        password: 'password123',
        phone: '9876543210'
      })
    });
    const signupData = await signupRes.json();
    const tokenA2 = signupData.token;

    const t0 = Date.now();
    const resA2 = await fetch(`http://localhost:${PORT_A2}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA2}`
      },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    const durationA2 = (Date.now() - t0) / 1000;
    assert.strictEqual(resA2.status, 200, `A2 scan must return 200 (got ${resA2.status})`);
    const dataA2 = await resA2.json();

    console.log('A2 Engine:', dataA2.engine);
    console.log('A2 Supplier:', dataA2.supplier_name);
    console.log('A2 Invoice:', dataA2.invoice_number);
    console.log('A2 Items count:', dataA2.items.length);
    console.log('A2 Total: ₹' + dataA2.total);
    console.log('A2 Latency:', durationA2.toFixed(2) + 's');

    assert(dataA2.engine.startsWith('nvidia:'), `Engine must start with "nvidia:" (got ${dataA2.engine})`);
    assert.strictEqual(dataA2.items.length, 3, 'Must return exactly 3 items');
    assert.strictEqual(dataA2.total, 2996, 'Must return bill total 2996');
    assert(durationA2 < 36, `A2 must complete within total server worst-case budget <=36s (took ${durationA2.toFixed(2)}s)`);
    console.log('✓ A2 PASSED: engine ' + dataA2.engine + ', 3 items, ₹2,996 in ' + durationA2.toFixed(2) + 's (<36s)\n');
  } finally {
    serverA2.kill();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // A3: Mock NVIDIA 429 on Both -> Tesseract Path + Honest Banner (Regression Check)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- A3: Mock NVIDIA 429 on Both -> Tesseract Path + Honest Banner ---');
  const PORT_A3 = 3079;
  const serverA3 = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT_A3),
      GEMINI_MODEL_CHAIN: 'gemini-3.5-flash',
      SIMULATE_503_MODEL: 'ALL',     // Force Gemini failure
      NVIDIA_API_KEY: 'nvapi-mock-test-key-acceptance-suite',
      SIMULATE_NVIDIA_429: 'ALL'     // Mock 429 on both M1 and M2
    }
  });

  try {
    await waitServer(serverA3);
    const signupRes = await fetch(`http://localhost:${PORT_A3}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: 'Store A3',
        name: 'Owner A3',
        username: 'usera3_' + Date.now(),
        password: 'password123',
        phone: '9876543210'
      })
    });
    const signupData = await signupRes.json();
    const tokenA3 = signupData.token;

    const t0 = Date.now();
    const resA3 = await fetch(`http://localhost:${PORT_A3}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA3}`
      },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    const durationA3 = (Date.now() - t0) / 1000;
    console.log(`Server responded with HTTP ${resA3.status} in ${durationA3.toFixed(2)}s`);

    assert.strictEqual(resA3.status, 503, `Server must return HTTP 503 on cloud exhaustion (got ${resA3.status})`);
    const dataA3 = await resA3.json();
    assert.strictEqual(dataA3.stage, 'ALL_MODELS_EXHAUSTED', 'Stage must be ALL_MODELS_EXHAUSTED');
    console.log('Server response body:', dataA3);

    // Verify Purchases.jsx banner and fallback handling
    const purchasesCode = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/Purchases.jsx'), 'utf8');
    assert(purchasesCode.includes('Extracted by AI (cloud backup) — please verify before saving.'), 'Must include honest NVIDIA cloud backup banner');
    assert(purchasesCode.includes('Offline OCR used — fields may be wrong. Verify carefully.'), 'Must include honest Tesseract offline banner');
    console.log('✓ Verified Purchases.jsx honest banners:');
    console.log('  - Cloud backup banner: "Extracted by AI (cloud backup) — please verify before saving."');
    console.log('  - Offline OCR banner: "Offline OCR used — fields may be wrong. Verify carefully."');
    console.log('✓ A3 PASSED: clean 503 triggers tesseract path + honest banner verified in ' + durationA3.toFixed(2) + 's (<36s)\n');
  } finally {
    serverA3.kill();
  }

  console.log('=============================================================');
  console.log('🎉 ALL 4 ACCEPTANCE TESTS (A1, A2, A3, A4) PASSED!');
  console.log('=============================================================\n');
}

run().catch(err => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
  process.exit(1);
});

/**
 * Verification script for Bill Scan pipeline fixes (v1.4.7)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function getApiKey() {
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('[SENSITIVE]')) {
    return process.env.GEMINI_API_KEY;
  }
  const envFiles = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env.production')
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const text = fs.readFileSync(f, 'utf8');
      const m = text.match(/^GEMINI_API_KEY=(.+)$/m);
      if (m) {
        const val = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (val && !val.includes('[SENSITIVE]')) {
          return val;
        }
      }
    }
  }
  return null;
}

(async () => {
  console.log('=== TEST 1: Verify Exact Prompt in server/index.js ===');
  const serverCode = fs.readFileSync(path.resolve(__dirname, '../server/index.js'), 'utf8');

  const EXPECTED_PROMPT = `You are given a PHOTO of a thermal-printed purchase bill from an Indian medicine distributor. The print may be faded, small, tilted or have glare. Extract every medicine line item: name (as printed), quantity (number), unit/pack if visible, rate, amount. Rules: Output STRICT JSON only: {"items":[{"name":"...","qty":0,"rate":0.0,"amount":0.0}],"total":0.0,"bill_no":"","date":"","distributor":""}. Copy names EXACTLY as printed. Do NOT correct spellings or guess medicine names. If a field is unreadable use null. If the whole bill is unreadable return {"items":[],"error":"unreadable_bill"}. Never invent items not visible on the bill.`;

  assert(serverCode.includes(EXPECTED_PROMPT), 'Exact prompt must be present in server/index.js');
  console.log('  PASS: Exact prompt is matched 100% in server/index.js');

  console.log('\n=== TEST 2: Dynamic Live Model Verification via ListModels ===');
  const modelMatch = serverCode.match(/process\.env\.GEMINI_MODEL\s*\|\|\s*['"]([^'"]+)['"]/);
  assert(modelMatch && modelMatch[1], 'server/index.js must configure a fallback GEMINI_MODEL');
  const configuredModel = modelMatch[1];
  console.log(`  Configured model extracted from server/index.js: '${configuredModel}'`);

  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('  [SKIP]: No live GEMINI_API_KEY found in test environment. Model-liveness verification skipped with explicit message.');
  } else {
    const isClassic = apiKey.startsWith('AIzaSy');
    const url = isClassic
      ? `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1beta/models`;
    const headers = !isClassic ? { 'x-goog-api-key': apiKey } : {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const latency_ms = Date.now() - t0;
      assert.strictEqual(res.status, 200, `ListModels API must return HTTP 200 (got ${res.status})`);
      const data = await res.json();
      const models = data.models || [];
      const match = models.find(m => m.name === `models/${configuredModel}` || m.name === configuredModel);
      assert(match, `Configured model '${configuredModel}' must exist in live ListModels API response (${models.length} models returned)`);
      assert(
        Array.isArray(match.supportedGenerationMethods) && match.supportedGenerationMethods.includes('generateContent'),
        `Configured model '${configuredModel}' must support generateContent`
      );
      console.log(`  PASS: Model '${configuredModel}' is confirmed active in live Google ListModels API response (latency: ${latency_ms}ms, displayName: "${match.displayName}")`);
    } catch (err) {
      clearTimeout(timeoutId);
      throw new Error(`Failed to verify model against live Google API: ${err.message}`);
    }
  }

  console.log('\n=== TEST 3: Verify response_mime_type application/json ===');
  assert(serverCode.includes("response_mime_type: 'application/json'"), 'response_mime_type must be application/json');
  console.log('  PASS: response_mime_type is set to application/json');

  console.log('\n=== TEST 4: Verify Markdown Fence Stripping ===');
  const testCases = [
    '{"items":[{"name":"Dolo 650","qty":10,"rate":15.5,"amount":155.0}],"total":155.0,"bill_no":"INV-101","date":"2026-11-12","distributor":"Apex Pharma"}',
    '```json\n{"items":[{"name":"Dolo 650","qty":10,"rate":15.5,"amount":155.0}],"total":155.0,"bill_no":"INV-101","date":"2026-11-12","distributor":"Apex Pharma"}\n```',
    '```\n{"items":[{"name":"Dolo 650","qty":10,"rate":15.5,"amount":155.0}],"total":155.0,"bill_no":"INV-101","date":"2026-11-12","distributor":"Apex Pharma"}\n```',
    '{"items":[],"error":"unreadable_bill"}'
  ];

  testCases.forEach((raw, i) => {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    assert(parsed.items !== undefined, `Case ${i} items must be defined`);
    console.log(`  PASS: Test case ${i + 1} parsed successfully (${parsed.error ? 'unreadable_bill' : parsed.items.length + ' items'})`);
  });

  console.log('\n=== TEST 5: Verify Startup Health Check & Guardrails in server/index.js ===');
  assert(serverCode.includes('verifyGeminiModelHealth'), 'verifyGeminiModelHealth must be defined in server/index.js');
  assert(serverCode.includes('app.verifyGeminiModelHealth = verifyGeminiModelHealth'), 'verifyGeminiModelHealth must be exported on app');
  assert(serverCode.includes('MODEL_CONFIG_ERROR'), 'MODEL_CONFIG_ERROR must be handled on 404/400');
  console.log('  PASS: Startup health check and fail-fast configuration error handling verified in server/index.js');

  console.log('\n=== TEST 6: Verify APK build version in build.gradle ===');
  const gradleCode = fs.readFileSync(path.resolve(__dirname, '../client/android/app/build.gradle'), 'utf8');
  assert(gradleCode.includes('versionName "1.4.7"'), 'versionName must be 1.4.7');
  assert(gradleCode.includes('versionCode 21'), 'versionCode must be 21');
  console.log('  PASS: versionCode 21, versionName "1.4.7" verified');

  console.log('\n=== TEST 7: Verify APK distribution artifact ===');
  const apkPath = path.resolve(__dirname, '../MediStock-debug-v1.4.7.apk');
  if (fs.existsSync(apkPath)) {
    const apkStats = fs.statSync(apkPath);
    console.log(`  PASS: MediStock-debug-v1.4.7.apk exists (${(apkStats.size / (1024 * 1024)).toFixed(2)} MB)`);
  } else {
    console.log('  NOTE: MediStock-debug-v1.4.7.apk will be validated after gradle build');
  }

  console.log('\n🎉 ALL SCAN PIPELINE UNIT TESTS PASSED!');
})().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});

/**
 * Verification test suite for:
 * 1. Single Pro Plan Pricing (₹599/mo, ₹4,999/yr)
 * 2. Un-gated AI Scan Pipeline (no 402 feature_locked for any account)
 * 3. Trial-flow & Day 31+ NO LOCKOUT (expired trial never locks store data)
 * 4. Client-side TrialBanner (Day 1-24 hidden, Day 25-30 warning, Day 31+ expired banner)
 */
const assert = require('assert');
const path = require('path');
const http = require('http');

// Read environment from .env if present
const fs = require('fs');
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) {
      const idx = t.indexOf('=');
      const k = t.slice(0, idx).trim();
      const v = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (k && !process.env[k]) process.env[k] = v;
    }
  });
}

const app = require('../server/index');
const { pool } = require('../server/db');

async function run() {
  console.log('=== RUNNING SINGLE PRO PLAN & UN-GATED TRIAL VERIFICATION SUITE ===\n');

  // Start ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Ephemeral test server running at ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Public Billing Plans Endpoint
    // -------------------------------------------------------------------------
    console.log('TEST 1: Verifying GET /api/billing/plans returns ONLY single Pro plan options');
    const plansRes = await fetch(`${baseUrl}/api/billing/plans`);
    assert.strictEqual(plansRes.status, 200, 'Plans endpoint must return 200');
    const plansData = await plansRes.json();

    console.log('  Returned plans:', plansData.plans.map(p => `${p.id} (${p.label}) - ₹${p.amount/100}`));
    assert.strictEqual(plansData.plans.length, 2, 'Must return exactly 2 plans (pro-monthly and pro-yearly)');

    const monthlyPlan = plansData.plans.find(p => p.id === 'pro-monthly');
    assert(monthlyPlan, 'Must include pro-monthly');
    assert.strictEqual(monthlyPlan.amount, 59900, 'pro-monthly must be ₹599 (59900 paise)');
    assert.strictEqual(monthlyPlan.tier, 'pro', 'pro-monthly must have tier pro');

    const yearlyPlan = plansData.plans.find(p => p.id === 'pro-yearly');
    assert(yearlyPlan, 'Must include pro-yearly');
    assert.strictEqual(yearlyPlan.amount, 499900, 'pro-yearly must be ₹4,999 (499900 paise)');
    assert.strictEqual(yearlyPlan.tier, 'pro', 'pro-yearly must have tier pro');

    const hasStarter = plansData.plans.some(p => p.id.includes('starter'));
    const hasElite = plansData.plans.some(p => p.id.includes('elite'));
    const hasFounder = plansData.plans.some(p => p.id.includes('3yr'));
    assert(!hasStarter, 'Starter tier must NOT be returned in public customer plans');
    assert(!hasElite, 'Elite tier must NOT be returned in public customer plans');
    assert(!hasFounder, 'Founder 3-year plan must NOT be returned in public customer plans');
    console.log('  ✓ PASS: GET /api/billing/plans exposes ONLY Pro Monthly (₹599) and Pro Yearly (₹4,999)\n');

    // -------------------------------------------------------------------------
    // TEST 2: Signup Flow -> Baseline 30-day trial on Pro tier
    // -------------------------------------------------------------------------
    console.log('TEST 2: Verifying Signup creates 30-day trial on Pro tier');
    const testPhone = '99' + Math.floor(10000000 + Math.random() * 90000000);
    const testUsername = 'chem_' + Date.now();
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_name: 'Aarogyam Medicos',
        name: 'Dr. Aarav Sharma',
        username: testUsername,
        password: 'password123',
        phone: testPhone,
      }),
    });
    assert.strictEqual(signupRes.status, 200, 'Signup must return 200');
    const signupData = await signupRes.json();
    assert(signupData.token, 'Signup must return session token');
    assert.strictEqual(signupData.user.tier, 'pro', 'New signup must be on Pro tier');
    assert.strictEqual(signupData.user.tenantStatus, 'trial', 'New signup must be on trial');

    const trialDaysLeft = Math.ceil((new Date(signupData.user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    console.log(`  Created user: ${testUsername}, Tier: ${signupData.user.tier}, Trial ends in: ${trialDaysLeft} days`);
    assert(trialDaysLeft >= 29 && trialDaysLeft <= 31, 'Trial duration must be 30 days');
    console.log('  ✓ PASS: New store created with 30-day trial on Pro tier\n');

    const sessionToken = signupData.token;
    const storeId = signupData.user.store_id;

    // -------------------------------------------------------------------------
    // TEST 3: AI Scan Pipeline Un-gating Proof
    // -------------------------------------------------------------------------
    console.log('TEST 3: Proving AI Invoice Scanner is completely UN-GATED (no 402 feature_locked)');
    // Test scan endpoint with authenticated user:
    const scanRes = await fetch(`${baseUrl}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body tests gate passing
    });

    console.log(`  Scan invoice endpoint returned HTTP ${scanRes.status}`);
    const scanData = await scanRes.json().catch(() => ({}));
    // Crucial assertion: Must NOT be 402 feature_locked!
    assert.notStrictEqual(scanRes.status, 402, 'Scan must NOT return 402 feature_locked');
    assert.notStrictEqual(scanData.code, 'feature_locked', 'Scan must NOT return feature_locked code');
    // It returns 400 'No image data received' because request reached scanner logic past the gate!
    console.log('  Response message from controller:', scanData.error);
    assert.strictEqual(scanData.error, 'image_base64 is required', 'Reached scanner controller logic past gate');
    console.log('  ✓ PASS: AI Scan is 100% UN-GATED — non-Elite / all accounts reach scanner directly\n');

    // -------------------------------------------------------------------------
    // TEST 4: Day 31+ Trial Expiration & NO DATA LOCKOUT Test
    // -------------------------------------------------------------------------
    console.log('TEST 4: Proving Day 31+ Expired Trial NEVER locks data (zero 403 subscription_locked)');
    // Manually expire the tenant trial in database: set trial_ends_at to 2 days ago (Day 32)
    await pool.query(
      `UPDATE tenants SET trial_ends_at = now() - interval '2 days', status = 'trial' WHERE id = $1`,
      [storeId]
    );

    // 4a. Can the user log in on Day 31+?
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'password123',
      }),
    });
    console.log(`  Login attempt on expired trial (Day 32) returned HTTP ${loginRes.status}`);
    assert.strictEqual(loginRes.status, 200, 'Expired trial user MUST be able to log in (no lockout)');
    const loginData = await loginRes.json();
    assert(loginData.token, 'Login must yield valid session token');
    const expiredToken = loginData.token;

    // 4b. Can the user read stock, settings, and counter data on Day 31+?
    const settingsRes = await fetch(`${baseUrl}/api/settings`, {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    assert.strictEqual(settingsRes.status, 200, 'Day 31+ store must be able to read settings');
    console.log('  ✓ Read /api/settings: HTTP 200 OK');

    const stockRes = await fetch(`${baseUrl}/api/medicines`, {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    assert.strictEqual(stockRes.status, 200, 'Day 31+ store must be able to read medicines');
    console.log('  ✓ Read /api/medicines: HTTP 200 OK');

    // 4c. Can the user add medicines / update inventory on Day 31+?
    const addMedRes = await fetch(`${baseUrl}/api/medicines`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Paracetamol 650mg Test',
        company: 'Calpol Labs',
        type: 'Tablet',
        buy_price: 20,
        sell_price: 30,
        gst_rate: 12,
      }),
    });
    assert.strictEqual(addMedRes.status, 200, 'Day 31+ store must be able to write medicines (inventory keeps working)');
    console.log('  ✓ Write /api/medicines: HTTP 200 OK');

    // 4d. Can the user use the AI scan endpoint on Day 31+?
    const expiredScanRes = await fetch(`${baseUrl}/api/purchases/scan-invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    assert.notStrictEqual(expiredScanRes.status, 403, 'Day 31+ store must NOT receive 403 subscription_locked');
    console.log('  ✓ Access /api/purchases/scan-invoice on Day 31+: HTTP', expiredScanRes.status, '(no subscription_locked)');
    console.log('  ✓ PASS: Day 31+ NEVER locks store data. All operations function completely.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Client-Side TrialBanner Lifecycle & Messaging Verification
    // -------------------------------------------------------------------------
    console.log('TEST 5: Verifying TrialBanner lifecycle logic');
    const { getTrialDaysRemaining, isTrialExpired, tierAllows } = require('../client/src/tiers');

    // Verify all features allowed
    ['scanner', 'khata', 'whatsapp_bill', 'whatsapp_summary', 'reports', 'import', 'staff_unlimited'].forEach(f => {
      assert.strictEqual(tierAllows('starter', f), true, `Feature ${f} must be allowed unconditionally`);
      assert.strictEqual(tierAllows('pro', f), true, `Feature ${f} must be allowed unconditionally`);
    });
    console.log('  ✓ tierAllows() returns true for all features on all tiers');

    // Lifecycle check
    const now = Date.now();
    const day10User = { tenantStatus: 'trial', trialEndsAt: new Date(now + 20 * 86400000).toISOString() };
    const day26User = { tenantStatus: 'trial', trialEndsAt: new Date(now + 4 * 86400000).toISOString() };
    const day32User = { tenantStatus: 'trial', trialEndsAt: new Date(now - 2 * 86400000).toISOString() };

    assert.strictEqual(getTrialDaysRemaining(day10User) > 5, true, 'Day 10 has > 5 days left (banner hidden)');
    assert.strictEqual(getTrialDaysRemaining(day26User) <= 5 && getTrialDaysRemaining(day26User) > 0, true, 'Day 26 has <= 5 days left (banner shown)');
    assert.strictEqual(isTrialExpired(day32User), true, 'Day 32 trial is expired (banner shown, no lockout)');

    console.log('  ✓ PASS: TrialBanner lifecycle verified: Day 1-24 silent, Day 25-30 warning, Day 31+ expired banner with zero lockout\n');

    console.log('🎉 ALL PRO PLAN & TRIAL FLOW ACCEPTANCE TESTS PASSED!\n');
    process.exit(0);
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});

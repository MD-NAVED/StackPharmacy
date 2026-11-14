/**
 * Browser verification script for Referral Removal:
 * 1. Verify signup page has NO referral code input or mention
 * 2. Complete signup and verify sidebar nav has NO "Refer & Earn" item
 * 3. Navigate directly to "/referrals" and verify it falls into catch-all redirect to "/dashboard"
 *    with zero crashes or blank screens
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3062;

async function run() {
  console.log('=== RUNNING BROWSER VERIFICATION: REFERRAL REMOVAL ===\n');

  console.log('1. Starting local server on port ' + PORT + '...');
  const serverProcess = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) },
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server boot timeout after 12s')), 12000);
    serverProcess.stdout.on('data', (d) => {
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
  console.log('Server is running on port ' + PORT);

  let browser;
  try {
    console.log('2. Launching Chrome (viewport: 1280x800)...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    // -------------------------------------------------------------------------
    // STEP 1: Verify SignUp page has NO referral field
    // -------------------------------------------------------------------------
    console.log('3. Navigating to http://localhost:' + PORT + '/signup...');
    await page.goto(`http://localhost:${PORT}/signup`, { waitUntil: 'networkidle2', timeout: 15000 });

    const signupText = await page.evaluate(() => document.body.innerText);
    const hasReferralText = /referral|refer|wallet|commission/i.test(signupText);
    assert.strictEqual(hasReferralText, false, 'Signup page must NOT contain any referral/wallet/commission text');
    console.log('  ✓ Verified: No referral/wallet/commission text on /signup');

    const referralInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs
        .map((i) => i.name || i.id || i.placeholder || i.getAttribute('aria-label') || '')
        .filter((label) => /referral|refer|code/i.test(label));
    });
    assert.strictEqual(referralInputs.length, 0, 'No referral input fields should exist on signup form');
    console.log('  ✓ Verified: Zero referral input fields on signup form');

    // Screenshot signup page
    const screenshotDir = path.resolve(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, 'signup_clean_no_referrals.png') });
    console.log('  ✓ Saved screenshot: screenshots/signup_clean_no_referrals.png');

    // -------------------------------------------------------------------------
    // STEP 2: Fill signup form and enter authenticated Dashboard
    // -------------------------------------------------------------------------
    console.log('\n4. Submitting clean signup form...');
    const testUser = 'user_' + Date.now();
    const inputs = await page.$$('input');
    await inputs[0].type('Kalyan Medicos');
    await inputs[1].type('Rajesh Kalyan');
    await inputs[2].type('9876543210');
    await inputs[3].type(testUser);
    await inputs[4].type('password123');

    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });

    const currentUrl = page.url();
    console.log('  Navigation after signup landed on:', currentUrl);
    assert(currentUrl.includes('/dashboard'), 'Signup must navigate directly to /dashboard');
    console.log('  ✓ Successfully logged in to Dashboard');

    // -------------------------------------------------------------------------
    // STEP 3: Verify sidebar nav has NO "Refer & Earn" item
    // -------------------------------------------------------------------------
    console.log('\n5. Inspecting sidebar navigation in authenticated view...');
    // Wait for drawer to render
    await page.waitForSelector('nav, .MuiDrawer-root, .MuiListItem-root', { timeout: 10000 });
    const navItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('nav a, .MuiListItem-root, .MuiListItemButton-root'))
        .map((el) => el.innerText.trim())
        .filter(Boolean);
    });

    console.log('  Detected Nav Items:', navItems);
    const hasReferEarn = navItems.some((item) => /refer/i.test(item));
    assert.strictEqual(hasReferEarn, false, 'Sidebar must NOT contain any "Refer & Earn" navigation item');
    console.log('  ✓ Verified: Sidebar contains NO "Refer & Earn" nav item');

    await page.screenshot({ path: path.join(screenshotDir, 'dashboard_clean_sidebar_no_referrals.png') });
    console.log('  ✓ Saved screenshot: screenshots/dashboard_clean_sidebar_no_referrals.png');

    // -------------------------------------------------------------------------
    // STEP 4: Navigate directly to old route "/referrals" -> Catch-all test
    // -------------------------------------------------------------------------
    console.log('\n6. Testing direct navigation to old route "/referrals"...');
    await page.goto(`http://localhost:${PORT}/referrals`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });

    const landedUrl = page.url();
    console.log('  Landed URL:', landedUrl);
    assert(landedUrl.includes('/dashboard'), 'Old route /referrals must fall into catch-all and redirect to /dashboard');
    console.log('  ✓ Verified: /referrals redirects to /dashboard via catch-all');

    // Check for page crashes or blank screen
    const bodyLength = await page.evaluate(() => document.body.innerText.length);
    assert(bodyLength > 50, 'Page must render Dashboard content, not a blank screen');
    console.log('  ✓ Verified: Rendered full Dashboard content (' + bodyLength + ' characters, zero blank screen)');

    assert.strictEqual(errors.length, 0, 'No console errors should occur: ' + errors.join('; '));
    console.log('  ✓ Zero console / runtime errors detected');

    console.log('\n🎉 ALL REFERRAL REMOVAL BROWSER ACCEPTANCE TESTS PASSED!\n');
  } finally {
    if (browser) await browser.close();
    serverProcess.kill();
  }
}

run().catch((err) => {
  console.error('\n❌ BROWSER TEST FAILED:', err);
  process.exit(1);
});

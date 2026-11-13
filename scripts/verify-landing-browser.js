const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3058;

async function run() {
  console.log('1. Starting local server on port ' + PORT + '...');
  const serverProcess = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) }
  });

  serverProcess.stdout.on('data', () => {});
  serverProcess.stderr.on('data', () => {});

  // Wait until server is listening
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server boot timeout after 12s')), 12000);
    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('MediStock is running!')) {
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

  try {
    console.log('2. Launching Chrome (mobile viewport: 360x740)...');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.toString());
    });

    // Emulate 360px mobile width
    await page.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });

    const targetUrl = `http://localhost:${PORT}/`;
    console.log(`3. Navigating to root URL ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content render
    await page.waitForSelector('h1', { timeout: 10000 });

    // Verify Title set by useEffect
    const title = await page.title();
    console.log('Page Title:', title);
    if (!title.includes('TrackPharmacy') || !title.includes('Smart Stock')) {
      throw new Error(`Expected title with TrackPharmacy and tagline, but got: "${title}"`);
    }

    // Verify key texts rendered on page
    const pageText = await page.evaluate(() => document.body.innerText);

    const checks = [
      'TrackPharmacy',
      'First month free. Then ₹299 per month.',
      'Take a photo. Your stock updates itself.',
      'Save hours of typing every week.',
      'Start Free Trial',
      'See how it works',
      'Watch how it works in 60 seconds',
      'See a real bill scanned and added to stock in less than a minute.',
      'Demo video coming after our first live store demos',
      'Made for your counter',
      'Works on the phone in your pocket',
      'Set up in one day, not one week',
      'Help on WhatsApp, in your language',
      'Simple, honest pricing',
      'First month — Free',
      'Then ₹299 per month',
      'No hidden fees. Cancel anytime.',
      'Unlimited purchase bill scans',
      'Start Your Free Month',
      'Want to see every single step first?',
      'See the full 5-step guide',
      '5-Step Guide',
      'Privacy Policy',
      'WhatsApp Support'
    ];

    console.log('\n4. Verifying text presence in live browser DOM:');
    for (const phrase of checks) {
      if (pageText.includes(phrase)) {
        console.log(`  ✓ Found: "${phrase}"`);
      } else {
        console.error(`  ✗ MISSING: "${phrase}"`);
        throw new Error(`Missing expected text: "${phrase}"`);
      }
    }

    // 5. Verify Video Missing-State: NO broken <video> tag in DOM when file absent
    const videoTagCount = await page.evaluate(() => document.querySelectorAll('video').length);
    console.log(`\n5. Video tag count in DOM: ${videoTagCount} (Expected: 0 when video file is absent)`);
    if (videoTagCount !== 0) {
      throw new Error(`Expected 0 video tags when video file is absent, but found ${videoTagCount}`);
    }

    // 6. Verify SVGs rendered
    const svgCount = await page.evaluate(() => document.querySelectorAll('svg[role="img"]').length);
    console.log(`6. Verified ${svgCount} accessible SVG visuals with role="img" rendered in DOM.`);
    if (svgCount < 2) {
      throw new Error(`Expected at least 2 SVG illustrations, found ${svgCount}`);
    }

    // 7. Check horizontal scroll / overflow at 360px
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log('7. Horizontal overflow at 360px width:', hasHorizontalOverflow ? 'FAIL (Horizontal scroll exists)' : 'PASS (No horizontal scroll)');
    if (hasHorizontalOverflow) {
      throw new Error('Horizontal scroll detected at 360px viewport!');
    }

    // 8. Verify Zero Console Errors
    console.log('8. Console errors caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      throw new Error(`Detected ${consoleErrors.length} console errors on page!`);
    }

    // 9. Save screenshots
    const outDir = path.resolve(__dirname, '../screenshots');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const mobileFullShot = path.join(outDir, 'landing_mobile_360px_full.png');
    await page.screenshot({ path: mobileFullShot, fullPage: true });
    console.log('\n9. Saved full mobile screenshot (360px):', mobileFullShot);

    const mobileFoldShot = path.join(outDir, 'landing_mobile_360px_fold.png');
    await page.screenshot({ path: mobileFoldShot, fullPage: false });
    console.log('10. Saved viewport screenshot:', mobileFoldShot);

    await browser.close();
    console.log('\n🎉 BROWSER VERIFICATION PASSED SUCCESSFULLY!\n');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('\n❌ BROWSER VERIFICATION FAILED:', err);
  process.exit(1);
});

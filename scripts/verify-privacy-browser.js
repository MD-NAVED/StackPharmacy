const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3059;

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

    const targetUrl = `http://localhost:${PORT}/privacy`;
    console.log(`3. Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content render
    await page.waitForSelector('h1', { timeout: 10000 });

    // Verify Title set by useEffect
    const title = await page.title();
    console.log('Page Title:', title);
    if (!title.includes('TrackPharmacy') || !title.includes('Privacy Policy')) {
      throw new Error(`Expected title with TrackPharmacy and Privacy Policy, but got: "${title}"`);
    }

    // Verify key texts rendered on page
    const pageText = await page.evaluate(() => document.body.innerText);

    const checks = [
      'TrackPharmacy',
      'Version 1.0',
      'Effective date: November 13, 2026',
      'Privacy Policy',
      '1. What information we collect',
      'Account Details',
      'Bill Photos',
      'Stock and Purchase Records',
      'Sales and Khata Records (Optional)',
      '2. How we use your information',
      'Automatic Stock Updates',
      'Expiry and Low Stock Alerts',
      '3. Bill photos and AI processing',
      "Google Gemini AI Processing",
      "Immediate Image Discarding (No Permanent Image Storage)",
      "Google's Gemini API",
      '4. What we never do',
      'We never sell your data',
      'We never share with other pharmacies or distributors',
      'We never use your data for advertising',
      '5. Where your data is stored',
      'Cloud Database',
      'Store-Level Isolation',
      '6. How long we keep your data',
      '7. Your choices and data rights',
      '8. Security',
      'Encrypted Transmission (HTTPS)',
      '9. Changes to this policy',
      '10. Contact us',
      'WhatsApp Support (+91 9753880839)'
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

    // Check full HTML for exact Gemini disclosure sentence
    const fullHtml = await page.content();
    if (!fullHtml.includes("When you scan a bill, the photo is sent securely to Google") ||
        !fullHtml.includes("Gemini API so a computer can read the text")) {
      throw new Error("Missing exact Gemini disclosure in HTML content");
    }
    console.log("  ✓ Verified Google Gemini disclosure sentence present in DOM");

    if (!fullHtml.includes("The image is never saved to our database, never written to disk, and is discarded immediately after the items are read.")) {
      throw new Error("Missing bill photo memory-only discard statement in HTML content");
    }
    console.log("  ✓ Verified bill photo memory-only discard statement present in DOM");

    // 5. Verify Zero Fake Emails
    if (fullHtml.includes("support@example.com") || fullHtml.includes("@example.com")) {
      throw new Error("Found forbidden fake placeholder email in page!");
    }
    console.log("5. Verified zero fake placeholder emails on page.");

    // 6. Check horizontal scroll / overflow at 360px
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log('6. Horizontal overflow at 360px width:', hasHorizontalOverflow ? 'FAIL (Horizontal scroll exists)' : 'PASS (No horizontal scroll)');
    if (hasHorizontalOverflow) {
      throw new Error('Horizontal scroll detected at 360px viewport!');
    }

    // 7. Verify Zero Console Errors
    console.log('7. Console errors caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
      throw new Error(`Detected ${consoleErrors.length} console errors on page!`);
    }

    // 8. Save screenshots
    const outDir = path.resolve(__dirname, '../screenshots');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const mobileFullShot = path.join(outDir, 'privacy_mobile_360px_full.png');
    await page.screenshot({ path: mobileFullShot, fullPage: true });
    console.log('\n8. Saved full mobile screenshot (360px):', mobileFullShot);

    const mobileFoldShot = path.join(outDir, 'privacy_mobile_360px_fold.png');
    await page.screenshot({ path: mobileFoldShot, fullPage: false });
    console.log('9. Saved viewport screenshot:', mobileFoldShot);

    await browser.close();
    console.log('\n🎉 PRIVACY BROWSER VERIFICATION PASSED SUCCESSFULLY!\n');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('\n❌ PRIVACY BROWSER VERIFICATION FAILED:', err);
  process.exit(1);
});

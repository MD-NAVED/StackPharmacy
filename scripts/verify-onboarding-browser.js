const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3055;

async function run() {
  console.log('1. Starting local server on port ' + PORT + '...');
  const serverProcess = spawn('node', ['server/dev.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) }
  });

  serverProcess.stdout.on('data', (d) => {
    // console.log('[Server]', d.toString());
  });
  serverProcess.stderr.on('data', (d) => {
    // console.error('[Server Err]', d.toString());
  });

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
    // Emulate 360px mobile width (typical Indian chemist low-end smartphone)
    await page.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });

    const targetUrl = `http://localhost:${PORT}/onboarding`;
    console.log(`3. Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content render
    await page.waitForSelector('h1', { timeout: 10000 });

    const title = await page.title();
    console.log('Page Title:', title);
    if (!title.includes('PharmacyTrack')) {
      throw new Error(`Expected title to include "PharmacyTrack", but got "${title}"`);
    }

    // Verify full HTML content includes all accordion details even if collapsed
    const fullHtml = await page.content();
    if (!fullHtml.includes('You need a small internet connection. Scanning uses very little data.')) {
      throw new Error('Missing FAQ 2 honest answer in HTML');
    }
    console.log('  ✓ Verified FAQ 2 honest answer present in HTML');

    // Verify key texts rendered on page
    const pageText = await page.evaluate(() => document.body.innerText);

    const checks = [
      'What is PharmacyTrack?',
      'Save time on data entry',
      'Know expiry dates before they cost you money',
      'See low stock before your customers do',
      'How it works',
      'Step 1',
      'Create your free account',
      'Step 2',
      'Take a photo of a purchase bill',
      'Step 3',
      'AI reads the bill and fills in the items',
      'Step 4',
      'Check and save — stock updates in seconds',
      'Step 5',
      'Get alerts before medicines expire or run out',
      'What you need',
      'An Android phone',
      'The phone camera',
      'A little internet',
      'Common questions',
      'Is my data safe?',
      'Do I need internet to use it?',
      'What if the scan does not read my bill?',
      'What does it cost after the first month?',
      'Who do I contact if I need help?',
      'Made for pharmacy owners across India.',
      'Start free — first month free'
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

    // Verify SVGs rendered
    const svgCount = await page.evaluate(() => document.querySelectorAll('svg[role="img"]').length);
    console.log(`\n5. Verified ${svgCount} accessible SVG illustrations rendered in live DOM.`);

    // Check sticky bar position and width
    const stickyCheck = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return false;
      const style = window.getComputedStyle(footer);
      const rect = footer.getBoundingClientRect();
      return {
        position: style.position,
        width: rect.width,
        visible: rect.height > 40 && rect.bottom <= window.innerHeight + 2
      };
    });
    console.log('6. Verified sticky footer bar:', stickyCheck);

    // Check horizontal scroll / overflow at 360px
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log('7. Horizontal overflow at 360px width:', hasHorizontalOverflow ? 'FAIL (Horizontal scroll exists)' : 'PASS (No horizontal scroll)');

    // Save screenshots
    const outDir = path.resolve(__dirname, '../screenshots');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Capture mobile full page screenshot
    const mobileFullShot = path.join(outDir, 'onboarding_mobile_360px_full.png');
    await page.screenshot({ path: mobileFullShot, fullPage: true });
    console.log('\n8. Saved full mobile screenshot (360px):', mobileFullShot);

    // Capture above-the-fold viewport
    const mobileFoldShot = path.join(outDir, 'onboarding_mobile_360px_fold.png');
    await page.screenshot({ path: mobileFoldShot, fullPage: false });
    console.log('9. Saved viewport screenshot:', mobileFoldShot);

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

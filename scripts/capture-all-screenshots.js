const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.BASE_URL || 'https://medistock-pos.vercel.app';
const DEMO_USER = process.env.DEMO_USER || 'demo';
const DEMO_PASS = process.env.DEMO_PASSWORD || 'Demo@2026';

const ROOT_OUT_DIR = path.resolve(__dirname, '../screenshots');
const DESKTOP_OUT_DIR = 'C:\\Users\\andyk\\Desktop\\MediStock_Screenshots';

// Ensure output directories exist
[ROOT_OUT_DIR, DESKTOP_OUT_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function waitForContentReady(page, timeout = 15000) {
  try {
    // 1. Wait until splash is gone
    await page.waitForFunction(() => {
      const splash = document.getElementById('app-splash');
      return !splash || splash.classList.contains('fade-out') || splash.style.display === 'none';
    }, { timeout: 6000 }).catch(() => {});

    // 2. Wait until skeleton loaders are completely gone
    await page.waitForFunction(() => {
      return document.querySelectorAll('.MuiSkeleton-root').length === 0;
    }, { timeout }).catch(() => {});
  } catch (e) {
    // Graceful fallback if any placeholder is persistent
  }
  // Extra cushion for numbers, charts, and table rows to render smoothly
  await new Promise((r) => setTimeout(r, 1200));
}

async function saveScreenshot(page, filename, description) {
  console.log(`📸 Capturing: ${filename} (${description})...`);
  
  await waitForContentReady(page);

  const rootPath = path.join(ROOT_OUT_DIR, filename);
  const desktopPath = path.join(DESKTOP_OUT_DIR, filename);

  await page.screenshot({ path: rootPath, fullPage: false });
  fs.copyFileSync(rootPath, desktopPath);
  console.log(`   ✅ Saved: ${filename}`);
}

(async () => {
  console.log('========================================================');
  console.log('   🏥 MediStock Full Web Application Screenshot Capture');
  console.log('========================================================');
  console.log(`Target URL : ${BASE_URL}`);
  console.log(`Chrome Bin : ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1440,900',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // Ultra-sharp 2x retina output
    },
  });

  const page = await browser.newPage();

  try {
    // 1. LOGIN SCREEN
    console.log('\n[1/13] Navigating to Login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 45000 });
    await waitForContentReady(page);
    await saveScreenshot(page, '01_Login_Screen.png', 'Clean Authentication Card');

    // Perform Login
    console.log(`\nLogging in as '${DEMO_USER}'...`);
    const inputs = await page.$$('form input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type(DEMO_USER, { delay: 40 });
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type(DEMO_PASS, { delay: 40 });

      const submitBtn = await page.$('form button[type="submit"]');
      if (submitBtn) await submitBtn.click();
    }

    // Wait for Dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await waitForContentReady(page);

    // 2. DASHBOARD OVERVIEW
    console.log('\n[2/13] Dashboard Overview...');
    await saveScreenshot(page, '02_Dashboard_Overview.png', 'Stats, Quick Actions & Sales Overview');

    // 3. POS BILLING COUNTER
    console.log('\n[3/13] POS Billing Counter...');
    await page.goto(`${BASE_URL}/billing`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '03_POS_Billing_Counter.png', 'FEFO Fast Checkout & Cart Counter');

    // 4. MEDICINES INVENTORY CATALOG
    console.log('\n[4/13] Medicines Catalog...');
    await page.goto(`${BASE_URL}/medicines`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '04_Medicines_Catalog.png', 'Inventory Catalog, Racks & Batches');

    // 5. COMPANIES DIRECTORY
    console.log('\n[5/13] Companies Directory...');
    await page.goto(`${BASE_URL}/companies`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '05_Companies_Directory.png', 'Pharma Manufacturers & Distributors');

    // 6. PURCHASES & STOCK INWARD
    console.log('\n[6/13] Purchases & Stock Inward...');
    await page.goto(`${BASE_URL}/purchases`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '06_Purchases_Inward.png', 'Distributor Purchase Invoices & AI Scanner');

    // 7. KHATA / CUSTOMER LEDGER
    console.log('\n[7/13] Customer Khata...');
    await page.goto(`${BASE_URL}/khata`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '07_Khata_Customer_Ledger.png', 'Patient Udhar Book & Ledger');

    // 8. EXPIRY & LOW STOCK ALERTS
    console.log('\n[8/13] Alerts Dashboard...');
    await page.goto(`${BASE_URL}/alerts`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '08_Alerts_Expiry_LowStock.png', 'Clinical Expiry & Stockout Alerts');

    // 9. REPORTS & FINANCIAL ANALYTICS
    console.log('\n[9/13] Financial Reports...');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '09_Reports_Analytics.png', 'Sales Breakdown, Profit/Loss & Tax GST');

    // 10. SETTINGS STORE CONFIG
    console.log('\n[10/13] Settings Store Config...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '10_Settings_Store_Config.png', 'Store Profile, Taxes & Drug License');

    // 11. SETTINGS IMPORT DATA / MARG WIZARD
    console.log('\n[11/13] Settings Import Wizard Tab...');
    const tabs = await page.$$('.MuiTab-root');
    if (tabs.length >= 4) {
      await tabs[3].click(); // Tab index 3 is 'Import Data'
      await new Promise((r) => setTimeout(r, 1200));
    }
    await saveScreenshot(page, '11_Settings_Import_Wizard.png', 'Marg ERP & Excel Migration Importer');

    // 12. SUBSCRIPTION & BILLING PLANS
    console.log('\n[12/13] Subscription Plans...');
    await page.goto(`${BASE_URL}/subscription`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '12_Subscription_Plans.png', 'Starter, Pro, Elite & Founder Pack');

    // 13. REFERRALS & REWARDS
    console.log('\n[13/13] Referrals Program...');
    await page.goto(`${BASE_URL}/referrals`, { waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot(page, '13_Referrals_Program.png', 'Chemist Referral Code & Wallet Earnings');

    console.log('\n🎉 ALL 13 SCREENSHOTS CAPTURED SUCCESSFULLY!');
    console.log(`📁 Saved in repo   : ${ROOT_OUT_DIR}`);
    console.log(`📁 Saved on Desktop: ${DESKTOP_OUT_DIR}`);

  } catch (err) {
    console.error('❌ Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
})();

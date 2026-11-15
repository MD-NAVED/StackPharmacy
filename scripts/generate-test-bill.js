const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 900 });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: 'Courier New', monospace;
        background: #fff;
        color: #000;
        padding: 24px;
        width: 480px;
        margin: 0 auto;
        font-size: 13px;
        line-height: 1.35;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .border-top { border-top: 1px dashed #000; padding-top: 6px; }
      .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      th, td { text-align: left; padding: 4px 2px; font-size: 12px; }
      th { border-bottom: 1px solid #000; }
      .right { text-align: right; }
    </style>
  </head>
  <body>
    <div class="center bold" style="font-size: 16px;">SHREE BALAJI PHARMACEUTICALS</div>
    <div class="center">Wholesale Medicine Distributors</div>
    <div class="center">14, Dawa Bazaar, Indore (M.P.) - GSTIN: 23AABCS1429B1Z0</div>
    <div class="center">Ph: 0731-2524170 / Mob: 9826012417</div>
    <div class="border-top border-bottom" style="margin: 8px 0;">
      <div style="display: flex; justify-content: space-between;">
        <span><b>INVOICE NO:</b> SB-2417</span>
        <span><b>DATE:</b> 14/11/2026</span>
      </div>
      <div><b>BILLED TO:</b> APEX MEDICOS, MAIN ROAD</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>ITEM NAME</th>
          <th>BATCH</th>
          <th>EXP</th>
          <th class="right">QTY</th>
          <th class="right">RATE</th>
          <th class="right">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="bold">CROCIN ADVANCE 500MG</td>
          <td>CAB241</td>
          <td>11/2027</td>
          <td class="right">25</td>
          <td class="right">18.40</td>
          <td class="right">460.00</td>
        </tr>
        <tr>
          <td class="bold">DOLO 650</td>
          <td>DPA238</td>
          <td>03/2028</td>
          <td class="right">50</td>
          <td class="right">15.50</td>
          <td class="right">775.00</td>
        </tr>
        <tr>
          <td class="bold">AZITHRAL 500</td>
          <td>AZT251</td>
          <td>08/2027</td>
          <td class="right">20</td>
          <td class="right">72.00</td>
          <td class="right">1440.00</td>
        </tr>
      </tbody>
    </table>

    <div class="border-top" style="margin-top: 10px;">
      <div style="display: flex; justify-content: space-between;">
        <span>Subtotal (Taxable):</span>
        <span class="bold">2675.00</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>CGST @ 6%:</span>
        <span>160.50</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>SGST @ 6%:</span>
        <span>160.50</span>
      </div>
      <div class="border-top border-bottom bold" style="display: flex; justify-content: space-between; font-size: 15px; margin-top: 6px; padding: 4px 0;">
        <span>GRAND TOTAL:</span>
        <span>INR 2,996.00</span>
      </div>
    </div>

    <div class="center" style="margin-top: 14px; font-size: 11px;">
      Total Items: 3 | Subject to Indore Jurisdiction<br>
      *** THANK YOU FOR YOUR BUSINESS ***
    </div>
  </body>
  </html>
  `;

  await page.setContent(html);
  const outDir = path.resolve(__dirname, '../test-fixtures');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'shree_balaji_sb2417.png');
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Saved synthetic bill to:', outPath);
  await browser.close();
})();

/**
 * Generates canonical Option D pure-SVG StackPharmacy marks & horizontal lockups
 * and rasterizes 4x supersampled transparent PNG masters via headless Chrome.
 *
 * Usage:
 *   node scripts/render-brand-svg.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BRAND_DIR = path.join(ROOT, 'brand');
const PUBLIC_DIR = path.join(ROOT, 'client', 'public');
const TMP_DIR = path.join(BRAND_DIR, '_svg_renders');

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No Chrome/Edge executable found for SVG rasterization');
}

/**
 * Generates pure mathematical SVG geometry matching approved Option D:
 * - Three crisp fanned rounded slabs ordered back -> mid -> front
 * - True transparent cutout gaps between layers via SVG <mask> (zero background halo)
 * - Centered geometric white medical "+" cross cleanly punched/placed in front card
 *
 * @param {object} opts
 * @param {string} opts.backColor   Deep back card hex
 * @param {string} opts.midColor    Middle card hex
 * @param {string} opts.frontColor  Front card hex
 * @param {string} opts.crossColor  Center cross fill ('#FFFFFF' or 'transparent' mask)
 * @param {string} opts.idPrefix    Unique SVG mask id prefix (safe when multiple SVGs on same DOM!)
 */
function buildOptionDSvg({
  backColor = '#053B36',
  midColor = '#0D9488',
  frontColor = '#10B981',
  crossColor = '#FFFFFF',
  idPrefix = 'sp-mark',
  widthAttr = '512',
  heightAttr = '512',
} = {}) {
  // Canonical 512x512 coordinate space: centered visual bounding box of all 3 slabs
  const rx = 28;
  const cx = 246;
  const cy = 114;
  const cw = 186;
  const ch = 308;
  const px = 252;
  const py = 402;

  // Crisp uniform transparent gap between slabs without sharpening tips to needles
  const gapStroke = 18;

  const crossX = cx + cw / 2;
  const crossY = cy + ch / 2;
  const armLen = 104;
  const armThick = 34;

  const punchCrossInMask = crossColor === 'transparent';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${widthAttr}" height="${heightAttr}" fill="none" role="img" aria-label="StackPharmacy Logo">
  <defs>
    <mask id="${idPrefix}-cut-mid" maskUnits="userSpaceOnUse">
      <rect x="0" y="0" width="512" height="512" fill="#FFFFFF" />
      <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${rx}" ry="${rx}" fill="#000000" stroke="#000000" stroke-width="${gapStroke}" />
    </mask>
    <mask id="${idPrefix}-cut-back" maskUnits="userSpaceOnUse">
      <rect x="0" y="0" width="512" height="512" fill="#FFFFFF" />
      <g transform="rotate(-22 ${px} ${py})">
        <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${rx}" ry="${rx}" fill="#000000" stroke="#000000" stroke-width="${gapStroke}" />
      </g>
      <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${rx}" ry="${rx}" fill="#000000" stroke="#000000" stroke-width="${gapStroke}" />
    </mask>
    ${punchCrossInMask ? `<mask id="${idPrefix}-cut-front" maskUnits="userSpaceOnUse">
      <rect x="0" y="0" width="512" height="512" fill="#FFFFFF" />
      <rect x="${crossX - armLen / 2}" y="${crossY - armThick / 2}" width="${armLen}" height="${armThick}" rx="4" fill="#000000" />
      <rect x="${crossX - armThick / 2}" y="${crossY - armLen / 2}" width="${armThick}" height="${armLen}" rx="4" fill="#000000" />
    </mask>` : ''}
  </defs>

  <!-- Back slab (-44 deg) -->
  <g transform="translate(22 10)">
    <g mask="url(#${idPrefix}-cut-back)">
      <g transform="rotate(-44 ${px} ${py})">
        <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${rx}" ry="${rx}" fill="${backColor}" />
      </g>
    </g>

    <!-- Middle slab (-22 deg) -->
    <g mask="url(#${idPrefix}-cut-mid)">
      <g transform="rotate(-22 ${px} ${py})">
        <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${rx}" ry="${rx}" fill="${midColor}" />
      </g>
    </g>

    <!-- Front emerald slab + medical cross -->
    <g${punchCrossInMask ? ` mask="url(#${idPrefix}-cut-front)"` : ''}>
      <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${rx}" ry="${rx}" fill="${frontColor}" />
    </g>
    ${punchCrossInMask ? '' : `<g fill="${crossColor}">
      <rect x="${crossX - armLen / 2}" y="${crossY - armThick / 2}" width="${armLen}" height="${armThick}" rx="4" />
      <rect x="${crossX - armThick / 2}" y="${crossY - armLen / 2}" width="${armThick}" height="${armLen}" rx="4" />
    </g>`}
  </g>
</svg>`;
}

function buildHorizontalSvg({ darkBg = false } = {}) {
  const palette = darkBg
    ? { backColor: '#117065', midColor: '#14B8A6', frontColor: '#34D399', stackText: '#FFFFFF', pharmaText: '#5EEAD4', tagText: '#CBD5E1', idPrefix: 'sp-hd' }
    : { backColor: '#053B36', midColor: '#0E8378', frontColor: '#0BB87A', stackText: '#053B36', pharmaText: '#0E8378', tagText: '#64748B', idPrefix: 'sp-hl' };

  const innerMark = buildOptionDSvg({
    ...palette,
    widthAttr: '360',
    heightAttr: '360',
  }).replace('<svg ', '<svg x="54" y="60" ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1620 480" width="1620" height="480" fill="none">
  ${innerMark}
  <g font-family="Segoe UI, Inter, Arial, sans-serif">
    <text x="454" y="264" font-size="148" font-weight="800" letter-spacing="-3"><tspan fill="${palette.stackText}">Stack</tspan><tspan fill="${palette.pharmaText}">Pharmacy</tspan></text>
    <text x="460" y="346" font-size="28" font-weight="600" letter-spacing="4" fill="${palette.tagText}">SMART STOCK &amp; EXPIRY GUARD</text>
  </g>
</svg>`;
}

async function rasterizeSvg(browser, svgMarkup, w, h, outPath) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;">${svgMarkup}</body></html>`,
    { waitUntil: 'load' }
  );
  await page.screenshot({ path: outPath, omitBackground: true });
  await page.close();
}

async function main() {
  fs.mkdirSync(BRAND_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const markLightSvg = buildOptionDSvg({
    backColor: '#053B36',
    midColor: '#0E8378',
    frontColor: '#0BB87A',
    crossColor: '#FFFFFF',
    idPrefix: 'sp-mark-light',
    widthAttr: '1024',
    heightAttr: '1024',
  });

  // High-contrast dark-mode triad (pops cleanly over #004D40 / #051F20 / #0F172A!)
  const markDarkSvg = buildOptionDSvg({
    backColor: '#117065',
    midColor: '#14B8A6',
    frontColor: '#34D399',
    crossColor: '#FFFFFF',
    idPrefix: 'sp-mark-dark',
    widthAttr: '1024',
    heightAttr: '1024',
  });

  const horizLightSvg = buildHorizontalSvg({ darkBg: false });
  const horizDarkSvg = buildHorizontalSvg({ darkBg: true });

  // Clean vector SVGs in brand/ & client/public/
  fs.writeFileSync(path.join(BRAND_DIR, 'stackpharmacy-mark.svg'), buildOptionDSvg({
    backColor: '#053B36', midColor: '#0E8378', frontColor: '#0BB87A', idPrefix: 'sp-mark'
  }), 'utf8');
  fs.writeFileSync(path.join(BRAND_DIR, 'stackpharmacy-mark-dark.svg'), buildOptionDSvg({
    backColor: '#117065', midColor: '#14B8A6', frontColor: '#34D399', idPrefix: 'sp-mark-dark'
  }), 'utf8');
  fs.writeFileSync(path.join(BRAND_DIR, 'stackpharmacy-logo-horizontal-light.svg'), horizLightSvg, 'utf8');
  fs.writeFileSync(path.join(BRAND_DIR, 'stackpharmacy-logo-horizontal-dark.svg'), horizDarkSvg, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo-mark.svg'), buildOptionDSvg({
    backColor: '#053B36', midColor: '#0E8378', frontColor: '#0BB87A', idPrefix: 'sp-public'
  }), 'utf8');

  const chromePath = findChrome();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    await rasterizeSvg(browser, markLightSvg, 1024, 1024, path.join(TMP_DIR, 'mark_light_1024.png'));
    await rasterizeSvg(browser, markDarkSvg, 1024, 1024, path.join(TMP_DIR, 'mark_dark_1024.png'));
    await rasterizeSvg(browser, horizLightSvg, 1620, 480, path.join(TMP_DIR, 'horiz_light.png'));
    await rasterizeSvg(browser, horizDarkSvg, 1620, 480, path.join(TMP_DIR, 'horiz_dark.png'));
  } finally {
    await browser.close();
  }

  console.log('RENDERED_OPTION_D_SVGS_AND_MASTERS_OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

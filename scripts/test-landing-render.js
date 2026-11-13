/**
 * Verification & SSR Render Test for Landing Page ("/")
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('../client/node_modules/esbuild');

console.log('=== Running Landing Page Verification & Render Test ===\n');

// 1. Verify App.jsx public route registration directly in source
console.log('=== TEST 1: Router Registration in App.jsx ===');
const appCode = fs.readFileSync(path.resolve(__dirname, '../client/src/App.jsx'), 'utf8');
if (!appCode.includes('path="/"') || !appCode.includes('Landing')) {
  console.error('FAIL: App.jsx must register path="/" with Landing component');
  process.exit(1);
}
console.log('  PASS: Route "/" is registered as a public route with <Landing /> in App.jsx');

// 2. Prepare SSR Runner inside client directory
const clientDir = path.resolve(__dirname, '../client');
const tempEntry = path.join(clientDir, 'temp-landing-entry.jsx');
const tempBundle = path.join(clientDir, 'temp-landing-bundle.cjs');

const runnerCode = `
const origError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('useLayoutEffect') || args[0].includes('validateDOMNesting'))) return;
  origError(...args);
};
const origWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('useLayoutEffect')) return;
  origWarn(...args);
};

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const assert = require('assert');
const { MemoryRouter } = require('react-router-dom');
const createCache = require('@emotion/cache').default || require('@emotion/cache');
const { CacheProvider } = require('@emotion/react');

const cache = createCache({ key: 'css', prepend: true });

// Mock browser globals for SSR render test
global.navigator = { userAgent: 'Mozilla/5.0 (Linux; Android 10; Mobile)' };
global.window = {
  location: { pathname: '/', search: '', hash: '' },
  navigator: global.navigator,
  matchMedia: () => ({ matches: true, addListener: () => {}, removeListener: () => {} })
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const Landing = require('./src/pages/Landing.jsx').default;
const { AuthProvider } = require('./src/auth.jsx');
const branding = require('./src/config/branding.js');
const copy = require('./src/pages/landingCopy.js');

const html = ReactDOMServer.renderToString(
  React.createElement(MemoryRouter, { initialEntries: ['/'] },
    React.createElement(AuthProvider, null,
      React.createElement(CacheProvider, { value: cache },
        React.createElement(Landing)
      )
    )
  )
);

const cleanHtml = html.replace(/<!--.*?-->/g, '');

console.log('  PASS: Landing component rendered cleanly (' + html.length + ' bytes HTML output)\\n');

// Section 1 Tests (Hero)
console.log('=== TEST 2: Section 1 — Hero ===');
assert(cleanHtml.includes(branding.PRICING_SUMMARY), 'Must include pricing badge: ' + branding.PRICING_SUMMARY);
assert(cleanHtml.includes(copy.HERO_COPY.headline), 'Must include headline: ' + copy.HERO_COPY.headline);
assert(cleanHtml.includes(copy.HERO_COPY.subheadline), 'Must include subheadline: ' + copy.HERO_COPY.subheadline);
assert(cleanHtml.includes('href="/signup"'), 'Primary CTA must link to /signup');
assert(cleanHtml.includes('href="/onboarding"'), 'Secondary CTA must link to /onboarding');
assert(cleanHtml.includes('Phone mockup showing paper bill photo converting into live medicine stock list'), 'Hero SVG mockup must have alt text');
console.log('  PASS: Hero headline, subheadline, CTAs, badge, and SVG mockup verified');

// Section 2 Tests (Demo Video & Missing State)
console.log('\\n=== TEST 3: Section 2 — 60-Second Demo Video & Missing-File State ===');
assert(cleanHtml.includes(copy.VIDEO_COPY.title), 'Must include video title');
assert(cleanHtml.includes(copy.VIDEO_COPY.subtitle), 'Must include video subtitle');
assert(cleanHtml.includes(copy.VIDEO_COPY.missingCaption), 'Must include missing video caption');
assert(!cleanHtml.includes('<video'), 'Must NOT render broken <video> tag when video file is absent');
assert(cleanHtml.includes('Video preview frame showing a phone camera scanning a distributor bill with play button'), 'Poster SVG must have alt text');
console.log('  PASS: Missing-video state correctly renders ONLY poster frame with caption (zero broken tags)');

// Section 3 Tests ("Made for your counter")
console.log('\\n=== TEST 4: Section 3 — "Made for your counter" ===');
assert(cleanHtml.includes(copy.FEATURES_COPY.title), 'Must include "Made for your counter"');
assert(cleanHtml.includes('Works on the phone in your pocket'), 'Card 1 title verified');
assert(cleanHtml.includes('Set up in one day, not one week'), 'Card 2 title verified');
assert(cleanHtml.includes('Help on WhatsApp, in your language'), 'Card 3 title verified');
console.log('  PASS: All 3 feature cards verified');

// Section 4 Tests (Honest Pricing)
console.log('\\n=== TEST 5: Section 4 — Honest Pricing ===');
assert(cleanHtml.includes('First month — Free'), 'Must state First month — Free');
assert(cleanHtml.includes('Then ₹299 per month'), 'Must state Then ₹299 per month');
assert(cleanHtml.includes('No hidden fees. Cancel anytime.'), 'Must state guarantee');
assert(cleanHtml.includes('Start Your Free Month'), 'Must include pricing card CTA');

// Anti-Dark Pattern verification
const lower = cleanHtml.toLowerCase();
assert(!lower.includes('limited time'), 'Forbidden: limited time pressure');
assert(!lower.includes('hurry'), 'Forbidden: hurry pressure');
assert(!lower.includes('only today'), 'Forbidden: fake urgency');
console.log('  PASS: Honest pricing verified with zero dark patterns');

// Section 5 Tests (Final CTA & Footer)
console.log('\\n=== TEST 6: Section 5 — Final CTA & Footer ===');
assert(cleanHtml.includes('Want to see every single step first?'), 'Final CTA prompt verified');
assert(cleanHtml.includes('See the full 5-step guide'), 'Final CTA link text verified');
assert(cleanHtml.includes('href="/privacy"'), 'Footer must include link to /privacy');
assert(cleanHtml.includes('wa.me/' + branding.SUPPORT_WHATSAPP_NUMBER), 'Footer must include real WhatsApp support link');
assert(cleanHtml.includes(branding.BRAND_NAME), 'Footer must include brand name');
assert(cleanHtml.includes(branding.BRAND_TAGLINE.replace(/&/g, '&amp;')), 'Footer must include brand tagline');
console.log('  PASS: Final CTA and Footer links verified');

// Language & Quality Checks
console.log('\\n=== TEST 7: Language Purity & Code Hygiene ===');
const devanagariRegex = /[\\u0900-\\u097F]/;
assert(!devanagariRegex.test(html), 'Output must NOT contain any Devanagari characters');
assert(!cleanHtml.includes('TODO'), 'No TODO markers allowed');
assert(!cleanHtml.includes('FIXME'), 'No FIXME markers allowed');
assert(!cleanHtml.includes('Lorem ipsum'), 'No placeholder text allowed');
console.log('  PASS: Simple English purity and zero TODO/lorem text verified');

console.log('\\n🎉 ALL LANDING PAGE SSR ACCEPTANCE TESTS PASSED!\\n');
`;

fs.writeFileSync(tempEntry, runnerCode, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [tempEntry],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: tempBundle,
    format: 'cjs',
    loader: { '.js': 'jsx', '.jsx': 'jsx' },
    external: []
  });

  execSync('node ' + JSON.stringify(tempBundle), { stdio: 'inherit' });
} finally {
  try { fs.unlinkSync(tempEntry); } catch {}
  try { fs.unlinkSync(tempBundle); } catch {}
}

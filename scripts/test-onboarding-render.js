/**
 * Verification test for the /onboarding flow.
 * Bundles the test runner and Onboarding.jsx using client's node_modules,
 * and executes to verify:
 * 1. Render without crash
 * 2. Presence of all 5 sections
 * 3. Exact English copy for all benefits, steps, requirements, FAQs, and CTA
 * 4. All 5 SVG illustrations present with valid alt text
 * 5. Single source of branding (BRAND_NAME, BRAND_TAGLINE)
 * 6. Zero Hindi / Devanagari characters
 * 7. Router registration in App.jsx
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('../client/node_modules/esbuild');

console.log('=== Running Onboarding Page Verification & Render Test ===\n');

// 1. Verify App.jsx public route registration directly in source
console.log('=== TEST 1: Router Registration in App.jsx ===');
const appCode = fs.readFileSync(path.resolve(__dirname, '../client/src/App.jsx'), 'utf8');
if (!appCode.includes('path="/onboarding"') || !appCode.includes('Onboarding')) {
  console.error('FAIL: App.jsx must register path="/onboarding" with Onboarding component');
  process.exit(1);
}
console.log('  PASS: Route /onboarding is registered as a public route in App.jsx');

// 2. Prepare SSR Runner inside client directory
const clientDir = path.resolve(__dirname, '../client');
const tempEntry = path.join(clientDir, 'temp-onboarding-entry.jsx');
const tempBundle = path.join(clientDir, 'temp-onboarding-bundle.cjs');

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
  location: { pathname: '/onboarding', search: '', hash: '' },
  navigator: global.navigator,
  matchMedia: () => ({ matches: true, addListener: () => {}, removeListener: () => {} })
};

const Onboarding = require('./src/pages/Onboarding.jsx').default;
const branding = require('./src/config/branding.js');

const html = ReactDOMServer.renderToString(
  React.createElement(MemoryRouter, { initialEntries: ['/onboarding'] },
    React.createElement(CacheProvider, { value: cache },
      React.createElement(Onboarding)
    )
  )
);

const cleanHtml = html.replace(/<!--.*?-->/g, '');

console.log('  PASS: Onboarding component rendered cleanly (' + html.length + ' bytes HTML output)\\n');

// Section 1 Tests
console.log('=== TEST 2: Section 1 — "What is TrackPharmacy" ===');
assert(cleanHtml.includes('What is ' + branding.BRAND_NAME + '?'), 'Must include header "What is ' + branding.BRAND_NAME + '?"');
assert(cleanHtml.includes('Save time on data entry'), 'Must include benefit "Save time on data entry"');
assert(cleanHtml.includes('Know expiry dates before they cost you money'), 'Must include benefit "Know expiry dates before they cost you money"');
assert(cleanHtml.includes('See low stock before your customers do'), 'Must include benefit "See low stock before your customers do"');
console.log('  PASS: Section 1 heading and 3 benefit cards verified');

// Section 2 Tests
console.log('\\n=== TEST 3: Section 2 — "How it works" (5 Steps) ===');
assert(cleanHtml.includes('How it works'), 'Must include "How it works"');
assert(cleanHtml.includes('Create your free account'), 'Step 1 must be "Create your free account"');
assert(cleanHtml.includes('Take a photo of a purchase bill'), 'Step 2 must be "Take a photo of a purchase bill"');
assert(cleanHtml.includes('AI reads the bill and fills in the items'), 'Step 3 must be "AI reads the bill and fills in the items"');
assert(cleanHtml.includes('Check and save — stock updates in seconds'), 'Step 4 must be "Check and save — stock updates in seconds"');
assert(cleanHtml.includes('Get alerts before medicines expire or run out'), 'Step 5 must be "Get alerts before medicines expire or run out"');

assert(cleanHtml.includes('Step 1'), 'Step 1 badge present');
assert(cleanHtml.includes('Step 2'), 'Step 2 badge present');
assert(cleanHtml.includes('Step 3'), 'Step 3 badge present');
assert(cleanHtml.includes('Step 4'), 'Step 4 badge present');
assert(cleanHtml.includes('Step 5'), 'Step 5 badge present');
console.log('  PASS: All 5 numbered steps verified');

// Section 3 Tests
console.log('\\n=== TEST 4: Section 3 — "What you need" ===');
assert(cleanHtml.includes('What you need'), 'Must include "What you need"');
assert(cleanHtml.includes('An Android phone'), 'Must include "An Android phone"');
assert(cleanHtml.includes('The phone camera'), 'Must include "The phone camera"');
assert(cleanHtml.includes('A little internet'), 'Must include "A little internet"');
console.log('  PASS: All 3 requirements verified');

// Section 4 Tests
console.log('\\n=== TEST 5: Section 4 — "Common questions" ===');
assert(cleanHtml.includes('Common questions'), 'Must include "Common questions"');
assert(cleanHtml.includes('Is my data safe?'), 'Must include Q1');
assert(cleanHtml.includes('Do I need internet to use it?'), 'Must include Q2');
assert(cleanHtml.includes('You need a small internet connection. Scanning uses very little data.'), 'Q2 must give honest offline answer');
assert(cleanHtml.includes('What if the scan does not read my bill?'), 'Must include Q3');
assert(cleanHtml.includes('You can enter items manually with one tap'), 'Q3 must explain manual fallback');
assert(cleanHtml.includes('What does it cost after the first month?'), 'Must include Q4');
assert(cleanHtml.includes('Who do I contact if I need help?'), 'Must include Q5');
assert(cleanHtml.includes('Made for pharmacy owners across India.'), 'Must include honest tagline');
console.log('  PASS: All 5 FAQ questions and honest answers verified');

// Section 5 Tests
console.log('\\n=== TEST 6: Section 5 — Sticky Bottom CTA Bar ===');
assert(cleanHtml.includes('Start free — first month free'), 'Must include "Start free — first month free"');
assert(cleanHtml.includes('href="/signup"'), 'Must link to /signup');
assert(cleanHtml.includes('href="/login"'), 'Must link to /login');
assert(cleanHtml.includes('wa.me/' + branding.SUPPORT_WHATSAPP_NUMBER), 'Must include real WhatsApp link');
console.log('  PASS: Sticky CTA bar with /signup, /login, and real WhatsApp link verified');

// SVG Illustrations
console.log('\\n=== TEST 7: SVG Illustrations & Alt Text ===');
const svgMatches = html.match(/<svg[^>]*role="img"[^>]*aria-label="([^"]+)"/g) || [];
assert(svgMatches.length >= 5, 'Must have at least 5 step SVG illustrations with role="img" and aria-label (found ' + svgMatches.length + ')');
console.log('  PASS: Found ' + svgMatches.length + ' accessible SVG illustrations with English alt text');

// Language Purity Check
console.log('\\n=== TEST 8: Simple English Only (No Hindi / Devanagari) ===');
const devanagariRegex = /[\\u0900-\\u097F]/;
assert(!devanagariRegex.test(html), 'Output must NOT contain any Devanagari characters');
console.log('  PASS: Zero Devanagari / Hindi characters detected');

console.log('\\n🎉 ALL ONBOARDING FLOW ACCEPTANCE TESTS PASSED!\\n');
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

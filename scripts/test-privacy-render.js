/**
 * Verification & SSR Render Test for Privacy Policy Page ("/privacy")
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('../client/node_modules/esbuild');

console.log('=== Running Privacy Policy Verification & Render Test ===\n');

// 1. Verify App.jsx public route registration directly in source
console.log('=== TEST 1: Route Registration in App.jsx ===');
const appCode = fs.readFileSync(path.resolve(__dirname, '../client/src/App.jsx'), 'utf8');
if (!appCode.includes('path="/privacy"') || !appCode.includes('Privacy')) {
  console.error('FAIL: App.jsx must register public path="/privacy" with Privacy component');
  process.exit(1);
}
console.log('  PASS: Route "/privacy" is registered as a public route with <Privacy /> in App.jsx');

// 2. Prepare SSR Runner inside client directory
const clientDir = path.resolve(__dirname, '../client');
const tempEntry = path.join(clientDir, 'temp-privacy-entry.jsx');
const tempBundle = path.join(clientDir, 'temp-privacy-bundle.cjs');

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
  location: { pathname: '/privacy', search: '', hash: '' },
  navigator: global.navigator,
  scrollTo: () => {},
  matchMedia: () => ({ matches: true, addListener: () => {}, removeListener: () => {} })
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const Privacy = require('./src/pages/Privacy.jsx').default;
const branding = require('./src/config/branding.js');
const privacyCopy = require('./src/pages/privacyCopy.js');

const html = ReactDOMServer.renderToString(
  React.createElement(MemoryRouter, { initialEntries: ['/privacy'] },
    React.createElement(CacheProvider, { value: cache },
      React.createElement(Privacy)
    )
  )
);

const cleanHtml = html.replace(/<!--.*?-->/g, '');

console.log('  PASS: Privacy component rendered cleanly (' + html.length + ' bytes HTML output)\\n');

// Top Metadata
console.log('=== TEST 2: Effective Date & Version Metadata ===');
assert(cleanHtml.includes(privacyCopy.POLICY_METADATA.effectiveDate), 'Must include effective date: ' + privacyCopy.POLICY_METADATA.effectiveDate);
assert(cleanHtml.includes(privacyCopy.POLICY_METADATA.version), 'Must include version: ' + privacyCopy.POLICY_METADATA.version);
console.log('  PASS: Effective date and Version 1.0 verified');

// All 10 Sections
console.log('\\n=== TEST 3: All 10 Required Sections Present ===');
for (let i = 1; i <= 10; i++) {
  const sec = privacyCopy.PRIVACY_SECTIONS.find(s => s.number === i);
  assert(sec, 'Missing section definition for #' + i);
  assert(cleanHtml.includes(sec.title), 'Must include section title: ' + sec.title);
  console.log('  ✓ Section ' + i + ' verified: "' + sec.title + '"');
}

// Section 3: Google Gemini & Bill Image Discarding Disclosure
console.log('\\n=== TEST 4: Google Gemini & Bill Image Memory-Only Disclosure ===');
assert(
  cleanHtml.includes("When you scan a bill, the photo is sent securely to Google&#x27;s Gemini API so a computer can read the text. It is processed under Google&#x27;s API terms.") ||
  cleanHtml.includes("When you scan a bill, the photo is sent securely to Google's Gemini API so a computer can read the text. It is processed under Google's API terms."),
  'Must include exact required Gemini disclosure sentence'
);
assert(
  cleanHtml.includes('The image is never saved to our database, never written to disk, and is discarded immediately after the items are read.'),
  'Must state that bill photos are discarded in memory and not permanently stored'
);
assert(
  cleanHtml.includes('NVIDIA NIM'),
  'Must disclose NVIDIA NIM cloud backup processing'
);
console.log('  PASS: Google Gemini API disclosure and memory-only bill image discard verified');

// Section 4: What We Never Do (Commitments)
console.log('\\n=== TEST 5: Honest Commitments ("What we never do") ===');
assert(cleanHtml.includes('We never sell your data'), 'Must commit to not selling data');
assert(cleanHtml.includes('We never share with other pharmacies or distributors'), 'Must commit to no competitor sharing');
assert(cleanHtml.includes('We never use your data for advertising'), 'Must commit to no advertising profiling');
console.log('  PASS: Non-negotiable privacy commitments verified');

// Section 10: Real WhatsApp Contact & Zero Fake Placeholders
console.log('\\n=== TEST 6: Real Contact Information ===');
assert(cleanHtml.includes('9753880839'), 'Must include real support WhatsApp number (9753880839)');
assert(!cleanHtml.includes('support@example.com'), 'Must NOT have fake placeholder email');
assert(!cleanHtml.includes('example.com'), 'Must NOT have any example.com placeholder');
assert(!cleanHtml.includes('TODO'), 'Must NOT have any TODO markers');
console.log('  PASS: Real WhatsApp support link verified with zero fake emails');

// Language Purity
console.log('\\n=== TEST 7: Simple English Purity & Hygiene ===');
const devanagariRegex = /[\\u0900-\\u097F]/;
assert(!devanagariRegex.test(html), 'Output must NOT contain any Devanagari characters');
assert(!cleanHtml.includes('Lorem ipsum'), 'No placeholder text allowed');
console.log('  PASS: Zero Devanagari / Hindi characters and zero lorem text');

console.log('\\n🎉 ALL PRIVACY POLICY SSR ACCEPTANCE TESTS PASSED!\\n');
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

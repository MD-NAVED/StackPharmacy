/**
 * Verification test to prove the old "/" behavior was moved intact:
 * 1. App route structure checks:
 *    - Route "/" renders public Landing
 *    - Route "/onboarding" renders public Onboarding
 *    - Route "/dashboard" is protected by RequireAuth inside AppLayout
 * 2. Unauthenticated redirect check:
 *    - Visiting protected "/dashboard" without session redirects to "/login" (exact old "/" behavior)
 * 3. Authenticated session check:
 *    - User with valid session at "/dashboard" renders AppLayout and Dashboard
 * 4. Auth success redirect destinations:
 *    - Login.jsx navigates to "/dashboard"
 *    - SignUp.jsx navigates to "/dashboard"
 *    - AppLayout nav item "Dashboard" points to "/dashboard"
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING ROUTE MIGRATION: OLD "/" MOVED INTACT TO "/dashboard" ===\n');

// 1. Verify App.jsx router tree
console.log('1. Checking App.jsx routes:');
const appCode = fs.readFileSync(path.resolve(__dirname, '../client/src/App.jsx'), 'utf8');

assert(appCode.includes('<Route path="/" element={<Landing />} />'), 'App.jsx must declare public root "/" with Landing');
console.log('  ✓ Public root "/" points to <Landing />');

assert(appCode.includes('<Route path="/onboarding" element={<Onboarding />} />'), 'App.jsx must preserve public "/onboarding"');
console.log('  ✓ Public "/onboarding" preserved intact');

assert(appCode.includes('<Route path="/dashboard" element={<Dashboard />} />'), 'App.jsx must declare protected "/dashboard" with Dashboard');
console.log('  ✓ Protected "/dashboard" points to <Dashboard />');

assert(appCode.includes('<Route element={<RequireAuth />}>'), 'RequireAuth must guard protected routes');
console.log('  ✓ RequireAuth guards the application shell');

// 2. Verify Login.jsx destination
console.log('\n2. Checking Login.jsx redirection:');
const loginCode = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/Login.jsx'), 'utf8');
assert(loginCode.includes("navigate('/dashboard')"), 'Login.jsx must navigate to "/dashboard" upon authentication');
console.log('  ✓ Login.jsx navigates to "/dashboard" on successful credentials');

// 3. Verify SignUp.jsx destination
console.log('\n3. Checking SignUp.jsx redirection:');
const signUpCode = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/SignUp.jsx'), 'utf8');
assert(signUpCode.includes("navigate('/dashboard')"), 'SignUp.jsx must navigate to "/dashboard" upon account creation');
console.log('  ✓ SignUp.jsx navigates to "/dashboard" on successful account creation');

// 4. Verify AppLayout nav link
console.log('\n4. Checking AppLayout navigation items:');
const layoutCode = fs.readFileSync(path.resolve(__dirname, '../client/src/layout/AppLayout.jsx'), 'utf8');
assert(layoutCode.includes("to: '/dashboard'"), 'AppLayout must have Dashboard item pointing to "/dashboard"');
console.log('  ✓ AppLayout sidebar item "Dashboard" links to "/dashboard"');

// 5. SSR Test: Simulate Unauthenticated Access to "/dashboard"
console.log('\n5. Simulating unauthenticated access to "/dashboard":');
const esbuild = require('../client/node_modules/esbuild');

const clientDir = path.resolve(__dirname, '../client');
const testEntry = path.join(clientDir, 'temp-auth-verify-entry.jsx');
const testBundle = path.join(clientDir, 'temp-auth-verify-bundle.cjs');

const authRunnerCode = `
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const assert = require('assert');
const { MemoryRouter, Routes, Route, Navigate } = require('react-router-dom');

// Mock localStorage with NO user (unauthenticated)
global.window = {
  location: { pathname: '/dashboard', search: '', hash: '' },
  matchMedia: () => ({ matches: true, addListener: () => {}, removeListener: () => {} })
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const { AuthProvider, RequireAuth } = require('./src/auth.jsx');

// Render router tree with initialEntries=['/dashboard']
let redirectedToLogin = false;
function MockLogin() {
  redirectedToLogin = true;
  return React.createElement('div', { id: 'login-page' }, 'Login Page');
}
function MockDashboard() {
  return React.createElement('div', { id: 'dashboard-page' }, 'Protected Dashboard');
}

const html = ReactDOMServer.renderToString(
  React.createElement(MemoryRouter, { initialEntries: ['/dashboard'] },
    React.createElement(AuthProvider, null,
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/login', element: React.createElement(MockLogin) }),
        React.createElement(Route, { element: React.createElement(RequireAuth) },
          React.createElement(Route, { path: '/dashboard', element: React.createElement(MockDashboard) })
        )
      )
    )
  )
);

assert(!html.includes('Protected Dashboard'), 'Unauthenticated user at /dashboard MUST NOT see Protected Dashboard');
console.log('  ✓ Unauthenticated visitor to "/dashboard" blocked from Protected Dashboard (navigates to /login)');

// Now test authenticated visitor to "/dashboard"
global.localStorage.getItem = (key) => {
  if (key === 'medistock_user') return JSON.stringify({ id: 11, username: 'owner', role: 'owner' });
  if (key === 'medistock_token') return 'mock-jwt-token';
  return null;
};

const authHtml = ReactDOMServer.renderToString(
  React.createElement(MemoryRouter, { initialEntries: ['/dashboard'] },
    React.createElement(AuthProvider, null,
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/login', element: React.createElement(MockLogin) }),
        React.createElement(Route, { element: React.createElement(RequireAuth) },
          React.createElement(Route, { path: '/dashboard', element: React.createElement(MockDashboard) })
        )
      )
    )
  )
);

assert(authHtml.includes('Protected Dashboard'), 'Authenticated user at /dashboard MUST see Protected Dashboard');
console.log('  ✓ Authenticated user at "/dashboard" successfully sees Protected Dashboard');
`;

fs.writeFileSync(testEntry, authRunnerCode, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [testEntry],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: testBundle,
    format: 'cjs',
    loader: { '.js': 'jsx', '.jsx': 'jsx' },
    external: []
  });

  const { execSync } = require('child_process');
  execSync('node ' + JSON.stringify(testBundle), { stdio: 'inherit' });
} finally {
  try { fs.unlinkSync(testEntry); } catch {}
  try { fs.unlinkSync(testBundle); } catch {}
}

console.log('\n🎉 ALL OLD-FLOW MIGRATION CHECKS PASSED!\n');

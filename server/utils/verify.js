/**
 * verify.js
 * Quick end-to-end API smoke test.
 * Run with: node utils/verify.js
 * Requires the server to be running on port 5000.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const http = require('http');

const BASE = 'http://localhost:5000';
let cookie = '';

const request = (method, path, body) => new Promise((resolve, reject) => {
  const data = body ? JSON.stringify(body) : null;
  const opts = {
    hostname: 'localhost',
    port: 5000,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
    },
  };

  const req = http.request(opts, res => {
    // capture set-cookie
    const sc = res.headers['set-cookie'];
    if (sc) cookie = sc[0].split(';')[0];

    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
      catch { resolve({ status: res.statusCode, body: raw }); }
    });
  });

  req.on('error', reject);
  if (data) req.write(data);
  req.end();
});

const check = (label, status, expected) => {
  const ok = status === expected;
  console.log(`  ${ok ? '✅' : '❌'} ${label} → ${status}${ok ? '' : ` (expected ${expected})`}`);
  return ok;
};

const run = async () => {
  let passed = 0; let failed = 0;

  const test = async (label, fn, expectedStatus) => {
    try {
      const res = await fn();
      if (check(label, res.status, expectedStatus)) passed++;
      else failed++;
      return res;
    } catch (err) {
      console.log(`  ❌ ${label} → ERROR: ${err.message}`);
      failed++;
      return null;
    }
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SVMS API Smoke Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('General:');
  await test('Health check',            () => request('GET', '/api/health'), 200);
  await test('404 for unknown route',   () => request('GET', '/api/nope'),   404);

  console.log('\nAuth Guards (no token → 401):');
  await test('GET /api/vehicles',       () => request('GET', '/api/vehicles'),       401);
  await test('GET /api/drivers',        () => request('GET', '/api/drivers'),        401);
  await test('GET /api/bookings',       () => request('GET', '/api/bookings'),       401);
  await test('GET /api/maintenance',    () => request('GET', '/api/maintenance'),    401);
  await test('GET /api/dashboard/admin',() => request('GET', '/api/dashboard/admin'),401);

  console.log('\nPublic Routes (no auth needed):');
  await test('GET /api/routes',         () => request('GET', '/api/routes'),         200);
  await test('GET /api/routes/origins', () => request('GET', '/api/routes/origins'), 200);

  console.log('\nInput Validation:');
  await test('Register bad email → 400', () => request('POST', '/api/auth/register', { firstName:'X', lastName:'Y', email:'bad', password:'Pass1' }), 400);
  await test('Register short pass → 400', () => request('POST', '/api/auth/register', { firstName:'X', lastName:'Y', email:'ok@test.com', password:'ab' }), 400);
  await test('Login missing pass → 400', () => request('POST', '/api/auth/login', { email:'ok@test.com' }), 400);

  console.log('\nAuthentication (admin):');
  const loginRes = await test('Admin login → 200', () => request('POST', '/api/auth/login', { email: 'admin@svms.et', password: 'Admin@1234' }), 200);

  if (loginRes?.status === 200) {
    console.log('\nAuthenticated Endpoints:');
    await test('GET /api/vehicles → 200',    () => request('GET', '/api/vehicles'),        200);
    await test('GET /api/drivers → 200',     () => request('GET', '/api/drivers'),         200);
    await test('GET /api/routes → 200',      () => request('GET', '/api/routes'),          200);
    await test('GET /api/schedules → 200',   () => request('GET', '/api/schedules'),       200);
    await test('GET /api/bookings → 200',    () => request('GET', '/api/bookings'),        200);
    await test('GET /api/payments → 200',    () => request('GET', '/api/payments'),        200);
    await test('GET /api/tickets → 200',     () => request('GET', '/api/tickets'),         200);
    await test('GET /api/maintenance → 200', () => request('GET', '/api/maintenance'),     200);
    await test('GET /api/notifications → 200', () => request('GET', '/api/notifications'), 200);
    await test('GET /api/dashboard/admin → 200', () => request('GET', '/api/dashboard/admin'), 200);
    await test('GET /api/schedules/templates → 200', () => request('GET', '/api/schedules/templates'), 200);
  }

  console.log('\nAuthentication (passenger):');
  cookie = ''; // reset
  const pLoginRes = await test('Passenger login → 200', () => request('POST', '/api/auth/login', { email: 'passenger@svms.et', password: 'Pass@1234' }), 200);

  if (pLoginRes?.status === 200) {
    console.log('\nRole Enforcement (passenger cannot access admin resources):');
    await test('Passenger → POST vehicles → 403', () => request('POST', '/api/vehicles', {}), 403);
    await test('Passenger → POST drivers → 403',  () => request('POST', '/api/drivers', {}),  403);
    await test('Passenger → admin dashboard → 403', () => request('GET', '/api/dashboard/admin'), 403);
    console.log('\nRole Enforcement (passenger CAN access own resources):');
    await test('Passenger → GET bookings → 200', () => request('GET', '/api/bookings'), 200);
    await test('Passenger → GET tickets → 200',  () => request('GET', '/api/tickets'),  200);

    // Trip search
    const today = new Date(); today.setDate(today.getDate() + 1);
    const dateStr = today.toISOString().slice(0, 10);
    await test('Trip search Shashamane→Addis → 200',
      () => request('GET', `/api/schedules/search?origin=Shashamane&destination=Addis+Ababa&date=${dateStr}`), 200);
  }

  console.log('\nPassword Reset:');
  cookie = '';
  await test('Forgot password (prevents enumeration) → 200', () => request('POST', '/api/auth/forgot-password', { email: 'nobody@test.et' }), 200);
  await test('Reset with invalid token → 400', () => request('POST', '/api/auth/reset-password', { token: 'a'.repeat(64), password: 'NewPass1' }), 400);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const total = passed + failed;
  console.log(` Result: ${passed}/${total} checks passed ${failed > 0 ? `(${failed} failed)` : '✅'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(failed > 0 ? 1 : 0);
};

run().catch(err => {
  console.error('Verify script error:', err.message);
  console.error('Make sure the server is running: npm run dev --prefix server');
  process.exit(1);
});

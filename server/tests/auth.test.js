/**
 * auth.test.js
 * DB-dependent integration tests — registration, login, role enforcement.
 * Requires MONGODB_URI in server/.env pointing to an accessible Atlas cluster.
 *
 * PREREQUISITE: Add this machine's IP to Atlas → Network Access before running.
 *   Current IP: 213.55.85.89
 *   Atlas URL:  https://cloud.mongodb.com → Network Access → + Add IP Address
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Fix SRV DNS resolution — system stub resolver doesn't support SRV records
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../app');

const MONGO_URI  = process.env.MONGODB_URI || '';
const isRealDB   = MONGO_URI.length > 0 && !MONGO_URI.includes('REPLACE_ME');
const TS         = Date.now();
const TEST_EMAIL = `test_svms_${TS}@svms-test.et`;
const TEST_PASS  = 'Password1';

let dbConnected  = false;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!isRealDB) {
    console.warn('⚠️  No MongoDB URI — all DB tests will be skipped.');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    dbConnected = true;
    console.log(`✅ Connected to Atlas: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.error('   → Make sure IP 213.55.85.89 is in Atlas Network Access list.');
    // Don't throw — let tests skip gracefully instead of crashing
  }
}, 25000);

afterAll(async () => {
  if (dbConnected && mongoose.connection.readyState === 1) {
    const r = await mongoose.connection.collection('users')
      .deleteMany({ email: /^test_svms_/ });
    console.log(`🧹 Cleaned ${r.deletedCount} test user(s).`);
    await mongoose.disconnect();
  }
}, 15000);

// Skip helper — used inside tests
const skip = (label) => { console.log(`  ⏭  ${label} — skipped (no DB)`); };

// ─── Registration ─────────────────────────────────────────────────────────────

describe('Registration', () => {
  it('registers a new passenger → 201', async () => {
    if (!dbConnected) return skip('register');
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Musa', lastName: 'SVMS',
      email: TEST_EMAIL, password: TEST_PASS,
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.role).toBe('passenger');
    // Security: password hash must never be returned
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
    // Should set httpOnly cookie
    const cookie = res.headers['set-cookie']?.[0] || '';
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  }, 15000);

  it('rejects duplicate email → 409', async () => {
    if (!dbConnected) return skip('duplicate-email');
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Musa', lastName: 'SVMS',
      email: TEST_EMAIL, password: TEST_PASS,
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  }, 10000);
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('Login', () => {
  let authCookie = '';

  it('logs in with correct credentials → 200', async () => {
    if (!dbConnected) return skip('login');
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_EMAIL, password: TEST_PASS,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.role).toBe('passenger');
    authCookie = res.headers['set-cookie']?.[0] || '';
    expect(authCookie).toContain('token=');
  }, 10000);

  it('rejects wrong password → 401 (same msg prevents enumeration)', async () => {
    if (!dbConnected) return skip('wrong-password');
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_EMAIL, password: 'WrongPassword9',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  }, 10000);

  it('rejects unknown email → 401 (same msg prevents enumeration)', async () => {
    if (!dbConnected) return skip('unknown-email');
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost_user_that_does_not_exist@svms.et', password: 'Password1',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  }, 10000);

  it('GET /api/auth/me returns profile when authenticated → 200', async () => {
    if (!dbConnected || !authCookie) return skip('me');
    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.passwordHash).toBeUndefined();
  }, 10000);

  it('logout clears cookie → 200, subsequent /me returns 401', async () => {
    if (!dbConnected || !authCookie) return skip('logout');
    const logout = await request(app).post('/api/auth/logout').set('Cookie', authCookie);
    expect(logout.status).toBe(200);

    const cleared = logout.headers['set-cookie']?.[0] || '';
    expect(cleared).toContain('token=');

    // Using the cleared cookie should now fail
    const me = await request(app).get('/api/auth/me').set('Cookie', cleared);
    expect(me.status).toBe(401);
  }, 10000);
});

// ─── Role-Based Authorization ─────────────────────────────────────────────────

describe('Role-Based Authorization', () => {
  let passengerCookie = '';

  beforeAll(async () => {
    if (!dbConnected) return;
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_EMAIL, password: TEST_PASS,
    });
    passengerCookie = res.headers['set-cookie']?.[0] || '';
  }, 15000);

  it('passenger cannot CREATE vehicle → 403', async () => {
    if (!dbConnected || !passengerCookie) return skip('vehicle-create');
    const res = await request(app)
      .post('/api/vehicles')
      .set('Cookie', passengerCookie)
      .send({ vehicleCode: 'X001', plateNumber: 'AA-000', manufacturer: 'X', model: 'Y', year: 2020, capacity: 45, fuelType: 'diesel' });
    expect(res.status).toBe(403);
  }, 10000);

  it('passenger cannot access admin dashboard → 403', async () => {
    if (!dbConnected || !passengerCookie) return skip('admin-dashboard');
    const res = await request(app).get('/api/dashboard/admin').set('Cookie', passengerCookie);
    expect(res.status).toBe(403);
  }, 10000);

  it('passenger cannot CREATE driver → 403', async () => {
    if (!dbConnected || !passengerCookie) return skip('driver-create');
    const res = await request(app)
      .post('/api/drivers')
      .set('Cookie', passengerCookie)
      .send({});
    expect(res.status).toBe(403);
  }, 10000);

  it('passenger cannot CREATE maintenance record → 403', async () => {
    if (!dbConnected || !passengerCookie) return skip('maintenance-create');
    const res = await request(app)
      .post('/api/maintenance')
      .set('Cookie', passengerCookie)
      .send({});
    expect(res.status).toBe(403);
  }, 10000);

  it('passenger cannot DELETE vehicle → 403', async () => {
    if (!dbConnected || !passengerCookie) return skip('vehicle-delete');
    const res = await request(app)
      .delete('/api/vehicles/507f1f77bcf86cd799439011')
      .set('Cookie', passengerCookie);
    expect(res.status).toBe(403);
  }, 10000);

  it('passenger CAN view own bookings → 200', async () => {
    if (!dbConnected || !passengerCookie) return skip('bookings-own');
    const res = await request(app).get('/api/bookings').set('Cookie', passengerCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  }, 10000);

  it('passenger CAN view own tickets → 200', async () => {
    if (!dbConnected || !passengerCookie) return skip('tickets-own');
    const res = await request(app).get('/api/tickets').set('Cookie', passengerCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  }, 10000);

  it('passenger CAN view notifications → 200', async () => {
    if (!dbConnected || !passengerCookie) return skip('notifications');
    const res = await request(app).get('/api/notifications').set('Cookie', passengerCookie);
    expect(res.status).toBe(200);
  }, 10000);

  it('passenger CAN view passenger dashboard → 200', async () => {
    if (!dbConnected || !passengerCookie) return skip('passenger-dashboard');
    const res = await request(app).get('/api/dashboard/passenger').set('Cookie', passengerCookie);
    expect(res.status).toBe(200);
  }, 10000);
});

// ─── Password Reset ───────────────────────────────────────────────────────────

describe('Password Reset', () => {
  it('forgot-password with unknown email → 200 (prevents enumeration)', async () => {
    if (!dbConnected) return skip('forgot-password');
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'ghost@nobody.et',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Same message whether email exists or not
    expect(res.body.message).toMatch(/reset link/i);
  }, 10000);

  it('reset-password with expired/invalid token → 400', async () => {
    if (!dbConnected) return skip('reset-password');
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'a'.repeat(64),
      password: 'NewPassword1',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  }, 10000);
});

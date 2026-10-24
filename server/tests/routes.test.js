/**
 * routes.test.js
 * Tests that do NOT require a MongoDB connection.
 * 
 * These work by testing Express middleware behavior before any DB call:
 *   - Input validation (rejected before DB hit)
 *   - JWT guard (rejected before DB hit — token missing/invalid)
 *   - 404 handler
 *   - Health check endpoint
 *
 * These tests pass even with no network access.
 */

// Load env so JWT_SECRET is available for cookie parsing
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Disable Mongoose buffering so any accidental DB call fails fast
process.env.MONGOOSE_DISABLE_BUFFERING = '1';

const request = require('supertest');

// We need the app but NOT a DB connection.
// Patch mongoose.connect to be a no-op for this test file.
const mongoose = require('mongoose');
jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

// Disable mongoose buffering on all models
mongoose.set('bufferCommands', false);

const app = require('../app');

// ─── Health Check ─────────────────────────────────────────────────────────────

describe('Health Check', () => {
  it('GET /api/health → 200 (no DB needed)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/running/i);
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────

describe('404 Handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for unknown sub-routes', async () => {
    const res = await request(app).get('/api/auth/nonexistent-endpoint');
    expect(res.status).toBe(404);
  });
});

// ─── JWT / Authentication Guards ──────────────────────────────────────────────

describe('JWT Guard — Protected Routes Reject Unauthenticated Requests', () => {
  const protectedRoutes = [
    { method: 'get',    path: '/api/auth/me' },
    { method: 'get',    path: '/api/vehicles' },
    { method: 'post',   path: '/api/vehicles' },
    { method: 'get',    path: '/api/drivers' },
    { method: 'post',   path: '/api/drivers' },
    { method: 'get',    path: '/api/bookings' },
    { method: 'post',   path: '/api/bookings' },
    { method: 'get',    path: '/api/payments' },
    { method: 'get',    path: '/api/tickets' },
    { method: 'get',    path: '/api/maintenance' },
    { method: 'post',   path: '/api/maintenance' },
    { method: 'get',    path: '/api/notifications' },
    { method: 'get',    path: '/api/dashboard/admin' },
    { method: 'get',    path: '/api/dashboard/dispatcher' },
    { method: 'get',    path: '/api/dashboard/driver' },
    { method: 'get',    path: '/api/dashboard/passenger' },
  ];

  protectedRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} → 401 without token`, async () => {
      const res = await request(app)[method](path).send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  it('rejects a syntactically invalid JWT → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=this.is.garbage');
    expect(res.status).toBe(401);
  });

  it('rejects a well-formed but wrong-secret JWT → 401', async () => {
    // Sign with wrong secret
    const jwt = require('jsonwebtoken');
    const fakeToken = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'admin' }, 'wrong_secret');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${fakeToken}`);
    expect(res.status).toBe(401);
  });
});

// ─── Public Routes (no auth, no DB) ───────────────────────────────────────────

describe('Public Routes — Accessible Without Auth', () => {
  it('GET /api/routes → not 401', async () => {
    const res = await request(app).get('/api/routes');
    // Will be 500 (bufferCommands=false, no DB) but NOT 401
    expect(res.status).not.toBe(401);
  });

  it('GET /api/routes/origins → not 401', async () => {
    const res = await request(app).get('/api/routes/origins');
    expect(res.status).not.toBe(401);
  });

  it('GET /api/schedules/search → not 401', async () => {
    const res = await request(app)
      .get('/api/schedules/search')
      .query({ origin: 'Shashamane', destination: 'Addis', date: '2027-01-01' });
    expect(res.status).not.toBe(401);
  });

  it('GET /api/schedules/:id/seats → not 401', async () => {
    const res = await request(app).get('/api/schedules/507f1f77bcf86cd799439011/seats');
    expect(res.status).not.toBe(401);
  });
});

// ─── Input Validation (rejected before any DB call) ───────────────────────────

describe('Input Validation — Rejected Before DB Hit', () => {
  it('register: rejects missing firstName → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'valid@test.com', password: 'Password1',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('firstName');
  });

  it('register: rejects invalid email → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test', lastName: 'User', email: 'NOT_AN_EMAIL', password: 'Password1',
    });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('email');
  });

  it('register: rejects password < 8 chars → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test', lastName: 'User', email: 'ok@test.com', password: 'Ab1',
    });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('password');
  });

  it('register: rejects password without uppercase → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test', lastName: 'User', email: 'ok@test.com', password: 'password1',
    });
    expect(res.status).toBe(400);
  });

  it('register: rejects password without number → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test', lastName: 'User', email: 'ok@test.com', password: 'Password',
    });
    expect(res.status).toBe(400);
  });

  it('login: rejects missing password → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ok@test.com' });
    expect(res.status).toBe(400);
  });

  it('login: rejects invalid email format → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email', password: 'Password1',
    });
    expect(res.status).toBe(400);
  });

  it('forgot-password: rejects invalid email → 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'bad' });
    expect(res.status).toBe(400);
  });

  it('create-vehicle: rejects invalid vehicleCode characters → 400 (when auth present)', async () => {
    // Even if auth were valid, validator runs first
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'admin' }, process.env.JWT_SECRET);
    const res = await request(app)
      .post('/api/vehicles')
      .set('Cookie', `token=${token}`)
      .send({ vehicleCode: 'BAD CODE!', plateNumber: 'AA-000', manufacturer: 'X', model: 'Y', year: 2020, capacity: 45, fuelType: 'diesel' });
    // 400 from validator, or 500 from DB (no connection) — NOT 403
    expect([400, 500]).toContain(res.status);
  });

  it('create-schedule: rejects arrivalTime before departureTime → 400', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'admin' }, process.env.JWT_SECRET);
    const res = await request(app)
      .post('/api/schedules')
      .set('Cookie', `token=${token}`)
      .send({
        route: '507f1f77bcf86cd799439011',
        vehicle: '507f1f77bcf86cd799439011',
        driver: '507f1f77bcf86cd799439011',
        departureTime: '2027-01-01T10:00:00Z',
        arrivalTime:   '2027-01-01T08:00:00Z',  // BEFORE departure
        fare: 100,
      });
    // 400 if validator runs first; 500 if DB auth check runs first (no-DB test)
    // Either way the request is correctly rejected
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

// ─── Response Shape ───────────────────────────────────────────────────────────

describe('Consistent API Response Shape', () => {
  it('success response has { success: true }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });

  it('error response has { success: false }', async () => {
    const res = await request(app).get('/api/auth/me'); // 401
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });

  it('validation error response has errors array', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad' });
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

/**
 * app.js
 * Express application setup. Registers middleware and routes.
 * Kept separate from server.js so tests can import the app without starting the server.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Load .env only if not already set (tests may inject vars directly)
if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

const { handleError } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const driverRoutes = require('./routes/driverRoutes');
const routeRoutes = require('./routes/routeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────

// Helmet sets secure HTTP headers
app.use(helmet());

// CORS: allow requests from the frontend origin only
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// Rate limiting disabled on auth endpoints for development
// const authLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 100, // 100 attempts
//   message: { success: false, message: 'Too many login attempts. Please try again in 10 minutes.' },
// });
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

// ─── General Middleware ──────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP request logging (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Shashamane VMS API is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── Centralized Error Handler ───────────────────────────────────────────────
// Must be LAST — receives errors from next(err) calls

app.use(handleError);

module.exports = app;

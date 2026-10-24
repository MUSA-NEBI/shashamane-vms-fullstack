# SVMS Development Guide

## Quick Reference

### Start the application

```bash
# Terminal 1 — backend
npm run dev:server       # http://localhost:5000

# Terminal 2 — frontend  
npm run dev:client       # http://localhost:5173
```

### Other useful commands

```bash
# Seed the database with demo data
npm run seed --prefix server

# Re-seed from scratch (CLEARS ALL DATA)
npm run seed:fresh --prefix server

# Run all backend tests (requires DB connection)
npm test --prefix server

# Run smoke test against live server
npm run verify --prefix server

# Build frontend for production
npm run build:client
```

---

## Architecture Overview

```
Browser (React)
    ↕  HTTP + cookies
Vite Dev Server :5173  ──proxy /api──→  Express :5000
                                              ↕
                                        MongoDB Atlas
```

- **Frontend** talks only to `/api/*` — the Vite proxy handles forwarding to the backend.
- **JWT** is stored in an `httpOnly` cookie. The frontend never reads it directly.
- **Auth** is always enforced server-side. Hiding buttons in React is UX only.

---

## Module Index

| Module | Frontend Page | Backend Routes |
|--------|--------------|----------------|
| Auth | `/login`, `/register`, etc. | `POST /api/auth/*` |
| Users | `/admin/users` | `GET/PATCH /api/dashboard/admin/users` |
| Vehicles | `/admin/vehicles` | `GET/POST/PATCH/DELETE /api/vehicles` |
| Drivers | `/admin/drivers` | `GET/POST/PATCH/DELETE /api/drivers` |
| Routes | `/admin/routes` | `GET/POST/PATCH/DELETE /api/routes` |
| Schedules | `/admin/schedules` | `GET/POST/PATCH/DELETE /api/schedules` |
| Templates | `/admin/templates` | `GET/POST/PATCH/DELETE /api/schedules/templates` |
| Bookings | `/admin/bookings`, `/passenger/bookings` | `GET/POST /api/bookings` |
| Payments | `/admin/payments` | `GET/POST /api/payments` |
| Tickets | `/admin/tickets`, `/passenger/tickets` | `GET/POST /api/tickets` |
| Maintenance | `/admin/maintenance` | `GET/POST/PATCH/DELETE /api/maintenance` |
| Notifications | (Topbar bell) | `GET/PATCH /api/notifications` |
| Dashboards | Role-specific pages | `GET /api/dashboard/*` |
| Reports | `/admin/reports` | Uses `/api/dashboard/admin` |

---

## Payment Flow (Development)

There is no live payment gateway. The dev flow is:

1. Passenger searches trips → selects seat → `POST /api/bookings` → status: `pending`
2. On booking detail, selects payment method → `POST /api/payments/initiate`
3. Immediately → `POST /api/payments/:id/confirm` (simulates cash payment)
4. Booking → `confirmed`, ticket issued automatically with QR code

**To add Chapa or Stripe later:** Replace step 3 with a real gateway redirect, then handle the webhook in a new endpoint that calls `issueTicket(bookingId)` after verifying the transaction.

---

## Adding a Real Payment Gateway (Chapa example)

```javascript
// server/routes/paymentRoutes.js — add webhook
router.post('/chapa/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // 1. Verify Chapa signature
  // 2. Find payment by transactionReference
  // 3. If status === 'success': confirm payment + issue ticket
  // 4. If status === 'failed': mark payment failed
});
```

---

## Seat Reservation Concurrency

Two passengers cannot book the same seat simultaneously. The mechanism:

```javascript
// In bookingService.js
const updated = await Schedule.findOneAndUpdate(
  {
    _id: scheduleId,
    bookedSeats: { $not: { $elemMatch: { $eq: seatNumber } } }, // seat must be free
  },
  { $addToSet: { bookedSeats: seatNumber } },
  { new: true, session }
);
// If null → another request got the seat first → throw 409
```

This is wrapped in a MongoDB transaction for full atomicity on replica sets.

---

## Environment Variables

All secrets live in `server/.env` — never commit this file.

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string (mongodb+srv://) |
| `JWT_SECRET` | Min 64 chars random string for JWT signing |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `PORT` | Backend port (default 5000) |
| `CLIENT_URL` | Frontend URL for CORS (default http://localhost:5173) |
| `NODE_ENV` | `development` or `production` |

---

## Seeded Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@svms.et | Admin@1234 |
| Dispatcher | dispatch@svms.et | Dispatch@1234 |
| Driver | driver1@svms.et | Driver@1234 |
| Driver | driver2@svms.et | Driver@1234 |
| Passenger | passenger@svms.et | Pass@1234 |

---

## Project File Map (key files)

```
server/
  app.js                    — Express app setup, middleware, routes
  server.js                 — Entry point, DB connect, HTTP listen
  config/database.js        — Mongoose connection with DNS fix
  config/constants.js       — All enum values (statuses, roles, etc.)
  models/                   — Mongoose schemas
  controllers/              — HTTP request handlers
  services/authService.js   — Argon2 hashing, JWT, login/register
  services/bookingService.js — Atomic seat reservation
  services/ticketService.js  — QR code generation, ticket issuance
  middleware/auth.js         — protect() and authorize() middleware
  middleware/errorHandler.js — Centralized error handler + AppError
  utils/seed.js             — Database seeder
  utils/verify.js           — API smoke test (no test framework needed)
  tests/auth.test.js        — DB-connected integration tests
  tests/routes.test.js      — No-DB middleware/validation tests

client/
  src/App.jsx               — Root: BrowserRouter + AuthProvider + ToastContainer
  src/hooks/useAuth.jsx     — Auth context: user, login, logout, register
  src/hooks/useFetch.js     — Generic data fetching hook
  src/hooks/useNotifications.js — Polling notification hook
  src/layouts/Sidebar.jsx   — Role-based navigation sidebar
  src/layouts/Topbar.jsx    — Header with notifications + user menu
  src/routes/AppRoutes.jsx  — All route definitions + role guards
  src/routes/ProtectedRoute.jsx — Auth + role redirect wrapper
  src/services/api.js       — Axios instance with interceptors
  src/styles/global.css     — Design tokens + global styles
```

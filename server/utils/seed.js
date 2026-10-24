/**
 * seed.js
 * Populates the database with initial data for development and demonstration.
 *
 * Usage:
 *   node utils/seed.js          — seeds all collections
 *   node utils/seed.js --clear  — clears ALL data first, then seeds
 *
 * WARNING: --clear deletes all records. Never run on production.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose  = require('mongoose');
const argon2    = require('argon2');

const User              = require('../models/User');
const Vehicle           = require('../models/Vehicle');
const Driver            = require('../models/Driver');
const Route             = require('../models/Route');
const Schedule          = require('../models/Schedule');
const ScheduleTemplate  = require('../models/ScheduleTemplate');

const CLEAR = process.argv.includes('--clear');

// ─── Seed Data ─────────────────────────────────────────────────────────────

const USERS = [
  { firstName: 'System',    lastName: 'Admin',       email: 'admin@svms.et',      password: 'Admin@1234',      role: 'admin' },
  { firstName: 'Dispatch',  lastName: 'Officer',     email: 'dispatch@svms.et',   password: 'Dispatch@1234',   role: 'dispatcher' },
  { firstName: 'Abebe',     lastName: 'Girma',       email: 'driver1@svms.et',    password: 'Driver@1234',     role: 'driver' },
  { firstName: 'Tigist',    lastName: 'Bekele',      email: 'driver2@svms.et',    password: 'Driver@1234',     role: 'driver' },
  { firstName: 'Musa',      lastName: 'Ibrahim',     email: 'passenger@svms.et',  password: 'Pass@1234',       role: 'passenger' },
];

const VEHICLES_DATA = [
  { vehicleCode: 'SHM-001', plateNumber: 'AA-12345', manufacturer: 'Isuzu',   model: 'NQR',      year: 2020, capacity: 45, fuelType: 'diesel', color: 'White', status: 'active' },
  { vehicleCode: 'SHM-002', plateNumber: 'AA-23456', manufacturer: 'Yutong',  model: 'ZK6122H9', year: 2021, capacity: 55, fuelType: 'diesel', color: 'Blue',  status: 'active' },
  { vehicleCode: 'SHM-003', plateNumber: 'AA-34567', manufacturer: 'Toyota',  model: 'Coaster',  year: 2019, capacity: 30, fuelType: 'petrol', color: 'White', status: 'active' },
  { vehicleCode: 'SHM-004', plateNumber: 'AA-45678', manufacturer: 'Higer',   model: 'KLQ6129Q', year: 2022, capacity: 49, fuelType: 'diesel', color: 'Yellow',status: 'maintenance' },
];

const ROUTES_DATA = [
  { routeName: 'Shashamane — Addis Ababa Express', origin: 'Shashamane', destination: 'Addis Ababa', totalDistance: 250, estimatedDuration: 240, baseFare: 180, isActive: true, description: 'Direct express route via Ziway' },
  { routeName: 'Shashamane — Hawassa',             origin: 'Shashamane', destination: 'Hawassa',     totalDistance:  26, estimatedDuration:  35, baseFare:  40, isActive: true, description: 'Short route to Hawassa city' },
  { routeName: 'Shashamane — Dilla',               origin: 'Shashamane', destination: 'Dilla',       totalDistance: 120, estimatedDuration: 150, baseFare: 110, isActive: true, description: 'Southern route to Dilla' },
  { routeName: 'Shashamane — Shashemene Bus Station', origin: 'Shashamane', destination: 'Shashemene Bus Station', totalDistance: 5, estimatedDuration: 15, baseFare: 10, isActive: true },
  { routeName: 'Addis Ababa — Shashamane Return',  origin: 'Addis Ababa', destination: 'Shashamane', totalDistance: 250, estimatedDuration: 240, baseFare: 180, isActive: true, description: 'Return trip from Addis' },
];

const DRIVER_PROFILES = [
  { employeeId: 'DRV-001', licenseNumber: 'ETH-DL-123456', licenseClass: 'C', licenseExpiry: '2027-06-30', yearsOfExperience: 8 },
  { employeeId: 'DRV-002', licenseNumber: 'ETH-DL-654321', licenseClass: 'C', licenseExpiry: '2026-12-31', yearsOfExperience: 5 },
];

// ─── Seeder ─────────────────────────────────────────────────────────────────

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected to MongoDB');

  if (CLEAR) {
    console.log('🗑️  Clearing all collections…');
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Route.deleteMany({}),
      Schedule.deleteMany({}),
      ScheduleTemplate.deleteMany({}),
    ]);
    console.log('   Done.\n');
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('👤 Seeding users…');
  const createdUsers = {};
  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      createdUsers[u.email] = existing;
      console.log(`   ↳ ${u.email} already exists — skipped`);
      continue;
    }
    const passwordHash = await argon2.hash(u.password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 });
    const user = await User.create({ firstName: u.firstName, lastName: u.lastName, email: u.email, passwordHash, role: u.role });
    createdUsers[u.email] = user;
    console.log(`   ✓ Created ${u.role}: ${u.email}  (password: ${u.password})`);
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────
  console.log('\n🚌 Seeding vehicles…');
  const vehicleMap = {};
  for (const v of VEHICLES_DATA) {
    const existing = await Vehicle.findOne({ vehicleCode: v.vehicleCode });
    if (existing) { vehicleMap[v.vehicleCode] = existing; console.log(`   ↳ ${v.vehicleCode} exists`); continue; }
    const vehicle = await Vehicle.create(v);
    vehicleMap[v.vehicleCode] = vehicle;
    console.log(`   ✓ ${vehicle.vehicleCode} — ${vehicle.manufacturer} ${vehicle.model} (${vehicle.capacity} seats)`);
  }

  // ── Routes ────────────────────────────────────────────────────────────────
  console.log('\n🗺️  Seeding routes…');
  const routeMap = {};
  for (const r of ROUTES_DATA) {
    const existing = await Route.findOne({ routeName: r.routeName });
    if (existing) { routeMap[r.routeName] = existing; console.log(`   ↳ ${r.routeName} exists`); continue; }
    const route = await Route.create(r);
    routeMap[r.routeName] = route;
    console.log(`   ✓ ${route.origin} → ${route.destination} (${route.totalDistance}km, ETB ${route.baseFare})`);
  }

  // ── Driver Profiles ───────────────────────────────────────────────────────
  console.log('\n🪪  Seeding driver profiles…');
  const driverUsers = [createdUsers['driver1@svms.et'], createdUsers['driver2@svms.et']];
  const driverDocs  = [];

  for (let i = 0; i < DRIVER_PROFILES.length; i++) {
    const dUser = driverUsers[i];
    if (!dUser) continue;
    const existing = await Driver.findOne({ user: dUser._id });
    if (existing) { driverDocs.push(existing); console.log(`   ↳ Driver for ${dUser.email} exists`); continue; }
    const prof   = DRIVER_PROFILES[i];
    const driver = await Driver.create({ user: dUser._id, ...prof, licenseExpiry: new Date(prof.licenseExpiry) });
    driverDocs.push(driver);
    console.log(`   ✓ ${dUser.firstName} ${dUser.lastName} (${prof.employeeId})`);
  }

  // ── Schedules ─────────────────────────────────────────────────────────────
  console.log('\n📅 Seeding schedules…');

  const mainRoute    = routeMap['Shashamane — Addis Ababa Express'];
  const hawassaRoute = routeMap['Shashamane — Hawassa'];
  const dillaRoute   = routeMap['Shashamane — Dilla'];
  const vehicle1     = vehicleMap['SHM-001'];
  const vehicle2     = vehicleMap['SHM-002'];
  const vehicle3     = vehicleMap['SHM-003'];
  const driver1      = driverDocs[0];
  const driver2      = driverDocs[1];

  if (mainRoute && vehicle1 && driver1) {
    const schedulesToCreate = [];
    // Next 7 days — morning + afternoon departures
    for (let d = 0; d < 7; d++) {
      const base = new Date();
      base.setDate(base.getDate() + d);

      // 06:00 departure
      const dep1 = new Date(base); dep1.setHours(6, 0, 0, 0);
      const arr1 = new Date(dep1.getTime() + mainRoute.estimatedDuration * 60000);

      // 14:00 departure
      const dep2 = new Date(base); dep2.setHours(14, 0, 0, 0);
      const arr2 = new Date(dep2.getTime() + mainRoute.estimatedDuration * 60000);

      schedulesToCreate.push(
        { route: mainRoute._id, vehicle: vehicle1._id, driver: driver1._id, departureTime: dep1, arrivalTime: arr1, fare: mainRoute.baseFare },
        { route: mainRoute._id, vehicle: vehicle2._id, driver: driver2 ? driver2._id : driver1._id, departureTime: dep2, arrivalTime: arr2, fare: mainRoute.baseFare }
      );
    }

    // Hawassa short route
    for (let d = 0; d < 5; d++) {
      const base = new Date();
      base.setDate(base.getDate() + d);
      const dep = new Date(base); dep.setHours(8, 30, 0, 0);
      const arr = new Date(dep.getTime() + (hawassaRoute?.estimatedDuration || 35) * 60000);
      if (hawassaRoute && vehicle3 && driver1) {
        schedulesToCreate.push({ route: hawassaRoute._id, vehicle: vehicle3._id, driver: driver1._id, departureTime: dep, arrivalTime: arr, fare: hawassaRoute.baseFare });
      }
    }

    let created = 0;
    for (const s of schedulesToCreate) {
      // Check for existing conflict
      const exists = await Schedule.findOne({ vehicle: s.vehicle, departureTime: s.departureTime });
      if (!exists) {
        await Schedule.create(s);
        created++;
      }
    }
    console.log(`   ✓ Created ${created} schedules (${schedulesToCreate.length - created} already existed)`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────');
  console.log('✅ Seeding complete!\n');
  console.log('📋 Login credentials:');
  console.log('   Admin:      admin@svms.et        / Admin@1234');
  console.log('   Dispatcher: dispatch@svms.et     / Dispatch@1234');
  console.log('   Driver 1:   driver1@svms.et      / Driver@1234');
  console.log('   Driver 2:   driver2@svms.et      / Driver@1234');
  console.log('   Passenger:  passenger@svms.et    / Pass@1234');
  console.log('\n🌐 App URL: http://localhost:5173');
  console.log('─────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

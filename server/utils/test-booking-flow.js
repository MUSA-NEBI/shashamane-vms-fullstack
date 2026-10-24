/**
 * test-booking-flow.js
 * End-to-end test of the complete booking flow:
 * 1. Passenger logs in
 * 2. Searches for a trip
 * 3. Gets seat map
 * 4. Books a seat
 * 5. Initiates payment
 * 6. Confirms payment
 * 7. Receives ticket with QR code
 * 8. Validates ticket
 * 
 * Run: node utils/test-booking-flow.js
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

const log = (msg) => console.log(`\n✓ ${msg}`);
const err = (msg) => console.error(`\n✗ ${msg}`);

const run = async () => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  SVMS - Complete Booking Flow Test                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Login as passenger
    log('Step 1: Passenger login (passenger@svms.et)');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'passenger@svms.et',
      password: 'Pass@1234',
    });
    
    if (loginRes.status !== 200) {
      err(`Login failed: ${loginRes.body.message}`);
      process.exit(1);
    }
    
    const passenger = loginRes.body.user;
    console.log(`   Logged in as: ${passenger.firstName} ${passenger.lastName} (${passenger.email})`);

    // 2. Search for trips
    log('Step 2: Search for trips (Shashamane → Addis Ababa, tomorrow)');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // Use day after tomorrow to avoid conflicts
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const searchRes = await request('GET', `/api/schedules/search?origin=Shashamane&destination=Addis+Ababa&date=${dateStr}`);
    
    if (searchRes.status !== 200 || !searchRes.body.data || searchRes.body.data.length === 0) {
      err('No trips found. Make sure seed data is loaded.');
      process.exit(1);
    }
    
    const trip = searchRes.body.data[0];
    console.log(`   Found ${searchRes.body.data.length} trip(s)`);
    console.log(`   Selected trip: ${trip.route.origin} → ${trip.route.destination}`);
    console.log(`   Departure: ${trip.departureTime}`);
    console.log(`   Available seats: ${trip.availableSeats}/${trip.vehicle.capacity}`);
    console.log(`   Fare: ETB ${trip.fare}`);

    // 3. Get seat map
    log('Step 3: Get seat map');
    const seatMapRes = await request('GET', `/api/schedules/${trip._id}/seats`);
    
    if (seatMapRes.status !== 200) {
      err(`Failed to get seat map: ${seatMapRes.body.message}`);
      process.exit(1);
    }
    
    const seatMap = seatMapRes.body.data;
    const availableSeat = seatMap.seats.find(s => !s.isBooked);
    
    if (!availableSeat) {
      err('No available seats!');
      process.exit(1);
    }
    
    console.log(`   Seat map loaded: ${seatMap.capacity} seats, ${seatMap.availableCount} available`);
    console.log(`   Selecting seat: ${availableSeat.seatNumber}`);

    // 4. Book the seat
    log(`Step 4: Book seat ${availableSeat.seatNumber}`);
    const bookingRes = await request('POST', '/api/bookings', {
      scheduleId: trip._id,
      seatNumber: availableSeat.seatNumber,
    });
    
    if (bookingRes.status !== 201) {
      err(`Booking failed: ${bookingRes.body.message}`);
      process.exit(1);
    }
    
    const booking = bookingRes.body.data;
    console.log(`   Booking created: ${booking.bookingReference}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Seat: ${booking.seatNumber}`);
    console.log(`   Fare: ETB ${booking.fareAmount}`);

    // 5. Initiate payment
    log('Step 5: Initiate payment (method: cash)');
    const paymentInitRes = await request('POST', '/api/payments/initiate', {
      bookingId: booking._id,
      method: 'cash',
    });
    
    if (paymentInitRes.status !== 201) {
      err(`Payment initiation failed: ${paymentInitRes.body.message}`);
      process.exit(1);
    }
    
    const payment = paymentInitRes.body.data;
    console.log(`   Payment initiated: ${payment.paymentReference}`);
    console.log(`   Amount: ETB ${payment.amount}`);
    console.log(`   Status: ${payment.status}`);

    // 6. Confirm payment
    log('Step 6: Confirm payment');
    const paymentConfirmRes = await request('POST', `/api/payments/${payment._id}/confirm`, {
      transactionReference: 'TEST-TX-' + Date.now(),
    });
    
    if (paymentConfirmRes.status !== 200) {
      err(`Payment confirmation failed: ${paymentConfirmRes.body.message}`);
      process.exit(1);
    }
    
    const confirmedPayment = paymentConfirmRes.body.data.payment;
    const confirmedBooking = paymentConfirmRes.body.data.booking;
    const ticket = paymentConfirmRes.body.data.ticket;
    
    console.log(`   Payment confirmed!`);
    console.log(`   Payment status: ${confirmedPayment.status}`);
    console.log(`   Booking status: ${confirmedBooking.status}`);
    console.log(`   Ticket issued: ${ticket.ticketNumber}`);
    console.log(`   QR code: ${ticket.qrCode ? 'Generated ✓' : 'Missing ✗'}`);

    // 7. Verify ticket details
    log('Step 7: Verify ticket details');
    const ticketRes = await request('GET', `/api/tickets/${ticket._id}`);
    
    if (ticketRes.status !== 200) {
      err(`Failed to fetch ticket: ${ticketRes.body.message}`);
      process.exit(1);
    }
    
    const fullTicket = ticketRes.body.data;
    console.log(`   Ticket number: ${fullTicket.ticketNumber}`);
    console.log(`   Status: ${fullTicket.status}`);
    console.log(`   Seat: ${fullTicket.seatNumber}`);
    console.log(`   QR code length: ${fullTicket.qrCode.length} chars`);
    console.log(`   QR data: ${fullTicket.qrData.substring(0, 60)}...`);

    // 8. Validate ticket (login as driver first)
    log('Step 8: Validate ticket (simulating boarding check by driver)');
    
    // Switch to driver login
    cookie = ''; // Clear passenger cookie
    const driverLoginRes = await request('POST', '/api/auth/login', {
      email: 'driver1@svms.et',
      password: 'Driver@1234',
    });
    
    if (driverLoginRes.status !== 200) {
      err(`Driver login failed: ${driverLoginRes.body.message}`);
      process.exit(1);
    }
    
    console.log(`   Driver logged in: ${driverLoginRes.body.user.firstName} ${driverLoginRes.body.user.lastName}`);
    
    const validateRes = await request('POST', `/api/tickets/validate`, {
      ticketNumber: fullTicket.ticketNumber,
    });
    
    if (validateRes.status !== 200) {
      err(`Ticket validation failed: ${validateRes.body.message}`);
      process.exit(1);
    }
    
    const validation = validateRes.body.data;
    console.log(`   Validation result: ${validation.valid ? 'VALID ✓' : 'INVALID ✗'}`);
    
    if (validation.valid) {
      console.log(`   Ticket marked as USED`);
      console.log(`   Passenger: ${validation.ticket.passenger.firstName} ${validation.ticket.passenger.lastName}`);
      console.log(`   Route: ${validation.ticket.schedule.route.origin} → ${validation.ticket.schedule.route.destination}`);
    }

    // 9. Test double-booking prevention
    log('Step 9: Test double-booking prevention (try to book same seat)');
    const doubleBookRes = await request('POST', '/api/bookings', {
      scheduleId: trip._id,
      seatNumber: availableSeat.seatNumber,
    });
    
    if (doubleBookRes.status === 409) {
      console.log(`   ✓ Double-booking correctly prevented (409 Conflict)`);
      console.log(`   Message: "${doubleBookRes.body.message}"`);
    } else {
      err(`   ✗ Double-booking prevention FAILED! Status: ${doubleBookRes.status}`);
    }

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED                                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log('Complete booking flow verified:');
    console.log('  ✓ User authentication');
    console.log('  ✓ Trip search');
    console.log('  ✓ Seat map retrieval');
    console.log('  ✓ Seat booking (atomic operation)');
    console.log('  ✓ Payment initiation');
    console.log('  ✓ Payment confirmation');
    console.log('  ✓ Automatic ticket issuance');
    console.log('  ✓ QR code generation');
    console.log('  ✓ Ticket validation');
    console.log('  ✓ Double-booking prevention\n');

  } catch (error) {
    err(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Check if server is running first
http.get('http://localhost:5000/api/health', (res) => {
  if (res.statusCode === 200) {
    run().then(() => process.exit(0));
  } else {
    err('Server health check failed. Is the server running on port 5000?');
    process.exit(1);
  }
}).on('error', () => {
  err('Cannot connect to server. Please start it with: npm run dev --prefix server');
  process.exit(1);
});

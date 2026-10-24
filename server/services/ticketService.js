/**
 * ticketService.js
 * Generates tickets after booking confirmation + payment completion.
 */

const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const generateReference = require('../utils/generateReference');
const generateQRCode = require('../utils/generateQRCode');
const { AppError } = require('../middleware/errorHandler');
const { BOOKING_STATUS, PAYMENT_STATUS, TICKET_STATUS } = require('../config/constants');
const { notifyTicketIssued } = require('./notificationService');

/**
 * Issue a ticket for a booking once payment is confirmed.
 * Idempotent: returns existing ticket if one was already issued.
 */
const issueTicket = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate({
    path: 'schedule',
    populate: { path: 'route' },
  });

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new AppError('Ticket can only be issued for confirmed bookings.', 400);
  }

  // Check for existing ticket (idempotency)
  const existingTicket = await Ticket.findOne({ booking: bookingId });
  if (existingTicket) {
    return existingTicket;
  }

  // Verify payment is complete
  const payment = await Payment.findOne({ booking: bookingId, status: PAYMENT_STATUS.COMPLETED });
  if (!payment) {
    throw new AppError('Payment must be completed before a ticket can be issued.', 400);
  }

  // Generate unique ticket number
  const ticketNumber = generateReference('TK');

  // QR data: essential info for offline validation
  const qrData = {
    ticketNumber,
    bookingRef: booking.bookingReference,
    scheduleId: booking.schedule._id.toString(),
    seat: booking.seatNumber,
    route: booking.schedule.route
      ? `${booking.schedule.route.origin} → ${booking.schedule.route.destination}`
      : 'N/A',
    departure: booking.schedule.departureTime,
    passengerId: booking.passenger.toString(),
  };

  const { qrCode, qrData: qrDataString } = await generateQRCode(qrData);

  const ticket = await Ticket.create({
    ticketNumber,
    booking: bookingId,
    passenger: booking.passenger,
    schedule: booking.schedule._id,
    seatNumber: booking.seatNumber,
    qrCode,
    qrData: qrDataString,
    status: TICKET_STATUS.VALID,
  });

  // Mark booking as having a ticket
  booking.ticketIssued = true;
  await booking.save({ validateBeforeSave: false });

  notifyTicketIssued(booking.passenger, ticketNumber);

  return ticket;
};

/**
 * Validate a ticket by its number (e.g., at boarding).
 * Marks it as used if valid.
 */
const validateTicket = async (ticketNumber) => {
  const ticket = await Ticket.findOne({ ticketNumber })
    .populate('passenger', 'firstName lastName email')
    .populate({
      path: 'schedule',
      populate: { path: 'route', select: 'origin destination' },
    });

  if (!ticket) {
    return { valid: false, reason: 'Ticket not found.' };
  }

  if (ticket.status === TICKET_STATUS.USED) {
    return { valid: false, reason: 'This ticket has already been used.', ticket };
  }

  if (ticket.status === TICKET_STATUS.CANCELLED) {
    return { valid: false, reason: 'This ticket has been cancelled.', ticket };
  }

  if (ticket.status === TICKET_STATUS.EXPIRED) {
    return { valid: false, reason: 'This ticket has expired.', ticket };
  }

  // Check if the schedule departure time has passed (more than 2 hours ago = expired)
  if (ticket.schedule?.departureTime) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (ticket.schedule.departureTime < twoHoursAgo) {
      ticket.status = TICKET_STATUS.EXPIRED;
      await ticket.save({ validateBeforeSave: false });
      return { valid: false, reason: 'This ticket has expired.', ticket };
    }
  }

  // Mark as used
  ticket.status = TICKET_STATUS.USED;
  ticket.usedAt = new Date();
  await ticket.save({ validateBeforeSave: false });

  return { valid: true, ticket };
};

module.exports = { issueTicket, validateTicket };

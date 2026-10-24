/**
 * bookingController.js
 */

const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { reserveSeat, cancelBooking } = require('../services/bookingService');
const { BOOKING_STATUS } = require('../config/constants');

// GET /api/bookings  (admin/dispatcher see all; passenger sees own)
const getBookings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, search } = req.query;

    const filter = {};
    if (req.user.role === 'passenger') filter.passenger = req.user._id;
    if (status) filter.status = status;
    if (search) filter.bookingReference = { $regex: search, $options: 'i' };

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('passenger', 'firstName lastName email phone')
        .populate({
          path: 'schedule',
          populate: [
            { path: 'route', select: 'routeName origin destination' },
            { path: 'vehicle', select: 'vehicleCode plateNumber' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    return sendPaginated(res, bookings, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passenger', 'firstName lastName email phone')
      .populate({
        path: 'schedule',
        populate: [
          { path: 'route', select: 'routeName origin destination estimatedDuration' },
          { path: 'vehicle', select: 'vehicleCode plateNumber capacity model' },
          { path: 'driver', populate: { path: 'user', select: 'firstName lastName phone' } },
        ],
      });

    if (!booking) throw new AppError('Booking not found.', 404);

    // Passengers can only see their own bookings
    if (req.user.role === 'passenger' && booking.passenger._id.toString() !== req.user._id.toString()) {
      throw new AppError('You are not authorized to view this booking.', 403);
    }

    // Attach payment and ticket info
    const payment = await Payment.findOne({ booking: booking._id }).select('-gatewayResponse');
    const ticket = await Ticket.findOne({ booking: booking._id }).select('-qrCode');

    return sendSuccess(res, { data: { ...booking.toObject(), payment, ticket } });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { scheduleId, seatNumber } = req.body;
    if (!scheduleId || !seatNumber) {
      throw new AppError('scheduleId and seatNumber are required.', 400);
    }

    const booking = await reserveSeat(req.user._id, scheduleId, parseInt(seatNumber, 10));
    return sendSuccess(res, { data: booking }, 'Seat reserved. Please complete payment.', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/:id/cancel
const cancelBookingHandler = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const isAdmin = ['admin', 'dispatcher'].includes(req.user.role);
    const booking = await cancelBooking(req.params.id, req.user._id, reason, isAdmin);
    return sendSuccess(res, { data: booking }, 'Booking cancelled successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getBookings, getBooking, createBooking, cancelBookingHandler };

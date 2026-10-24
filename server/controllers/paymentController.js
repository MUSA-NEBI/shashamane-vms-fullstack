/**
 * paymentController.js
 * 
 * Development payment flow:
 *  1. POST /api/payments/initiate  — creates a PENDING payment record
 *  2. POST /api/payments/:id/confirm  — marks payment COMPLETED (dev/cash simulation)
 *     In production this would be a webhook from a payment gateway.
 */

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { PAYMENT_STATUS, PAYMENT_METHOD, BOOKING_STATUS } = require('../config/constants');
const generateReference = require('../utils/generateReference');
const { issueTicket } = require('../services/ticketService');
const { notifyPaymentReceived } = require('../services/notificationService');

// POST /api/payments/initiate
const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;

    if (!bookingId || !method) {
      throw new AppError('bookingId and payment method are required.', 400);
    }

    if (!Object.values(PAYMENT_METHOD).includes(method)) {
      throw new AppError(`Invalid payment method. Use: ${Object.values(PAYMENT_METHOD).join(', ')}`, 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError('Booking not found.', 404);

    // Passengers can only pay for their own bookings
    if (req.user.role === 'passenger' && booking.passenger.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized.', 403);
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new AppError('Cannot pay for a cancelled booking.', 400);
    }

    // Check for existing payment
    const existing = await Payment.findOne({ booking: bookingId, status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.COMPLETED] } });
    if (existing && existing.status === PAYMENT_STATUS.COMPLETED) {
      throw new AppError('This booking has already been paid.', 400);
    }
    if (existing && existing.status === PAYMENT_STATUS.PENDING) {
      return sendSuccess(res, { data: existing }, 'Payment already initiated. Complete it to confirm.');
    }

    const paymentReference = generateReference('PAY');

    const payment = await Payment.create({
      booking: bookingId,
      passenger: booking.passenger,
      amount: booking.fareAmount,
      method,
      status: PAYMENT_STATUS.PENDING,
      paymentReference,
    });

    return sendSuccess(res, { data: payment }, 'Payment initiated. Complete payment to confirm your booking.', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/:id/confirm  — DEV/cash: manually confirm a payment
// In production, replace this with a proper gateway webhook endpoint
const confirmPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError('Payment not found.', 404);

    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      throw new AppError('Payment is already completed.', 400);
    }

    if (payment.status === PAYMENT_STATUS.FAILED) {
      throw new AppError('Cannot confirm a failed payment. Initiate a new one.', 400);
    }

    // Mark payment as completed
    payment.status = PAYMENT_STATUS.COMPLETED;
    payment.paidAt = new Date();
    if (req.body.transactionReference) {
      payment.transactionReference = req.body.transactionReference;
    }
    await payment.save();

    // Confirm the booking
    const booking = await Booking.findByIdAndUpdate(
      payment.booking,
      { status: BOOKING_STATUS.CONFIRMED },
      { new: true }
    );

    // Issue ticket automatically
    const ticket = await issueTicket(booking._id);

    notifyPaymentReceived(payment.passenger, payment.paymentReference, payment.amount);

    return sendSuccess(res, {
      data: { payment, booking, ticket },
    }, 'Payment confirmed. Your ticket has been issued.');
  } catch (err) {
    next(err);
  }
};

// GET /api/payments  (admin sees all, passenger sees own)
const getPayments = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const filter = {};
    if (req.user.role === 'passenger') filter.passenger = req.user._id;
    if (status) filter.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('passenger', 'firstName lastName email')
        .populate({
          path: 'booking',
          populate: { path: 'schedule', populate: { path: 'route', select: 'origin destination' } },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return sendPaginated(res, payments, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/:id/refund  (admin only)
const refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError('Payment not found.', 404);

    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      throw new AppError('Only completed payments can be refunded.', 400);
    }

    payment.status = PAYMENT_STATUS.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundReason = req.body.reason || 'No reason provided';
    await payment.save();

    // Revert booking to cancelled
    await Booking.findByIdAndUpdate(payment.booking, { status: BOOKING_STATUS.CANCELLED });

    return sendSuccess(res, { data: payment }, 'Payment refunded successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { initiatePayment, confirmPayment, getPayments, refundPayment };

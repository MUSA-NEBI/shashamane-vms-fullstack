/**
 * ticketController.js
 */

const Ticket = require('../models/Ticket');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { issueTicket, validateTicket } = require('../services/ticketService');

// GET /api/tickets  (passenger sees own; admin sees all)
const getTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const filter = {};
    if (req.user.role === 'passenger') filter.passenger = req.user._id;
    if (status) filter.status = status;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('passenger', 'firstName lastName email')
        .populate({
          path: 'schedule',
          populate: { path: 'route', select: 'routeName origin destination' },
        })
        .populate('booking', 'bookingReference fareAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(filter),
    ]);

    return sendPaginated(res, tickets, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/:id  — includes QR code
const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('passenger', 'firstName lastName email phone')
      .populate({
        path: 'schedule',
        populate: [
          { path: 'route', select: 'routeName origin destination estimatedDuration' },
          { path: 'vehicle', select: 'vehicleCode plateNumber model' },
          { path: 'driver', populate: { path: 'user', select: 'firstName lastName' } },
        ],
      })
      .populate('booking', 'bookingReference fareAmount seatNumber');

    if (!ticket) throw new AppError('Ticket not found.', 404);

    if (req.user.role === 'passenger' && ticket.passenger._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to view this ticket.', 403);
    }

    return sendSuccess(res, { data: ticket });
  } catch (err) {
    next(err);
  }
};

// POST /api/tickets/validate  — used at boarding
const validateTicketHandler = async (req, res, next) => {
  try {
    const { ticketNumber } = req.body;
    if (!ticketNumber) throw new AppError('Ticket number is required.', 400);

    const result = await validateTicket(ticketNumber);

    return sendSuccess(res, { data: result }, result.valid ? 'Ticket is valid.' : 'Ticket is not valid.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTickets, getTicket, validateTicketHandler };

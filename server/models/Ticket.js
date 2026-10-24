/**
 * Ticket.js
 * Issued after booking is confirmed and payment is completed.
 * Contains a QR code for validation at boarding.
 */

const mongoose = require('mongoose');
const { TICKET_STATUS } = require('../config/constants');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      uppercase: true,
      // unique enforced via schema.index() below — not both
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      // unique enforced via schema.index() below
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    seatNumber: {
      type: Number,
      required: true,
    },
    qrCode:  { type: String, required: true },
    qrData:  { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.VALID,
    },
    issuedAt: { type: Date, default: Date.now },
    usedAt:   { type: Date },
  },
  { timestamps: true }
);

// Define unique indexes once here — not both in field definition AND here
ticketSchema.index({ ticketNumber: 1 }, { unique: true });
ticketSchema.index({ booking: 1 },      { unique: true });
ticketSchema.index({ passenger: 1 });
ticketSchema.index({ schedule: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);

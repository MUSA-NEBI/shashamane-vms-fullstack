/**
 * Booking.js
 * Records a passenger's reservation for a specific seat on a schedule.
 */

const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      uppercase: true,
      // unique enforced via schema.index() below
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger is required'],
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: [true, 'Schedule is required'],
    },
    seatNumber: {
      type: Number,
      required: [true, 'Seat number is required'],
      min: [1, 'Seat number must be at least 1'],
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    // Snapshot of fare at time of booking — preserved even if route fare changes later
    fareAmount: {
      type: Number,
      required: [true, 'Fare amount is required'],
      min: [0, 'Fare cannot be negative'],
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Set to true once a ticket has been issued for this booking
    ticketIssued: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ passenger: 1, status: 1 });
bookingSchema.index({ schedule: 1, seatNumber: 1 }, { unique: true });
bookingSchema.index({ bookingReference: 1 }, { unique: true });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

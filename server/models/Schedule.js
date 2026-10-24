/**
 * Schedule.js
 * A specific trip instance. Connects route, vehicle, and driver for a specific date/time.
 * 
 * CONCURRENCY NOTE: bookedSeats uses a Set-like array. The booking service uses
 * MongoDB's $addToSet with a conditional update to prevent double-booking atomically.
 */

const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../config/constants');

const scheduleSchema = new mongoose.Schema(
  {
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route is required'],
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver is required'],
    },
    departureTime: {
      type: Date,
      required: [true, 'Departure time is required'],
    },
    arrivalTime: {
      type: Date,
      required: [true, 'Arrival time is required'],
    },
    status: {
      type: String,
      enum: Object.values(SCHEDULE_STATUS),
      default: SCHEDULE_STATUS.SCHEDULED,
    },
    // Tracks which seat numbers are booked.
    // Seat numbers are 1-based integers up to vehicle.capacity.
    // We use $addToSet with a size condition for atomic seat reservation.
    bookedSeats: {
      type: [Number],
      default: [],
    },
    fare: {
      type: Number,
      required: [true, 'Fare is required'],
      min: [0, 'Fare cannot be negative'],
    }, // Can override route baseFare for special trips
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Reference to the template if generated from a recurring schedule
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduleTemplate',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ route: 1, departureTime: 1 });
scheduleSchema.index({ vehicle: 1, departureTime: 1 });
scheduleSchema.index({ driver: 1, departureTime: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ departureTime: 1 });
scheduleSchema.index({ isDeleted: 1 });

scheduleSchema.pre(/^find/, function (next) {
  if (typeof this.where === 'function' && typeof this.getOptions === 'function') {
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  }
  if (typeof next === 'function') next();
});

// Virtual: available seat count
scheduleSchema.virtual('availableSeats').get(function () {
  // Note: capacity is populated from vehicle — only works when vehicle is populated
  if (this.vehicle && this.vehicle.capacity !== undefined) {
    return this.vehicle.capacity - this.bookedSeats.length;
  }
  return undefined;
});

module.exports = mongoose.model('Schedule', scheduleSchema);

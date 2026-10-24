/**
 * ScheduleTemplate.js
 * Recurring schedule template. Used to generate individual Schedule documents.
 * For example: "Every Monday and Wednesday, Bus SHM-001 departs at 06:00"
 */

const mongoose = require('mongoose');

const scheduleTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    // Days of week: 0=Sunday, 1=Monday, ..., 6=Saturday
    daysOfWeek: {
      type: [Number],
      required: [true, 'At least one day of week is required'],
      validate: {
        validator: (arr) => arr.length > 0 && arr.every((d) => d >= 0 && d <= 6),
        message: 'Days of week must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    // Time as HH:MM string — applied to each generated schedule date
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Departure time must be in HH:MM format'],
    },
    // Duration in minutes — arrival = departure + duration
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be positive'],
    },
    fare: {
      type: Number,
      required: [true, 'Fare is required'],
      min: [0, 'Fare cannot be negative'],
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduleTemplateSchema.index({ route: 1, isActive: 1 });

module.exports = mongoose.model('ScheduleTemplate', scheduleTemplateSchema);

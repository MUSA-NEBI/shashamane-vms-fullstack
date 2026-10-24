/**
 * Vehicle.js
 * Represents a bus/vehicle in the fleet.
 */

const mongoose = require('mongoose');
const { VEHICLE_STATUS, VEHICLE_FUEL } = require('../config/constants');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleCode: {
      type: String,
      required: [true, 'Vehicle code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Vehicle code must be alphanumeric'],
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [200, 'Capacity cannot exceed 200'],
    },
    fuelType: {
      type: String,
      enum: Object.values(VEHICLE_FUEL),
      required: [true, 'Fuel type is required'],
    },
    status: {
      type: String,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.ACTIVE,
    },
    color: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    // Soft delete — we never hard-delete vehicles with trip history
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

vehicleSchema.index({ status: 1 });
vehicleSchema.index({ isDeleted: 1 });

// Default filter: exclude soft-deleted records
vehicleSchema.pre(/^find/, function (next) {
  // Only apply to Query instances (not aggregation or other contexts)
  if (typeof this.where === 'function' && typeof this.getOptions === 'function') {
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  }
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

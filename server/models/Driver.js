/**
 * Driver.js
 * Driver profile. References the User model for account/login details.
 */

const mongoose = require('mongoose');
const { DRIVER_STATUS } = require('../config/constants');

const driverSchema = new mongoose.Schema(
  {
    // Links to the user account for login
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    licenseClass: {
      type: String,
      required: [true, 'License class is required'],
      trim: true,
      // e.g. "B", "C", "C1", "D" — Ethiopian license classes
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    dateOfBirth: {
      type: Date,
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: Object.values(DRIVER_STATUS),
      default: DRIVER_STATUS.ACTIVE,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

driverSchema.index({ status: 1 });
driverSchema.index({ isDeleted: 1 });

driverSchema.pre(/^find/, function (next) {
  if (typeof this.where === 'function' && typeof this.getOptions === 'function') {
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  }
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('Driver', driverSchema);

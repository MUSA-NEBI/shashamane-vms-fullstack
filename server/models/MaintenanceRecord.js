/**
 * MaintenanceRecord.js
 * Tracks vehicle maintenance events.
 */

const mongoose = require('mongoose');
const { MAINTENANCE_STATUS, MAINTENANCE_TYPE } = require('../config/constants');

const maintenanceRecordSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    type: {
      type: String,
      enum: Object.values(MAINTENANCE_TYPE),
      required: [true, 'Maintenance type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.SCHEDULED,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    startDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    technicianName: {
      type: String,
      trim: true,
    },
    workshopName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    // If true, the vehicle MUST NOT be assigned to trips until this is completed
    blocksVehicle: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

maintenanceRecordSchema.index({ vehicle: 1, status: 1 });
maintenanceRecordSchema.index({ scheduledDate: 1 });
maintenanceRecordSchema.index({ status: 1 });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);

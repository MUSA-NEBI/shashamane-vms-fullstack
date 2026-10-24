/**
 * Route.js
 * Defines a travel route between origin and destination with optional stops.
 */

const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true }, // sequence order of this stop
    distanceFromOrigin: { type: Number, min: 0 }, // km
    estimatedMinutesFromOrigin: { type: Number, min: 0 },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
      maxlength: [100, 'Route name cannot exceed 100 characters'],
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    stops: [stopSchema], // Intermediate stops, ordered by 'order' field
    totalDistance: {
      type: Number,
      required: [true, 'Total distance is required'],
      min: [0.1, 'Distance must be positive'],
    }, // km
    estimatedDuration: {
      type: Number,
      required: [true, 'Estimated duration is required'],
      min: [1, 'Duration must be positive'],
    }, // minutes
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: [0, 'Fare cannot be negative'],
    }, // ETB (Ethiopian Birr)
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ origin: 1, destination: 1 });
routeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Route', routeSchema);

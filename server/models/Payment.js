/**
 * Payment.js
 * Records payment transactions. Never stores raw card numbers or CVVs.
 */

const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_METHOD } = require('../config/constants');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'ETB', // Ethiopian Birr
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    // External payment gateway transaction ID — for future real gateway integration
    transactionReference: {
      type: String,
      trim: true,
    },
    // Internal reference we generate
    paymentReference: {
      type: String,
      required: true,
      // unique enforced via schema.index() below
    },
    // Additional metadata from gateway (no sensitive card data)
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      select: false, // Not returned in API responses by default
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ passenger: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentReference: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);

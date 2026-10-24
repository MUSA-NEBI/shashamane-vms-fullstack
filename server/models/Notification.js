/**
 * Notification.js
 * In-app notifications for users.
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Optional link to the relevant resource
    link: {
      type: String,
    },
    // Optional reference to the related document
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedModel: {
      type: String,
      enum: ['Booking', 'Payment', 'Ticket', 'Schedule', 'MaintenanceRecord', null],
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

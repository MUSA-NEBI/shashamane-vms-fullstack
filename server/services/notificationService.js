/**
 * notificationService.js
 * Creates in-app notifications. All functions are fire-and-forget (non-blocking).
 */

const Notification = require('../models/Notification');
const { NOTIFICATION_TYPE } = require('../config/constants');

const createNotification = async ({ recipientId, type, title, message, link, relatedId, relatedModel }) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link,
      relatedId,
      relatedModel,
    });
  } catch (err) {
    // Notifications are non-critical — log but don't throw
    console.error('Failed to create notification:', err.message);
  }
};

const notifyBookingConfirmed = (userId, bookingRef, scheduleInfo) =>
  createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPE.BOOKING_CONFIRMED,
    title: 'Booking Confirmed',
    message: `Your booking ${bookingRef} for ${scheduleInfo} has been confirmed.`,
    link: `/passenger/bookings`,
  });

const notifyBookingCancelled = (userId, bookingRef) =>
  createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPE.BOOKING_CANCELLED,
    title: 'Booking Cancelled',
    message: `Your booking ${bookingRef} has been cancelled.`,
    link: `/passenger/bookings`,
  });

const notifyPaymentReceived = (userId, paymentRef, amount) =>
  createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPE.PAYMENT_RECEIVED,
    title: 'Payment Received',
    message: `Payment of ETB ${amount} (Ref: ${paymentRef}) has been confirmed.`,
    link: `/passenger/bookings`,
  });

const notifyTicketIssued = (userId, ticketNumber) =>
  createNotification({
    recipientId: userId,
    type: NOTIFICATION_TYPE.TICKET_ISSUED,
    title: 'Ticket Issued',
    message: `Your ticket ${ticketNumber} is ready. You can view and download it.`,
    link: `/passenger/tickets`,
  });

const notifyTripAssigned = (driverUserId, scheduleInfo) =>
  createNotification({
    recipientId: driverUserId,
    type: NOTIFICATION_TYPE.TRIP_ASSIGNED,
    title: 'Trip Assigned',
    message: `You have been assigned a trip: ${scheduleInfo}.`,
    link: `/driver/trips`,
  });

const notifyMaintenanceDue = (adminUserId, vehicleCode, date) =>
  createNotification({
    recipientId: adminUserId,
    type: NOTIFICATION_TYPE.MAINTENANCE_DUE,
    title: 'Maintenance Due',
    message: `Vehicle ${vehicleCode} has maintenance scheduled for ${date}.`,
    link: `/admin/maintenance`,
  });

module.exports = {
  createNotification,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyPaymentReceived,
  notifyTicketIssued,
  notifyTripAssigned,
  notifyMaintenanceDue,
};

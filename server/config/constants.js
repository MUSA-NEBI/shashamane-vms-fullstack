/**
 * constants.js
 * Application-wide constants and enumerations.
 * Using constants here prevents typos in status strings across the codebase.
 */

const ROLES = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  PASSENGER: 'passenger',
};

const VEHICLE_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
};

const VEHICLE_FUEL = {
  DIESEL: 'diesel',
  PETROL: 'petrol',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
  CNG: 'cng',
};

const DRIVER_STATUS = {
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

const SCHEDULE_STATUS = {
  SCHEDULED: 'scheduled',
  BOARDING: 'boarding',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_METHOD = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
};

const TICKET_STATUS = {
  VALID: 'valid',
  USED: 'used',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

const MAINTENANCE_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const MAINTENANCE_TYPE = {
  ROUTINE: 'routine',
  REPAIR: 'repair',
  INSPECTION: 'inspection',
  EMERGENCY: 'emergency',
};

const NOTIFICATION_TYPE = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  TICKET_ISSUED: 'ticket_issued',
  SCHEDULE_CHANGED: 'schedule_changed',
  SCHEDULE_CANCELLED: 'schedule_cancelled',
  MAINTENANCE_DUE: 'maintenance_due',
  TRIP_ASSIGNED: 'trip_assigned',
  GENERAL: 'general',
};

module.exports = {
  ROLES,
  VEHICLE_STATUS,
  VEHICLE_FUEL,
  DRIVER_STATUS,
  SCHEDULE_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  TICKET_STATUS,
  MAINTENANCE_STATUS,
  MAINTENANCE_TYPE,
  NOTIFICATION_TYPE,
};

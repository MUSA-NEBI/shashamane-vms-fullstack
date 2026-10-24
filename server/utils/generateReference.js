/**
 * generateReference.js
 * Generates unique human-readable reference codes for bookings, payments, and tickets.
 * Format: PREFIX-TIMESTAMP-RANDOM (e.g., BK-1698123456789-A3F7)
 */

const crypto = require('crypto');

const generateReference = (prefix = 'REF') => {
  const timestamp = Date.now().toString(36).toUpperCase(); // Base36 timestamp
  const random = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = generateReference;

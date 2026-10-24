const { body } = require('express-validator');
const { SCHEDULE_STATUS } = require('../config/constants');

const createScheduleValidator = [
  body('route').notEmpty().withMessage('Route is required').isMongoId().withMessage('Invalid route ID'),
  body('vehicle').notEmpty().withMessage('Vehicle is required').isMongoId().withMessage('Invalid vehicle ID'),
  body('driver').notEmpty().withMessage('Driver is required').isMongoId().withMessage('Invalid driver ID'),
  body('departureTime').notEmpty().withMessage('Departure time is required').isISO8601().withMessage('Invalid departure time format'),
  body('arrivalTime').notEmpty().withMessage('Arrival time is required').isISO8601().withMessage('Invalid arrival time format')
    .custom((arrivalTime, { req }) => {
      if (new Date(arrivalTime) <= new Date(req.body.departureTime)) {
        throw new Error('Arrival time must be after departure time');
      }
      return true;
    }),
  body('fare').isFloat({ min: 0 }).withMessage('Fare must be a non-negative number'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

const updateScheduleValidator = [
  body('departureTime').optional().isISO8601().withMessage('Invalid departure time format'),
  body('arrivalTime').optional().isISO8601().withMessage('Invalid arrival time format'),
  body('fare').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(Object.values(SCHEDULE_STATUS)),
  body('notes').optional().trim().isLength({ max: 500 }),
];

module.exports = { createScheduleValidator, updateScheduleValidator };

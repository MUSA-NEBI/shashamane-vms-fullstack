const { body } = require('express-validator');
const { VEHICLE_STATUS, VEHICLE_FUEL } = require('../config/constants');

const currentYear = new Date().getFullYear();

const createVehicleValidator = [
  body('vehicleCode').trim().notEmpty().withMessage('Vehicle code is required')
    .matches(/^[A-Za-z0-9-]+$/).withMessage('Vehicle code must be alphanumeric'),
  body('plateNumber').trim().notEmpty().withMessage('Plate number is required'),
  body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1990, max: currentYear + 1 }).withMessage(`Year must be between 1990 and ${currentYear + 1}`),
  body('capacity').isInt({ min: 1, max: 200 }).withMessage('Capacity must be between 1 and 200'),
  body('fuelType').isIn(Object.values(VEHICLE_FUEL)).withMessage(`Fuel type must be one of: ${Object.values(VEHICLE_FUEL).join(', ')}`),
  body('status').optional().isIn(Object.values(VEHICLE_STATUS)),
  body('color').optional().trim(),
  body('description').optional().trim().isLength({ max: 500 }),
];

const updateVehicleValidator = [
  body('plateNumber').optional().trim().notEmpty(),
  body('manufacturer').optional().trim().notEmpty(),
  body('model').optional().trim().notEmpty(),
  body('year').optional().isInt({ min: 1990, max: currentYear + 1 }),
  body('capacity').optional().isInt({ min: 1, max: 200 }),
  body('fuelType').optional().isIn(Object.values(VEHICLE_FUEL)),
  body('status').optional().isIn(Object.values(VEHICLE_STATUS)),
  body('color').optional().trim(),
  body('description').optional().trim().isLength({ max: 500 }),
];

module.exports = { createVehicleValidator, updateVehicleValidator };

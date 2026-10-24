const { body } = require('express-validator');
const { ROLES } = require('../config/constants');

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const createUserValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
];

const passwordResetRequestValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const passwordResetValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

module.exports = {
  registerValidator,
  loginValidator,
  createUserValidator,
  passwordResetRequestValidator,
  passwordResetValidator,
};

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidator, loginValidator, passwordResetRequestValidator,
  passwordResetValidator,
} = require('../validators/authValidators');
const {
  register, login, logout, getMe, updateMe,
  forgotPassword, resetPassword, changePassword,
} = require('../controllers/authController');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/logout', logout);
router.post('/forgot-password', passwordResetRequestValidator, validate, forgotPassword);
router.post('/reset-password', passwordResetValidator, validate, resetPassword);

// Protected routes — must be logged in
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/change-password', protect, changePassword);

module.exports = router;

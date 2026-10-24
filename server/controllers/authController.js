/**
 * authController.js
 * Handles HTTP request/response for authentication endpoints.
 * Business logic is in authService.js.
 */

const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const user = await authService.register({ firstName, lastName, email, phone, password });
    const token = authService.signToken(user);
    authService.sendTokenCookie(res, token);

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token, // Also return in body for API clients that don't use cookies
      },
      'Registration successful.',
      201
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    const token = authService.signToken(user);
    authService.sendTokenCookie(res, token);

    return sendSuccess(res, {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      token,
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  authService.clearTokenCookie(res);
  return sendSuccess(res, {}, 'Logged out successfully.');
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    // Prevent role/password changes via this endpoint
    const user = req.user;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    await user.save();

    return sendSuccess(res, {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.createPasswordResetToken(email);

    // Always return success to prevent email enumeration
    // In production: send result.rawToken via email here
    if (result && process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset token for ${email}: ${result.rawToken}`);
    }

    return sendSuccess(res, {}, 'If an account with that email exists, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await authService.resetPassword(token, password);
    const jwtToken = authService.signToken(user);
    authService.sendTokenCookie(res, jwtToken);

    return sendSuccess(res, { token: jwtToken }, 'Password reset successful. You are now logged in.');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required.', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters.', 400);
    }

    const user = await require('../models/User').findById(req.user._id).select('+passwordHash');
    const isValid = await authService.verifyPassword(user.passwordHash, currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect.', 401);
    }

    user.passwordHash = await authService.hashPassword(newPassword);
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, {}, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe, updateMe, forgotPassword, resetPassword, changePassword };

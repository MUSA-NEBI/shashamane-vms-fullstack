/**
 * auth.js
 * Authentication and authorization middleware.
 * 
 * protect()  — verifies the JWT from the httpOnly cookie and attaches req.user
 * authorize() — checks that req.user has one of the required roles
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT stored in the httpOnly 'token' cookie.
 * On success, attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    // Read token from httpOnly cookie (preferred) or Authorization header (fallback)
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to access this resource.',
      });
    }

    // Verify signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please log in again.',
      });
    }

    // Load the user from DB — ensures deactivated users are rejected
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user account belonging to this session no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control.
 * Usage: authorize('admin', 'dispatcher')
 * Must be used AFTER protect().
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of these roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };

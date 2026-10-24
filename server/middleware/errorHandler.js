/**
 * errorHandler.js
 * Centralized Express error handling middleware.
 * Catches all errors passed via next(error) and formats a consistent JSON response.
 * 
 * IMPORTANT: This must be the LAST middleware registered in app.js.
 */

const handleError = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred.';

  // --- Mongoose Validation Error ---
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // --- Mongoose Duplicate Key Error ---
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    message = `A record with ${field} '${value}' already exists.`;
  }

  // --- Mongoose Cast Error (invalid ObjectId) ---
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}: '${err.value}'.`;
  }

  // --- JWT Errors (handled in middleware/auth.js, but caught here as fallback) ---
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Do not leak stack traces in production
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[ERROR] ${req.method} ${req.path} — ${statusCode}: ${message}`);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

// Helper to create consistent error objects with a status code
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { handleError, AppError };

/**
 * authService.js
 * Core authentication business logic.
 * - Hash and verify passwords with argon2
 * - Sign and send JWT as httpOnly cookie
 * - Handle password reset tokens
 */

const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// Argon2id is the recommended variant (resistant to both GPU and side-channel attacks)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,   // 64 MB
  timeCost: 3,
  parallelism: 4,
};

/**
 * Hash a plaintext password.
 * @param {string} password
 * @returns {Promise<string>} argon2 hash
 */
const hashPassword = async (password) => {
  return argon2.hash(password, ARGON2_OPTIONS);
};

/**
 * Verify a plaintext password against a stored hash.
 * @param {string} hash
 * @param {string} password
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (hash, password) => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};

/**
 * Sign a JWT containing the user's ID and role.
 * @param {object} user - Mongoose user document
 * @returns {string} signed JWT
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Set JWT as an httpOnly, Secure (in production) cookie on the response.
 * httpOnly prevents JavaScript from reading the token — mitigates XSS theft.
 */
const sendTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,       // Only sent over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge,
  });
};

/**
 * Clear the auth cookie (logout).
 */
const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};

/**
 * Register a new user.
 * Returns the new user and signs them in.
 */
const register = async ({ firstName, lastName, email, phone, password, role = 'passenger' }) => {
  // Check for existing email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  // Only allow passenger self-registration via public API
  // Admin/dispatcher/driver accounts are created by admins
  const safeRole = ['passenger'].includes(role) ? role : 'passenger';

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: safeRole,
  });

  return user;
};

/**
 * Admin-only: create any role.
 */
const createUserByAdmin = async ({ firstName, lastName, email, phone, password, role }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role,
  });

  return user;
};

/**
 * Log in a user by email and password.
 * Returns the user document on success.
 */
const login = async (email, password) => {
  // Explicitly select passwordHash (it's excluded from default queries)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user) {
    // Use identical message to prevent user enumeration
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return user;
};

/**
 * Generate a password reset token (raw) and store its hash in the DB.
 * Returns the raw token to be sent to the user via email.
 */
const createPasswordResetToken = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal whether the email exists
    return null;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  return { rawToken, user };
};

/**
 * Reset password using the raw token from the reset email.
 */
const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('Password reset token is invalid or has expired.', 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  sendTokenCookie,
  clearTokenCookie,
  register,
  createUserByAdmin,
  login,
  createPasswordResetToken,
  resetPassword,
};

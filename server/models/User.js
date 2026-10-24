/**
 * User.js
 * Core user model. Handles all four roles.
 * Passwords are hashed by the auth service before saving — never stored plaintext.
 */

const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.PASSENGER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    // For passengers — extended profile
    profilePicture: {
      type: String, // URL or path
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Virtual: full name — computed property, not stored in DB
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for common queries
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);

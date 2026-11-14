'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'teacher', 'parent', 'admin'],
        message: 'Role must be student, teacher, parent, or admin',
      },
      required: [true, 'Role is required'],
    },
    profileRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'profileModel',
    },
    profileModel: {
      type: String,
      enum: ['Student', 'Teacher', 'Parent', null],
      default: null,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokens: { type: [String], select: false, default: [] },
  },
  { timestamps: true }
);

/** Hash password before save */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

/**
 * Compare a plain-text password with the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after a JWT was issued.
 * @param {number} jwtIat - JWT iat claim (seconds).
 * @returns {boolean}
 */
userSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (this.passwordChangedAt) {
    return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIat;
  }
  return false;
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);

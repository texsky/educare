'use strict';
const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const apiMax = parseInt(process.env.RATE_LIMIT_MAX) || 100;
const loginMax = parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10;

const rateLimitMessage = (type) => ({
  success: false,
  status: 'fail',
  message: `Too many ${type} requests. Please try again later.`,
});

/** General API rate limiter */
const apiLimiter = rateLimit({
  windowMs,
  max: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('API'),
  skipSuccessfulRequests: false,
});

/** Strict limiter for auth routes (login/forgot-password) */
const loginLimiter = rateLimit({
  windowMs,
  max: loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('login'),
  skipSuccessfulRequests: true, // only count failed attempts
});

/** Stricter limiter for password reset */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('password reset'),
});

module.exports = { apiLimiter, loginLimiter, passwordResetLimiter };

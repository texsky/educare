'use strict';

/**
 * Custom application error class with HTTP status support.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {number} statusCode - HTTP status code.
   * @param {string} [errorCode] - Optional application-level error code.
   */
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to Express's next() error middleware.
 * @param {Function} fn - Async controller function.
 * @returns {Function} Express route handler.
 */
const asyncWrapper = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Global Express error-handling middleware.
 */
const globalErrorHandler = (err, req, res, next) => {
  const logger = require('../config/logger');

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new AppError(`Duplicate value for field: ${field}`, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    err = new AppError(`Validation failed: ${messages.join('. ')}`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    err = new AppError('Your token has expired. Please log in again.', 401);
  }

  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errorCode: err.errorCode || null,
      stack: err.stack,
    });
  }

  // Production: only send operational errors to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errorCode: err.errorCode || null,
    });
  }

  // Programming/unknown error — don't leak details
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong. Please try again later.',
  });
};

module.exports = { AppError, asyncWrapper, globalErrorHandler };

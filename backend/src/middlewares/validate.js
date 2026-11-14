'use strict';
const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Middleware: run after express-validator chains.
 * Collects errors and throws an AppError if any are present.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => `${e.path || e.param}: ${e.msg}`)
      .join('; ');
    return next(new AppError(`Validation error — ${messages}`, 422));
  }
  next();
};

module.exports = { validate };

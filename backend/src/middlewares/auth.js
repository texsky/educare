'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncWrapper } = require('./errorHandler');

/**
 * Middleware: verify JWT and attach user to req.user.
 */
const protect = asyncWrapper(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    throw new AppError('You are not logged in. Please log in to access this resource.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired token. Please log in again.', 401);
  }

  const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  if (!currentUser.isActive) {
    throw new AppError('Your account has been deactivated. Please contact admin.', 403);
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError('Password was recently changed. Please log in again.', 401);
  }

  req.user = currentUser;
  next();
});

/**
 * Middleware factory: restrict access to specified roles.
 * @param {...string} roles - Allowed roles.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(`Access denied. Required role(s): ${roles.join(', ')}.`, 403)
    );
  }
  next();
};

module.exports = { protect, authorize };

'use strict';
const jwt = require('jsonwebtoken');
const { AppError } = require('../middlewares/errorHandler');

const JWT_SECRET = () => process.env.JWT_SECRET;
const JWT_EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = () => process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Sign an access JWT.
 * @param {string|object} payload - Data to encode (usually { id, role }).
 * @returns {string} Signed JWT.
 */
const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET(), { expiresIn: JWT_EXPIRES_IN() });

/**
 * Sign a refresh JWT.
 * @param {string|object} payload
 * @returns {string} Signed refresh JWT.
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, JWT_REFRESH_SECRET(), { expiresIn: JWT_REFRESH_EXPIRES_IN() });

/**
 * Verify an access JWT.
 * @param {string} token
 * @returns {object} Decoded payload.
 * @throws {AppError} If token is invalid or expired.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET());
  } catch (err) {
    throw new AppError('Invalid or expired access token.', 401);
  }
};

/**
 * Verify a refresh JWT.
 * @param {string} token
 * @returns {object} Decoded payload.
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET());
  } catch (err) {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }
};

/**
 * Create both access and refresh tokens for a user document.
 * @param {object} user - Mongoose User document.
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokenPair = (user) => ({
  accessToken: signToken({ id: user._id, role: user.role }),
  refreshToken: signRefreshToken({ id: user._id }),
});

module.exports = { signToken, signRefreshToken, verifyToken, verifyRefreshToken, generateTokenPair };

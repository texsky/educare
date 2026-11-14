'use strict';

/**
 * Send a standardized success response.
 * @param {object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Human-readable message.
 * @param {*} [data] - Response payload.
 * @param {object} [meta] - Optional pagination / extra metadata.
 */
const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response (use sparingly; prefer AppError + globalErrorHandler).
 * @param {object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Error message.
 * @param {*} [errors] - Additional error details.
 */
const sendError = (res, statusCode, message, errors = null) => {
  const response = { success: false, status: `${statusCode}`.startsWith('4') ? 'fail' : 'error', message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Build pagination metadata.
 * @param {number} total - Total number of documents.
 * @param {number} page - Current page (1-based).
 * @param {number} limit - Items per page.
 */
const paginateMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { sendSuccess, sendError, paginateMeta };

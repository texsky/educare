'use strict';
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Middleware factory: log write operations (CREATE/UPDATE/DELETE) automatically.
 * @param {string} entity - Name of the entity being modified.
 * @param {string} action - Action type: CREATE | UPDATE | DELETE | PUBLISH | etc.
 */
const auditLog = (entity, action) => async (req, res, next) => {
  // Capture the original res.json to intercept the response
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    res.json = originalJson; // restore
    // Only log if the operation succeeded
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      try {
        await AuditLog.create({
          userId: req.user._id,
          action,
          entity,
          entityId: body?.data?._id || req.params?.id || null,
          newValue: body?.data || null,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
          description: `${action} on ${entity}`,
        });
      } catch (err) {
        logger.error(`AuditLog creation failed: ${err.message}`);
      }
    }
    return originalJson(body);
  };

  next();
};

/**
 * Standalone helper to manually log audit entries.
 * @param {object} opts
 */
const logAudit = async ({ userId, action, entity, entityId, oldValue, newValue, ip, userAgent, description }) => {
  try {
    await AuditLog.create({ userId, action, entity, entityId, oldValue, newValue, ip, userAgent, description });
  } catch (err) {
    logger.error(`Manual AuditLog failed: ${err.message}`);
  }
};

module.exports = { auditLog, logAudit };

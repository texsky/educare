'use strict';
const Notification = require('../models/Notification');
const User = require('../models/User');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { enqueueNotification } = require('../jobs/notificationQueue');
const { logAudit } = require('../middlewares/auditLogger');

/**
 * Send an email notification manually
 * POST /api/v1/notifications/email
 */
const sendCustomEmail = asyncWrapper(async (req, res) => {
  const { recipientEmail, subject, message, userId } = req.body;
  if (!recipientEmail || !subject || !message) {
    throw new AppError('recipientEmail, subject, and message are required.', 400);
  }

  enqueueNotification({
    userId: userId || req.user._id,
    type: 'email',
    subject,
    message,
    recipientEmail,
  });

  await logAudit({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'Notification',
    description: `Manual email sent to ${recipientEmail}`,
    ip: req.ip,
  });

  sendSuccess(res, 202, 'Email notification queued for delivery.');
});

/**
 * Send an SMS notification manually
 * POST /api/v1/notifications/sms
 */
const sendCustomSMS = asyncWrapper(async (req, res) => {
  const { recipientPhone, message, userId } = req.body;
  if (!recipientPhone || !message) {
    throw new AppError('recipientPhone and message are required.', 400);
  }

  enqueueNotification({
    userId: userId || req.user._id,
    type: 'sms',
    message,
    recipientPhone,
  });

  await logAudit({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'Notification',
    description: `Manual SMS sent to ${recipientPhone}`,
    ip: req.ip,
  });

  sendSuccess(res, 202, 'SMS notification queued for delivery.');
});

/**
 * Get notification history / user notifications
 * GET /api/v1/notifications
 */
const getNotifications = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  // If not admin, restrict to notifications belonging to current user
  if (req.user.role !== 'admin') {
    filter.userId = req.user._id;
  } else if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate('userId', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Notification.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Notifications fetched.', notifications, paginateMeta(total, page, limit));
});

/**
 * Mark in-app notification as read
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = asyncWrapper(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
  if (!notification) throw new AppError('Notification not found.', 404);

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  sendSuccess(res, 200, 'Notification marked as read.', notification);
});

module.exports = { sendCustomEmail, sendCustomSMS, getNotifications, markAsRead };

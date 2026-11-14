'use strict';
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['email', 'sms', 'in-app'],
        message: 'Type must be email, sms, or in-app',
      },
      required: true,
    },
    subject: { type: String, trim: true },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    recipientEmail: { type: String, trim: true },
    recipientPhone: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    sentAt: { type: Date },
    failureReason: { type: String, trim: true },
    retryCount: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

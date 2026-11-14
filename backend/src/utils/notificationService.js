'use strict';
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const logger = require('../config/logger');
const Notification = require('../models/Notification');

// --- Nodemailer transporter ---
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// --- Twilio client ---
const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials are not configured.');
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

/**
 * Send an email notification.
 * @param {object} opts
 * @param {string} opts.to - Recipient email address.
 * @param {string} opts.subject - Email subject.
 * @param {string} opts.html - HTML body.
 * @param {string} [opts.text] - Plain-text body.
 * @returns {Promise<void>}
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const from = `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`;
  await transporter.sendMail({ from, to, subject, html, text });
  logger.info(`Email sent to ${to}: ${subject}`);
};

/**
 * Send an SMS via Twilio.
 * @param {object} opts
 * @param {string} opts.to - Recipient phone number (E.164 format).
 * @param {string} opts.body - SMS body.
 * @returns {Promise<void>}
 */
const sendSMS = async ({ to, body }) => {
  const client = getTwilioClient();
  await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
  logger.info(`SMS sent to ${to}`);
};

/**
 * Persist a notification record and attempt immediate delivery.
 * Falls back gracefully — the queue handles retries.
 * @param {object} opts
 * @param {string} opts.userId - Recipient user ID.
 * @param {'email'|'sms'|'in-app'} opts.type
 * @param {string} opts.subject
 * @param {string} opts.message
 * @param {string} [opts.recipientEmail]
 * @param {string} [opts.recipientPhone]
 * @param {object} [opts.metadata]
 * @returns {Promise<object>} Notification document.
 */
const sendNotification = async ({
  userId, type, subject, message, recipientEmail, recipientPhone, metadata,
}) => {
  const notif = await Notification.create({
    userId, type, subject, message, recipientEmail, recipientPhone,
    status: 'pending', metadata,
  });

  try {
    if (type === 'email' && recipientEmail) {
      const { getTemplate } = require('./emailTemplates');
      const html = getTemplate('generic', { subject, message });
      await sendEmail({ to: recipientEmail, subject, html });
    } else if (type === 'sms' && recipientPhone) {
      await sendSMS({ to: recipientPhone, body: message });
    }
    // in-app: just persisted above, frontend polls/sockets

    notif.status = 'sent';
    notif.sentAt = new Date();
  } catch (err) {
    logger.error(`Notification delivery failed (${type}): ${err.message}`);
    notif.status = 'failed';
    notif.failureReason = err.message;
  }

  await notif.save();
  return notif;
};

module.exports = { sendEmail, sendSMS, sendNotification };

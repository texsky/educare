'use strict';
const logger = require('../config/logger');
const Notification = require('../models/Notification');
const { sendEmail, sendSMS } = require('../utils/notificationService');

const RETRY_LIMIT = parseInt(process.env.NOTIFICATION_QUEUE_RETRY_LIMIT) || 3;
const RETRY_DELAY = parseInt(process.env.NOTIFICATION_QUEUE_RETRY_DELAY_MS) || 5000;

class NotificationQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Add a notification payload to in-memory queue
   * @param {Object} jobData
   */
  enqueue(jobData) {
    this.queue.push({
      ...jobData,
      attempts: 0,
      enqueuedAt: new Date(),
    });
    logger.info(`Notification queued for user ${jobData.userId}. Queue size: ${this.queue.length}`);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        job.attempts += 1;
        logger.info(`Processing notification job: type=${job.type}, to=${job.recipientEmail || job.recipientPhone}, attempt=${job.attempts}`);

        // Persist notification record in MongoDB
        const notifDoc = await Notification.create({
          userId: job.userId,
          type: job.type,
          subject: job.subject,
          message: job.message,
          recipientEmail: job.recipientEmail,
          recipientPhone: job.recipientPhone,
          status: 'pending',
          retryCount: job.attempts - 1,
          metadata: job.metadata,
        });

        // Dispatch based on type
        if (job.type === 'email' && job.recipientEmail) {
          await sendEmail({
            to: job.recipientEmail,
            subject: job.subject || 'EduCare Notification',
            html: job.html || `<p>${job.message}</p>`,
            text: job.message,
          });
        } else if (job.type === 'sms' && job.recipientPhone) {
          await sendSMS({
            to: job.recipientPhone,
            body: job.message,
          });
        }

        notifDoc.status = 'sent';
        notifDoc.sentAt = new Date();
        await notifDoc.save();

        logger.info(`Notification delivered successfully (id: ${notifDoc._id})`);
      } catch (err) {
        logger.error(`Failed to process notification (attempt ${job.attempts}): ${err.message}`);
        if (job.attempts < RETRY_LIMIT) {
          logger.info(`Re-queuing notification for retry in ${RETRY_DELAY / 1000}s`);
          setTimeout(() => {
            this.queue.push(job);
            this.processQueue();
          }, RETRY_DELAY);
        } else {
          logger.error(`Notification exceeded max retries (${RETRY_LIMIT}). Dropped.`);
        }
      }
    }
    this.isProcessing = false;
  }
}

const instance = new NotificationQueue();

const enqueueNotification = (data) => instance.enqueue(data);

module.exports = {
  notificationQueue: instance,
  enqueueNotification,
};

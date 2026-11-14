'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  sendCustomEmail,
  sendCustomSMS,
  getNotifications,
  markAsRead,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

router.post(
  '/email',
  authorize('admin'),
  [
    body('recipientEmail').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  sendCustomEmail
);

router.post(
  '/sms',
  authorize('admin'),
  [
    body('recipientPhone').notEmpty().withMessage('Phone is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  sendCustomSMS
);

module.exports = router;

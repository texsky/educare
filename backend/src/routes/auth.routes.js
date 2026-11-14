'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  login,
  logout,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { loginLimiter, passwordResetLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/refresh-token', refreshToken);
router.post('/refresh', refreshToken);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  resetPassword
);

// Protected routes
router.use(protect);

router.get('/me', getMe);
router.post('/logout', logout);
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;

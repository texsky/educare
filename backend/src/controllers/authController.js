'use strict';
const crypto = require('crypto');
const User = require('../models/User');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { generateTokenPair, verifyRefreshToken } = require('../utils/generateToken');
const { sendEmail } = require('../utils/notificationService');
const { getTemplate } = require('../utils/emailTemplates');
const { logAudit } = require('../middlewares/auditLogger');

/** POST /api/v1/auth/login */
const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }
  if (!user.isActive) throw new AppError('Account is deactivated. Contact admin.', 403);

  const { accessToken, refreshToken } = generateTokenPair(user);

  user.refreshTokens.push(refreshToken);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await logAudit({ userId: user._id, action: 'LOGIN', entity: 'User', entityId: user._id,
    ip: req.ip, userAgent: req.headers['user-agent'] });

  const token = accessToken;

  sendSuccess(res, 200, 'Login successful.', {
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      firstName: user.name ? user.name.split(' ')[0] : 'User',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      role: user.role,
      profileRef: user.profileRef,
    },
    token,
    accessToken,
    refreshToken,
  });
});

/** POST /api/v1/auth/logout */
const logout = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id).select('+refreshTokens');
  if (user && refreshToken) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save({ validateBeforeSave: false });
  }
  await logAudit({ userId: req.user._id, action: 'LOGOUT', entity: 'User',
    entityId: req.user._id, ip: req.ip });
  sendSuccess(res, 200, 'Logged out successfully.');
});

/** POST /api/v1/auth/refresh-token */
const refreshToken = asyncWrapper(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new AppError('Refresh token is required.', 400);

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    throw new AppError('Invalid refresh token.', 401);
  }

  const tokens = generateTokenPair(user);
  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 200, 'Token refreshed.', tokens);
});

/** POST /api/v1/auth/change-password */
const changePassword = asyncWrapper(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 400);
  }
  user.password = newPassword;
  await user.save();

  await logAudit({ userId: user._id, action: 'UPDATE', entity: 'User', entityId: user._id,
    description: 'Password changed', ip: req.ip });

  sendSuccess(res, 200, 'Password changed successfully.');
});

/** POST /api/v1/auth/forgot-password */
const forgotPassword = asyncWrapper(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return sendSuccess(res, 200, 'If that email exists, a reset link has been sent.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + (parseInt(process.env.RESET_TOKEN_EXPIRES_MIN) || 30) * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = getTemplate('passwordReset', {
    name: user.name,
    resetUrl,
    expiresIn: `${process.env.RESET_TOKEN_EXPIRES_MIN || 30} minutes`,
  });

  try {
    await sendEmail({ to: user.email, subject: 'Password Reset Request', html });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Failed to send reset email. Try again later.', 500);
  }

  sendSuccess(res, 200, 'Password reset email sent.');
});

/** POST /api/v1/auth/reset-password */
const resetPassword = asyncWrapper(async (req, res) => {
  const { token, newPassword } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) throw new AppError('Reset token is invalid or has expired.', 400);

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await logAudit({ userId: user._id, action: 'UPDATE', entity: 'User', entityId: user._id,
    description: 'Password reset via token', ip: req.ip });

  sendSuccess(res, 200, 'Password has been reset. Please log in.');
});

/** GET /api/v1/auth/me */
const getMe = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, 200, 'User profile fetched.', user);
});

module.exports = { login, logout, refreshToken, changePassword, forgotPassword, resetPassword, getMe };

'use strict';
const express = require('express');
const {
  getDashboardStats,
  getAuditLogs,
  getUsers,
  toggleUserStatus,
  getSettings,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/settings', getSettings);

module.exports = router;

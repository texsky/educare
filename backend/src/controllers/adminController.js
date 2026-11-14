'use strict';
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Memo = require('../models/Memo');
const AuditLog = require('../models/AuditLog');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

/**
 * Get system-wide dashboard statistics
 * GET /api/v1/admin/dashboard
 */
const getDashboardStats = asyncWrapper(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalExams,
    recentAuditLogs,
    usersByRole,
    classesList,
    studentPerformance,
  ] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    Teacher.countDocuments({ isActive: true }),
    Class.countDocuments({ isActive: true }),
    Exam.countDocuments(),
    AuditLog.find().sort({ timestamp: -1 }).limit(10).populate('userId', 'name role email'),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    Class.find({ isActive: true }).select('name section studentIds'),
    Memo.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $project: { _id: 0, grade: '$_id', count: 1 } },
      { $sort: { grade: 1 } },
    ]),
  ]);

  const roleCounts = usersByRole.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const classDistribution = (classesList || []).map((c) => ({
    name: `${c.name}${c.section ? ' - ' + c.section : ''}`,
    value: c.studentIds.length,
  }));

  const recentActivity = (recentAuditLogs || []).map((log) => ({
    id: log._id,
    action: `${log.action} on ${log.entity || 'System'}`,
    time: log.timestamp,
    user: log.userId?.name || 'Admin',
  }));

  sendSuccess(res, 200, 'Dashboard statistics fetched.', {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalExams,
    roleCounts,
    recentAuditLogs,
    classDistribution,
    studentPerformance,
    recentActivity,
  });
});

/**
 * Get audit logs with filters and pagination
 * GET /api/v1/admin/audit-logs
 */
const getAuditLogs = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 30);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.entity) filter.entity = req.query.entity;
  if (req.query.userId) filter.userId = req.query.userId;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 }),
    AuditLog.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Audit logs retrieved.', logs, paginateMeta(total, page, limit));
});

/**
 * User management - list users
 * GET /api/v1/admin/users
 */
const getUsers = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Users fetched.', users, paginateMeta(total, page, limit));
});

/**
 * User management - toggle user status (activate/deactivate)
 * PATCH /api/v1/admin/users/:id/status
 */
const toggleUserStatus = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  user.isActive = !user.isActive;
  await user.save();

  await logAudit({
    userId: req.user._id,
    action: 'UPDATE',
    entity: 'User',
    entityId: user._id,
    description: `User ${user.email} status toggled to ${user.isActive ? 'active' : 'inactive'}`,
    ip: req.ip,
  });

  sendSuccess(res, 200, `User marked as ${user.isActive ? 'active' : 'inactive'}.`, user);
});

/**
 * School settings configuration
 * GET /api/v1/admin/settings
 */
const getSettings = asyncWrapper(async (req, res) => {
  const settings = {
    schoolName: process.env.SCHOOL_NAME || 'EduCare International School',
    schoolAddress: process.env.SCHOOL_ADDRESS || '123 Education Street',
    schoolPhone: process.env.SCHOOL_PHONE || '',
    schoolEmail: process.env.SCHOOL_EMAIL || '',
    schoolWebsite: process.env.SCHOOL_WEBSITE || '',
    gradingScale: require('../utils/gradeCalculator').GRADE_SCALE,
  };
  sendSuccess(res, 200, 'Settings retrieved.', settings);
});

module.exports = {
  getDashboardStats,
  getAuditLogs,
  getUsers,
  toggleUserStatus,
  getSettings,
};

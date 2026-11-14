'use strict';
const Teacher = require('../models/Teacher');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

/** POST /api/v1/teachers */
const createTeacher = asyncWrapper(async (req, res) => {
  const teacher = await Teacher.create(req.body);
  await logAudit({ userId: req.user._id, action: 'CREATE', entity: 'Teacher',
    entityId: teacher._id, newValue: teacher, ip: req.ip });
  sendSuccess(res, 201, 'Teacher created.', teacher);
});

/** GET /api/v1/teachers */
const getAllTeachers = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { isActive: { $ne: false } };
  if (req.query.search) {
    filter.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { employeeId: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [teachers, total] = await Promise.all([
    Teacher.find(filter)
      .populate('userId', 'email name')
      .populate('subjects', 'name code')
      .populate('classes', 'name section')
      .skip(skip).limit(limit).sort({ firstName: 1 }),
    Teacher.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Teachers fetched.', teachers, paginateMeta(total, page, limit));
});

/** GET /api/v1/teachers/:id */
const getTeacher = asyncWrapper(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('userId', 'email isActive')
    .populate('subjects', 'name code')
    .populate('classes', 'name section academicYear');
  if (!teacher) throw new AppError('Teacher not found.', 404);
  sendSuccess(res, 200, 'Teacher fetched.', teacher);
});

/** PUT /api/v1/teachers/:id */
const updateTeacher = asyncWrapper(async (req, res) => {
  const old = await Teacher.findById(req.params.id);
  if (!old) throw new AppError('Teacher not found.', 404);

  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });

  await logAudit({ userId: req.user._id, action: 'UPDATE', entity: 'Teacher',
    entityId: teacher._id, oldValue: old, newValue: teacher, ip: req.ip });

  sendSuccess(res, 200, 'Teacher updated.', teacher);
});

/** DELETE /api/v1/teachers/:id */
const deleteTeacher = asyncWrapper(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new AppError('Teacher not found.', 404);
  teacher.isActive = false;
  await teacher.save();
  await logAudit({ userId: req.user._id, action: 'DELETE', entity: 'Teacher',
    entityId: teacher._id, ip: req.ip });
  sendSuccess(res, 200, 'Teacher deactivated.');
});

/** POST /api/v1/teachers/:id/photo */
const uploadTeacherPhoto = asyncWrapper(async (req, res) => {
  if (!req.file) throw new AppError('No photo uploaded.', 400);
  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id, { photo: req.file.path || req.file.filename }, { new: true }
  );
  if (!teacher) throw new AppError('Teacher not found.', 404);
  sendSuccess(res, 200, 'Photo uploaded.', { photo: teacher.photo });
});

module.exports = { createTeacher, getAllTeachers, getTeacher, updateTeacher, deleteTeacher, uploadTeacherPhoto };

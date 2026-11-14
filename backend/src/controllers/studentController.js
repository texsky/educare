'use strict';
const path = require('path');
const Student = require('../models/Student');
const User = require('../models/User');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

/** POST /api/v1/students */
const createStudent = asyncWrapper(async (req, res) => {
  const data = req.body;
  const student = await Student.create(data);

  await logAudit({ userId: req.user._id, action: 'CREATE', entity: 'Student',
    entityId: student._id, newValue: student, ip: req.ip });

  sendSuccess(res, 201, 'Student created successfully.', student);
});

/** GET /api/v1/students */
const getAllStudents = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { isActive: { $ne: false } };
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.section) filter.section = req.query.section.toUpperCase();
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;
  if (req.query.search) {
    filter.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { admissionNo: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('userId', 'email')
      .populate('classId', 'name section')
      .populate('parentId', 'firstName lastName phone')
      .skip(skip)
      .limit(limit)
      .sort({ rollNo: 1 }),
    Student.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Students fetched.', students, paginateMeta(total, page, limit));
});

/** GET /api/v1/students/:id */
const getStudent = asyncWrapper(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('classId', 'name section academicYear')
    .populate({
      path: 'parentId',
      select: 'firstName lastName phone relation',
      populate: { path: 'userId', select: 'email' },
    })
    .populate('userId', 'email isActive');

  if (!student) throw new AppError('Student not found.', 404);
  sendSuccess(res, 200, 'Student fetched.', student);
});

/** PUT /api/v1/students/:id */
const updateStudent = asyncWrapper(async (req, res) => {
  const old = await Student.findById(req.params.id);
  if (!old) throw new AppError('Student not found.', 404);

  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });

  await logAudit({ userId: req.user._id, action: 'UPDATE', entity: 'Student',
    entityId: student._id, oldValue: old, newValue: student, ip: req.ip });

  sendSuccess(res, 200, 'Student updated.', student);
});

/** DELETE /api/v1/students/:id */
const deleteStudent = asyncWrapper(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Student not found.', 404);

  student.isActive = false;
  await student.save();

  await logAudit({ userId: req.user._id, action: 'DELETE', entity: 'Student',
    entityId: student._id, ip: req.ip });

  sendSuccess(res, 200, 'Student deactivated.');
});

/** POST /api/v1/students/:id/photo */
const uploadStudentPhoto = asyncWrapper(async (req, res) => {
  if (!req.file) throw new AppError('No photo uploaded.', 400);

  const photoPath = req.file.path || req.file.filename;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { photo: photoPath },
    { new: true }
  );
  if (!student) throw new AppError('Student not found.', 404);

  sendSuccess(res, 200, 'Photo uploaded.', { photo: photoPath });
});

/** GET /api/v1/students/class/:classId */
const getStudentsByClass = asyncWrapper(async (req, res) => {
  const students = await Student.find({ classId: req.params.classId, isActive: true })
    .sort({ rollNo: 1 });
  sendSuccess(res, 200, 'Students by class fetched.', students);
});

module.exports = {
  createStudent, getAllStudents, getStudent, updateStudent,
  deleteStudent, uploadStudentPhoto, getStudentsByClass,
};

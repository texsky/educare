'use strict';
const Class = require('../models/Class');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

const syncTeacherClasses = async (teacherId) => {
  const [classTeacherClasses, subjectClasses] = await Promise.all([
    Class.find({ classTeacherId: teacherId }).distinct('_id'),
    Subject.find({ teacherId }).distinct('classId'),
  ]);
  const classIds = [...new Set([...classTeacherClasses, ...subjectClasses].map(String))];
  await Teacher.updateOne({ _id: teacherId }, { $set: { classes: classIds } });
};

/** POST /api/v1/classes */
const createClass = asyncWrapper(async (req, res) => {
  const classTeacherId = req.body.classTeacherId || null;
  if (classTeacherId) {
    const teacher = await Teacher.findOne({ _id: classTeacherId, isActive: { $ne: false } });
    if (!teacher) throw new AppError('Selected class teacher not found or inactive.', 404);
  }

  const cls = await Class.create({ ...req.body, classTeacherId });
  if (classTeacherId) {
    await syncTeacherClasses(classTeacherId);
  }
  await logAudit({ userId: req.user._id, action: 'CREATE', entity: 'Class',
    entityId: cls._id, newValue: cls, ip: req.ip });
  sendSuccess(res, 201, 'Class created.', cls);
});

/** GET /api/v1/classes */
const getAllClasses = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 30);
  const skip = (page - 1) * limit;
  const filter = { isActive: { $ne: false } };
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;
  if (req.query.search) {
    const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { section: { $regex: search, $options: 'i' } },
      { academicYear: { $regex: search, $options: 'i' } },
      { roomNo: { $regex: search, $options: 'i' } },
    ];
  }

  const [classes, total] = await Promise.all([
    Class.find(filter)
      .populate('classTeacherId', 'firstName lastName employeeId')
      .populate('subjects', 'name code')
      .skip(skip).limit(limit).sort({ name: 1, section: 1 }),
    Class.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Classes fetched.', classes, paginateMeta(total, page, limit));
});

/** GET /api/v1/classes/:id */
const getClass = asyncWrapper(async (req, res) => {
  const cls = await Class.findById(req.params.id)
    .populate('classTeacherId', 'firstName lastName employeeId email phone')
    .populate('subjects', 'name code maxMarks')
    .populate({
      path: 'studentIds',
      select: 'firstName lastName admissionNo rollNo gender isActive academicYear userId',
      populate: { path: 'userId', select: 'email' },
    });
  if (!cls) throw new AppError('Class not found.', 404);
  sendSuccess(res, 200, 'Class fetched.', cls);
});

/** PUT /api/v1/classes/:id */
const updateClass = asyncWrapper(async (req, res) => {
  const old = await Class.findById(req.params.id);
  if (!old) throw new AppError('Class not found.', 404);
  const hasTeacherUpdate = Object.prototype.hasOwnProperty.call(req.body, 'classTeacherId');
  const classTeacherId = hasTeacherUpdate
    ? req.body.classTeacherId || null
    : old.classTeacherId;
  if (classTeacherId) {
    const teacher = await Teacher.findOne({ _id: classTeacherId, isActive: { $ne: false } });
    if (!teacher) throw new AppError('Selected class teacher not found or inactive.', 404);
  }

  const cls = await Class.findByIdAndUpdate(req.params.id, {
    ...req.body,
    classTeacherId,
  },
    { new: true, runValidators: true });

  const affectedTeacherIds = new Set(
    [old.classTeacherId, classTeacherId].filter(Boolean).map(String)
  );
  await Promise.all([...affectedTeacherIds].map(syncTeacherClasses));

  await logAudit({ userId: req.user._id, action: 'UPDATE', entity: 'Class',
    entityId: cls._id, oldValue: old, newValue: cls, ip: req.ip });
  sendSuccess(res, 200, 'Class updated.', cls);
});

/** DELETE /api/v1/classes/:id */
const deleteClass = asyncWrapper(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new AppError('Class not found.', 404);
  cls.isActive = false;
  await cls.save();
  await logAudit({ userId: req.user._id, action: 'DELETE', entity: 'Class',
    entityId: cls._id, ip: req.ip });
  sendSuccess(res, 200, 'Class deactivated.');
});

/** POST /api/v1/classes/:id/add-student */
const addStudentToClass = asyncWrapper(async (req, res) => {
  const { studentId } = req.body;
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new AppError('Class not found.', 404);
  if (cls.studentIds.map(String).includes(studentId)) {
    throw new AppError('Student already in this class.', 409);
  }
  if (cls.studentIds.length >= cls.maxStrength) {
    throw new AppError(`Class is full (max ${cls.maxStrength} students).`, 400);
  }
  cls.studentIds.push(studentId);
  await cls.save();
  await Student.findByIdAndUpdate(studentId, { classId: cls._id, section: cls.section });
  sendSuccess(res, 200, 'Student added to class.', cls);
});

/** POST /api/v1/classes/:id/remove-student */
const removeStudentFromClass = asyncWrapper(async (req, res) => {
  const { studentId } = req.body;
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new AppError('Class not found.', 404);
  cls.studentIds = cls.studentIds.filter((id) => id.toString() !== studentId);
  await cls.save();
  sendSuccess(res, 200, 'Student removed from class.', cls);
});

module.exports = { createClass, getAllClasses, getClass, updateClass, deleteClass,
  addStudentToClass, removeStudentFromClass };

'use strict';
const Subject = require('../models/Subject');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

/** POST /api/v1/subjects */
const createSubject = asyncWrapper(async (req, res) => {
  const subject = await Subject.create(req.body);
  await logAudit({ userId: req.user._id, action: 'CREATE', entity: 'Subject',
    entityId: subject._id, newValue: subject, ip: req.ip });
  sendSuccess(res, 201, 'Subject created.', subject);
});

/** GET /api/v1/subjects */
const getAllSubjects = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 30);
  const skip = (page - 1) * limit;
  const filter = { isActive: true };
  if (req.query.classId) filter.classId = req.query.classId;

  const [subjects, total] = await Promise.all([
    Subject.find(filter)
      .populate('classId', 'name section')
      .populate('teacherId', 'firstName lastName')
      .skip(skip).limit(limit).sort({ name: 1 }),
    Subject.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Subjects fetched.', subjects, paginateMeta(total, page, limit));
});

/** GET /api/v1/subjects/:id */
const getSubject = asyncWrapper(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('classId', 'name section')
    .populate('teacherId', 'firstName lastName employeeId');
  if (!subject) throw new AppError('Subject not found.', 404);
  sendSuccess(res, 200, 'Subject fetched.', subject);
});

/** PUT /api/v1/subjects/:id */
const updateSubject = asyncWrapper(async (req, res) => {
  const old = await Subject.findById(req.params.id);
  if (!old) throw new AppError('Subject not found.', 404);
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body,
    { new: true, runValidators: true });
  await logAudit({ userId: req.user._id, action: 'UPDATE', entity: 'Subject',
    entityId: subject._id, oldValue: old, newValue: subject, ip: req.ip });
  sendSuccess(res, 200, 'Subject updated.', subject);
});

/** DELETE /api/v1/subjects/:id */
const deleteSubject = asyncWrapper(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new AppError('Subject not found.', 404);
  subject.isActive = false;
  await subject.save();
  await logAudit({ userId: req.user._id, action: 'DELETE', entity: 'Subject',
    entityId: subject._id, ip: req.ip });
  sendSuccess(res, 200, 'Subject deactivated.');
});

module.exports = { createSubject, getAllSubjects, getSubject, updateSubject, deleteSubject };

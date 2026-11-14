'use strict';
const Exam = require('../models/Exam');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

/** POST /api/v1/exams */
const createExam = asyncWrapper(async (req, res) => {
  const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
  await logAudit({ userId: req.user._id, action: 'CREATE', entity: 'Exam',
    entityId: exam._id, newValue: exam, ip: req.ip });
  sendSuccess(res, 201, 'Exam created.', exam);
});

/** GET /api/v1/exams */
const getAllExams = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;
  if (req.query.status) filter.status = req.query.status;

  const [exams, total] = await Promise.all([
    Exam.find(filter)
      .populate('classId', 'name section')
      .populate('subjects.subjectId', 'name code')
      .skip(skip).limit(limit).sort({ startDate: -1 }),
    Exam.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Exams fetched.', exams, paginateMeta(total, page, limit));
});

/** GET /api/v1/exams/:id */
const getExam = asyncWrapper(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('classId', 'name section')
    .populate('subjects.subjectId', 'name code maxMarks passingMarks')
    .populate('createdBy', 'name email');
  if (!exam) throw new AppError('Exam not found.', 404);
  sendSuccess(res, 200, 'Exam fetched.', exam);
});

/** PUT /api/v1/exams/:id */
const updateExam = asyncWrapper(async (req, res) => {
  const old = await Exam.findById(req.params.id);
  if (!old) throw new AppError('Exam not found.', 404);
  if (old.isPublished) throw new AppError('Cannot edit a published exam.', 400);
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body,
    { new: true, runValidators: true });
  await logAudit({ userId: req.user._id, action: 'UPDATE', entity: 'Exam',
    entityId: exam._id, oldValue: old, newValue: exam, ip: req.ip });
  sendSuccess(res, 200, 'Exam updated.', exam);
});

/** DELETE /api/v1/exams/:id */
const deleteExam = asyncWrapper(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new AppError('Exam not found.', 404);
  if (exam.isPublished) throw new AppError('Cannot delete a published exam.', 400);
  await exam.deleteOne();
  await logAudit({ userId: req.user._id, action: 'DELETE', entity: 'Exam',
    entityId: exam._id, ip: req.ip });
  sendSuccess(res, 200, 'Exam deleted.');
});

/** PATCH /api/v1/exams/:id/publish */
const publishExam = asyncWrapper(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new AppError('Exam not found.', 404);
  if (exam.isPublished) throw new AppError('Exam is already published.', 400);
  exam.isPublished = true;
  exam.publishedAt = new Date();
  exam.status = 'ongoing';
  await exam.save();
  await logAudit({ userId: req.user._id, action: 'PUBLISH', entity: 'Exam',
    entityId: exam._id, ip: req.ip });
  sendSuccess(res, 200, 'Exam published.', exam);
});

module.exports = { createExam, getAllExams, getExam, updateExam, deleteExam, publishExam };

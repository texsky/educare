'use strict';
const fs = require('fs');
const Marks = require('../models/Marks');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { extractTextFromImage } = require('../utils/ocr');
const { getGrade } = require('../utils/gradeCalculator');
const { logAudit } = require('../middlewares/auditLogger');
const logger = require('../config/logger');

/**
 * Upload image for OCR marks extraction
 * POST /api/v1/marks/upload-ocr
 */
const uploadMarksOCR = asyncWrapper(async (req, res) => {
  if (!req.file) throw new AppError('Answer sheet image is required.', 400);

  const { studentId, examId, subjectId } = req.body;
  if (!studentId || !examId || !subjectId) {
    throw new AppError('studentId, examId, and subjectId are required.', 400);
  }

  const [student, exam, subject] = await Promise.all([
    Student.findById(studentId),
    Exam.findById(examId),
    Subject.findById(subjectId),
  ]);

  if (!student) throw new AppError('Student not found.', 404);
  if (!exam) throw new AppError('Exam not found.', 404);
  if (!subject) throw new AppError('Subject not found.', 404);

  // Read buffer and run OCR
  const imageBuffer = fs.readFileSync(req.file.path);
  const { rawText, parsedMarks } = await extractTextFromImage(imageBuffer);

  let grade = null;
  if (parsedMarks !== null && subject.maxMarks) {
    const percentage = (parsedMarks / subject.maxMarks) * 100;
    grade = getGrade(percentage).grade;
  }

  // Upsert marks entry with reviewStatus = 'pending'
  const marksDoc = await Marks.findOneAndUpdate(
    { studentId, examId, subjectId },
    {
      studentId,
      examId,
      subjectId,
      marksObtained: parsedMarks,
      grade,
      entryMethod: 'ocr',
      uploadedImage: req.file.path,
      ocrRaw: rawText,
      ocrParsedMarks: parsedMarks,
      reviewStatus: 'pending',
      enteredBy: req.user._id,
    },
    { new: true, upsert: true, runValidators: true }
  );

  await logAudit({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'Marks',
    entityId: marksDoc._id,
    newValue: marksDoc,
    description: 'Marks uploaded via OCR',
    ip: req.ip,
  });

  sendSuccess(res, 201, 'OCR marks extracted and submitted for review.', {
    marks: marksDoc,
    ocrSummary: { rawText, parsedMarks, grade },
  });
});

/**
 * Manual marks entry (single or batch update)
 * POST /api/v1/marks/manual
 */
const manualEntry = asyncWrapper(async (req, res) => {
  const { entries } = req.body; // Array of { studentId, examId, subjectId, marksObtained, practicalMarks, isAbsent, remarks }

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    throw new AppError('Entries array is required.', 400);
  }

  const results = [];
  for (const entry of entries) {
    const { studentId, examId, subjectId, marksObtained, practicalMarks = 0, isAbsent = false, remarks } = entry;
    
    const subject = await Subject.findById(subjectId);
    let grade = null;
    if (!isAbsent && marksObtained !== undefined && marksObtained !== null && subject) {
      const totalScore = marksObtained + (practicalMarks || 0);
      const totalMax = (subject.maxMarks || 100) + (subject.practicalMaxMarks || 0);
      const percentage = (totalScore / totalMax) * 100;
      grade = getGrade(percentage).grade;
    }

    const doc = await Marks.findOneAndUpdate(
      { studentId, examId, subjectId },
      {
        studentId,
        examId,
        subjectId,
        marksObtained: isAbsent ? 0 : marksObtained,
        practicalMarks: isAbsent ? 0 : practicalMarks,
        grade,
        isAbsent,
        remarks,
        entryMethod: 'manual',
        reviewStatus: 'pending',
        enteredBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true }
    );
    results.push(doc);
  }

  await logAudit({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'Marks',
    description: `Manual marks entry batch of ${results.length} items`,
    ip: req.ip,
  });

  sendSuccess(res, 200, `${results.length} mark entries saved successfully.`, results);
});

/**
 * Review marks (Approve or Reject)
 * PATCH /api/v1/marks/:id/review
 */
const reviewMarks = asyncWrapper(async (req, res) => {
  const { status, remarks, adjustedMarks } = req.body; // status: 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError('Status must be approved or rejected.', 400);
  }

  const marks = await Marks.findById(req.params.id).populate('subjectId');
  if (!marks) throw new AppError('Marks entry not found.', 404);

  const old = { ...marks.toObject() };
  marks.reviewStatus = status;
  marks.reviewedBy = req.user._id;
  marks.reviewedAt = new Date();
  if (remarks) marks.remarks = remarks;

  if (adjustedMarks !== undefined && adjustedMarks !== null && marks.subjectId) {
    marks.marksObtained = adjustedMarks;
    const totalMax = (marks.subjectId.maxMarks || 100) + (marks.subjectId.practicalMaxMarks || 0);
    const percentage = ((marks.marksObtained + (marks.practicalMarks || 0)) / totalMax) * 100;
    marks.grade = getGrade(percentage).grade;
  }

  await marks.save();

  await logAudit({
    userId: req.user._id,
    action: status === 'approved' ? 'APPROVE' : 'REJECT',
    entity: 'Marks',
    entityId: marks._id,
    oldValue: old,
    newValue: marks,
    ip: req.ip,
  });

  sendSuccess(res, 200, `Marks entry marked as ${status}.`, marks);
});

/**
 * Bulk upload marks via parsed CSV/JSON data
 * POST /api/v1/marks/bulk
 */
const bulkUpload = asyncWrapper(async (req, res) => {
  const { examId, subjectId, records } = req.body;
  if (!examId || !subjectId || !Array.isArray(records)) {
    throw new AppError('examId, subjectId, and records array are required.', 400);
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) throw new AppError('Subject not found.', 404);

  const inserted = [];
  for (const item of records) {
    const { admissionNo, marksObtained, practicalMarks = 0, isAbsent = false, remarks } = item;
    const student = await Student.findOne({ admissionNo });
    if (!student) continue;

    let grade = null;
    if (!isAbsent && marksObtained !== undefined) {
      const totalScore = marksObtained + practicalMarks;
      const totalMax = (subject.maxMarks || 100) + (subject.practicalMaxMarks || 0);
      const percentage = (totalScore / totalMax) * 100;
      grade = getGrade(percentage).grade;
    }

    const doc = await Marks.findOneAndUpdate(
      { studentId: student._id, examId, subjectId },
      {
        studentId: student._id,
        examId,
        subjectId,
        marksObtained: isAbsent ? 0 : marksObtained,
        practicalMarks: isAbsent ? 0 : practicalMarks,
        grade,
        isAbsent,
        remarks,
        entryMethod: 'bulk',
        reviewStatus: 'approved', // bulk uploads by admin can be auto-approved
        enteredBy: req.user._id,
      },
      { new: true, upsert: true }
    );
    inserted.push(doc);
  }

  sendSuccess(res, 200, `Processed ${inserted.length} bulk mark records.`, inserted);
});

/**
 * Get marks with filtering and pagination
 * GET /api/v1/marks
 */
const getMarks = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.examId) filter.examId = req.query.examId;
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.reviewStatus) filter.reviewStatus = req.query.reviewStatus;

  const [marks, total] = await Promise.all([
    Marks.find(filter)
      .populate('studentId', 'firstName lastName admissionNo rollNo section')
      .populate('examId', 'name type academicYear')
      .populate('subjectId', 'name code maxMarks passingMarks')
      .populate('enteredBy', 'name role')
      .populate('reviewedBy', 'name role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Marks.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Marks list fetched.', marks, paginateMeta(total, page, limit));
});

module.exports = { uploadMarksOCR, manualEntry, reviewMarks, bulkUpload, getMarks };

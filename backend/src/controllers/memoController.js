'use strict';
const path = require('path');
const fs = require('fs');
const Memo = require('../models/Memo');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Exam = require('../models/Exam');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { calcStudentSummary, assignRanks } = require('../utils/gradeCalculator');
const { generateMemoPDF } = require('../utils/pdfGenerator');
const { logAudit } = require('../middlewares/auditLogger');
const { enqueueNotification } = require('../jobs/notificationQueue');
const logger = require('../config/logger');

const UPLOADS_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * List published memos for the signed-in student or that parent's linked students.
 * Admins and teachers may filter the complete memo list.
 * GET /api/v1/memos
 */
const getMemos = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 30);
  const filter = {};

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new AppError('Student profile not found.', 404);
    if (req.query.studentId && req.query.studentId !== student._id.toString()) {
      throw new AppError('You can only view your own memos.', 403);
    }
    filter.studentId = student._id;
    filter.isPublished = true;
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ userId: req.user._id });
    if (!parent) throw new AppError('Parent profile not found.', 404);
    if (req.query.studentId) {
      const isLinked = parent.studentIds.some((id) => id.toString() === req.query.studentId);
      if (!isLinked) throw new AppError('You can only view memos for your linked students.', 403);
      filter.studentId = req.query.studentId;
    } else {
      filter.studentId = { $in: parent.studentIds };
    }
    filter.isPublished = true;
  } else {
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.examId) filter.examId = req.query.examId;
    if (req.query.isPublished !== undefined) {
      filter.isPublished = req.query.isPublished === 'true';
    }
    if (req.query.classId) {
      const classStudents = await Student.find({ classId: req.query.classId }).select('_id');
      filter.studentId = { $in: classStudents.map((student) => student._id) };
    }
  }

  const [memos, total] = await Promise.all([
    Memo.find(filter)
      .populate({
        path: 'studentId',
        select: 'firstName lastName admissionNo rollNo section classId',
        populate: { path: 'classId', select: 'name section' },
      })
      .populate('examId', 'name type academicYear startDate')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ generatedAt: -1 }),
    Memo.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Memos fetched.', memos, paginateMeta(total, page, limit));
});

/** GET /api/v1/memos/:id */
const getMemoById = asyncWrapper(async (req, res) => {
  const memo = await Memo.findById(req.params.id)
    .populate({
      path: 'studentId',
      select: 'userId firstName lastName admissionNo rollNo section classId',
      populate: { path: 'classId', select: 'name section' },
    })
    .populate('examId', 'name type academicYear startDate');

  if (!memo) throw new AppError('Memo not found.', 404);

  if (req.user.role === 'student') {
    if (!memo.isPublished || !memo.studentId.userId.equals(req.user._id)) {
      throw new AppError('Memo not found.', 404);
    }
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ userId: req.user._id });
    const isLinked = parent?.studentIds.some((id) => id.equals(memo.studentId._id));
    if (!memo.isPublished || !isLinked) throw new AppError('Memo not found.', 404);
  }

  sendSuccess(res, 200, 'Memo fetched.', memo);
});

/**
 * Generate memos for all students or single student for an exam
 * POST /api/v1/memos/generate
 */
const generateMemo = asyncWrapper(async (req, res) => {
  const { examId, studentId } = req.body;
  if (!examId) throw new AppError('examId is required.', 400);

  const exam = await Exam.findById(examId).populate('classId');
  if (!exam) throw new AppError('Exam not found.', 404);

  // Find students in exam class
  const studentQuery = { classId: exam.classId._id, isActive: true };
  if (studentId) studentQuery._id = studentId;
  const students = await Student.find(studentQuery);

  if (students.length === 0) {
    throw new AppError('No active students found for this exam class.', 404);
  }

  // Collect exam subjects
  const subjectIds = exam.subjects.map((s) => s.subjectId);
  const subjectsMap = {};
  const subjects = await Subject.find({ _id: { $in: subjectIds } });
  subjects.forEach((s) => { subjectsMap[s._id.toString()] = s; });

  const generatedMemos = [];
  const studentScores = [];

  for (const student of students) {
    const marksRecords = await Marks.find({
      studentId: student._id,
      examId: exam._id,
      reviewStatus: 'approved',
    });

    const subjectWise = [];
    const summarySubjects = [];

    for (const examSub of exam.subjects) {
      const subInfo = subjectsMap[examSub.subjectId.toString()];
      const markEntry = marksRecords.find((m) => m.subjectId.toString() === examSub.subjectId.toString());

      const marksObtained = markEntry ? markEntry.marksObtained : 0;
      const maxMarks = examSub.maxMarks || subInfo?.maxMarks || 100;
      const passingMarks = examSub.passingMarks || subInfo?.passingMarks || 40;
      const isAbsent = markEntry ? markEntry.isAbsent : true;

      summarySubjects.push({ marksObtained, maxMarks, passingMarks, isAbsent });
      subjectWise.push({
        subjectId: examSub.subjectId,
        subjectName: subInfo ? subInfo.name : 'Unknown',
        marksObtained,
        maxMarks,
        passingMarks,
        grade: markEntry?.grade || '-',
        isAbsent,
      });
    }

    const { totalObtained, totalMax, percentage, grade, result } = calcStudentSummary(summarySubjects);

    studentScores.push({
      studentId: student._id.toString(),
      totalMarks: totalObtained,
    });

    const memoDoc = await Memo.findOneAndUpdate(
      { studentId: student._id, examId: exam._id },
      {
        studentId: student._id,
        examId: exam._id,
        totalMarksObtained: totalObtained,
        totalMaxMarks: totalMax,
        percentage,
        grade,
        result,
        subjectWise,
        academicYear: exam.academicYear,
        generatedBy: req.user._id,
        generatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    generatedMemos.push({ memo: memoDoc, student });
  }

  // Calculate and update ranks
  const rankedList = assignRanks(studentScores);
  const rankMap = {};
  rankedList.forEach((r) => { rankMap[r.studentId] = r.rank; });

  for (const item of generatedMemos) {
    const finalRank = rankMap[item.student._id.toString()] || 1;
    item.memo.rank = finalRank;

    // Generate PDF file
    const memoDir = path.join(UPLOADS_DIR, 'memos');
    if (!fs.existsSync(memoDir)) fs.mkdirSync(memoDir, { recursive: true });

    const pdfFileName = `memo_${item.memo._id}.pdf`;
    const pdfPath = path.join(memoDir, pdfFileName);

    await generateMemoPDF({
      student: item.student,
      exam,
      memo: item.memo,
      outputPath: pdfPath,
    });

    item.memo.pdfPath = `memos/${pdfFileName}`;
    await item.memo.save();
  }

  await logAudit({
    userId: req.user._id,
    action: 'CREATE',
    entity: 'Memo',
    description: `Generated ${generatedMemos.length} memos for exam ${exam.name}`,
    ip: req.ip,
  });

  sendSuccess(res, 201, `Generated ${generatedMemos.length} memos successfully.`, {
    examId: exam._id,
    memosGenerated: generatedMemos.length,
  });
});

/**
 * Download memo PDF
 * GET /api/v1/memos/:id/download
 */
const downloadMemo = asyncWrapper(async (req, res) => {
  const memo = await Memo.findById(req.params.id)
    .populate('studentId', 'firstName lastName admissionNo')
    .populate('examId', 'name');

  if (!memo) throw new AppError('Memo not found.', 404);
  if (!memo.pdfPath) throw new AppError('PDF has not been generated for this memo.', 404);

  const fullPath = path.resolve(UPLOADS_DIR, memo.pdfPath);
  if (!fs.existsSync(fullPath)) {
    throw new AppError('Memo PDF file is missing on server storage.', 404);
  }

  res.download(fullPath, `Memo_${memo.studentId?.admissionNo || 'Student'}_${memo.examId?.name}.pdf`);
});

/**
 * Publish results for an exam and notify students/parents
 * PATCH /api/v1/memos/publish
 */
const publishResults = asyncWrapper(async (req, res) => {
  const { examId } = req.body;
  if (!examId) throw new AppError('examId is required.', 400);

  const exam = await Exam.findById(examId);
  if (!exam) throw new AppError('Exam not found.', 404);

  const updatedMemos = await Memo.updateMany(
    { examId },
    { isPublished: true, publishedAt: new Date() }
  );

  exam.isPublished = true;
  exam.publishedAt = new Date();
  await exam.save();

  // Enqueue notification tasks for students and parents
  const memos = await Memo.find({ examId })
    .populate({
      path: 'studentId',
      populate: [{ path: 'userId' }, { path: 'parentId', populate: 'userId' }],
    });

  for (const m of memos) {
    if (m.studentId?.userId?.email) {
      enqueueNotification({
        userId: m.studentId.userId._id,
        type: 'email',
        subject: `Exam Results Published: ${exam.name}`,
        message: `Your results for ${exam.name} have been published. Score: ${m.percentage}%, Grade: ${m.grade}.`,
        recipientEmail: m.studentId.userId.email,
        metadata: { memoId: m._id, examId },
      });
    }

    if (m.studentId?.parentId?.userId?.email) {
      enqueueNotification({
        userId: m.studentId.parentId.userId._id,
        type: 'email',
        subject: `Exam Results Published: ${m.studentId.firstName} - ${exam.name}`,
        message: `Results for ${m.studentId.firstName} in ${exam.name} have been published. Percentage: ${m.percentage}%, Grade: ${m.grade}.`,
        recipientEmail: m.studentId.parentId.userId.email,
        recipientPhone: m.studentId.parentId.phone,
        metadata: { memoId: m._id, examId },
      });
    }
  }

  await logAudit({
    userId: req.user._id,
    action: 'PUBLISH',
    entity: 'Memo',
    description: `Published results for exam: ${exam.name}`,
    ip: req.ip,
  });

  sendSuccess(res, 200, 'Exam results published and notifications queued.', {
    examId,
    publishedCount: updatedMemos.modifiedCount,
  });
});

/**
 * Get memo by student and exam
 * GET /api/v1/memos/student/:studentId/exam/:examId
 */
const getMemoByStudent = asyncWrapper(async (req, res) => {
  const { studentId, examId } = req.params;

  // Authorization check: if student role, can only access their own
  if (req.user.role === 'student' && req.user.profileRef?.toString() !== studentId) {
    throw new AppError('Forbidden: You can only view your own memo.', 403);
  }

  const memo = await Memo.findOne({ studentId, examId })
    .populate('studentId', 'firstName lastName admissionNo rollNo section photo')
    .populate('examId', 'name type academicYear')
    .populate('subjectWise.subjectId', 'name code maxMarks passingMarks');

  if (!memo) throw new AppError('Memo not found.', 404);
  sendSuccess(res, 200, 'Memo fetched successfully.', memo);
});

/**
 * Get all memos for an exam with pagination
 * GET /api/v1/memos/exam/:examId
 */
const getMemosByExam = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 30);
  const skip = (page - 1) * limit;

  const filter = { examId: req.params.examId };
  if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';

  const [memos, total] = await Promise.all([
    Memo.find(filter)
      .populate('studentId', 'firstName lastName admissionNo rollNo section')
      .skip(skip)
      .limit(limit)
      .sort({ rank: 1, percentage: -1 }),
    Memo.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Exam memos fetched.', memos, paginateMeta(total, page, limit));
});

module.exports = {
  getMemos,
  getMemoById,
  generateMemo,
  downloadMemo,
  publishResults,
  getMemoByStudent,
  getMemosByExam,
};

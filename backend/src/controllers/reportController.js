'use strict';
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Memo = require('../models/Memo');
const Marks = require('../models/Marks');
const Class = require('../models/Class');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Class performance report for an exam
 * GET /api/v1/reports/class/:classId/exam/:examId
 */
const getClassReport = asyncWrapper(async (req, res) => {
  const { classId, examId } = req.params;

  const [cls, exam] = await Promise.all([
    Class.findById(classId),
    Exam.findById(examId),
  ]);

  if (!cls) throw new AppError('Class not found.', 404);
  if (!exam) throw new AppError('Exam not found.', 404);

  const students = await Student.find({ classId, isActive: true });
  const studentIds = students.map((s) => s._id);

  const memos = await Memo.find({ examId, studentId: { $in: studentIds } })
    .populate('studentId', 'firstName lastName admissionNo rollNo');

  if (memos.length === 0) {
    return sendSuccess(res, 200, 'No memos generated yet for this class exam.', {
      class: cls,
      exam,
      summary: { totalStudents: students.length, passCount: 0, failCount: 0, passPercentage: 0 },
      memos: [],
    });
  }

  const passCount = memos.filter((m) => m.result === 'pass').length;
  const failCount = memos.filter((m) => m.result === 'fail').length;
  const absentCount = memos.filter((m) => m.result === 'absent').length;
  const avgPercentage = (
    memos.reduce((sum, m) => sum + (m.percentage || 0), 0) / (memos.length || 1)
  ).toFixed(2);

  sendSuccess(res, 200, 'Class report generated.', {
    class: { id: cls._id, name: cls.name, section: cls.section },
    exam: { id: exam._id, name: exam.name, type: exam.type },
    summary: {
      totalCandidates: memos.length,
      passed: passCount,
      failed: failCount,
      absent: absentCount,
      passPercentage: parseFloat(((passCount / memos.length) * 100).toFixed(2)),
      averagePercentage: parseFloat(avgPercentage),
    },
    students: memos,
  });
});

/**
 * Individual student comprehensive academic report across exams
 * GET /api/v1/reports/student/:studentId
 */
const getStudentReport = asyncWrapper(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId)
    .populate('classId', 'name section')
    .populate('parentId', 'firstName lastName phone');

  if (!student) throw new AppError('Student not found.', 404);

  const memos = await Memo.find({ studentId })
    .populate('examId', 'name type startDate academicYear')
    .sort({ 'examId.startDate': 1 });

  sendSuccess(res, 200, 'Student report fetched.', {
    student,
    examHistory: memos,
  });
});

/**
 * Exam overview report with grade distributions
 * GET /api/v1/reports/exam/:examId
 */
const getExamReport = asyncWrapper(async (req, res) => {
  const { examId } = req.params;
  const exam = await Exam.findById(examId).populate('classId', 'name section');
  if (!exam) throw new AppError('Exam not found.', 404);

  const memos = await Memo.find({ examId });

  // Compute grade distribution
  const gradeDistribution = {
    'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0,
  };

  memos.forEach((m) => {
    if (gradeDistribution[m.grade] !== undefined) {
      gradeDistribution[m.grade] += 1;
    }
  });

  const topRankers = await Memo.find({ examId })
    .populate('studentId', 'firstName lastName admissionNo rollNo')
    .sort({ rank: 1 })
    .limit(5);

  sendSuccess(res, 200, 'Exam report generated.', {
    exam,
    totalMemos: memos.length,
    gradeDistribution,
    topRankers,
  });
});

module.exports = { getClassReport, getStudentReport, getExamReport };

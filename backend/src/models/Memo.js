'use strict';
const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
    },
    totalMarksObtained: { type: Number, required: true, min: 0 },
    totalMaxMarks: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    rank: { type: Number, min: 1 },
    grade: { type: String, required: true, trim: true },
    result: {
      type: String,
      enum: ['pass', 'fail', 'absent', 'withheld'],
      default: 'pass',
    },
    subjectWise: [
      {
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        subjectName: String,
        marksObtained: Number,
        maxMarks: Number,
        passingMarks: Number,
        grade: String,
        isAbsent: { type: Boolean, default: false },
      },
    ],
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pdfPath: { type: String }, // relative path to generated PDF
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    academicYear: { type: String, required: true },
  },
  { timestamps: true }
);

memoSchema.index({ studentId: 1, examId: 1 }, { unique: true });
memoSchema.index({ examId: 1 });
memoSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Memo', memoSchema);

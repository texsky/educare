'use strict';
const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    marksObtained: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      default: null,
    },
    practicalMarks: { type: Number, min: 0, default: 0 },
    grade: { type: String, trim: true },
    isAbsent: { type: Boolean, default: false },
    uploadedImage: { type: String }, // path to uploaded answer-sheet image
    ocrRaw: { type: String }, // raw OCR text output
    ocrParsedMarks: { type: Number }, // marks parsed from OCR
    entryMethod: {
      type: String,
      enum: ['manual', 'ocr', 'bulk'],
      default: 'manual',
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: { type: Date },
    remarks: { type: String, trim: true },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

marksSchema.index({ studentId: 1, examId: 1, subjectId: 1 }, { unique: true });
marksSchema.index({ examId: 1 });
marksSchema.index({ reviewStatus: 1 });

module.exports = mongoose.model('Marks', marksSchema);

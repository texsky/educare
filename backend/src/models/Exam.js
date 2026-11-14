'use strict';
const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['unit', 'midterm', 'final', 'practical', 'assignment'],
        message: 'Invalid exam type',
      },
      required: [true, 'Exam type is required'],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        examDate: { type: Date },
        startTime: { type: String },
        endTime: { type: String },
        maxMarks: { type: Number },
        passingMarks: { type: Number },
      },
    ],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    academicYear: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{4}$/, 'Academic year format: YYYY-YYYY'],
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instructions: { type: String, trim: true },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

examSchema.index({ classId: 1, academicYear: 1 });
examSchema.index({ type: 1 });

module.exports = mongoose.model('Exam', examSchema);

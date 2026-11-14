'use strict';
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks required'],
      min: [1, 'Max marks must be at least 1'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks required'],
      min: [0, 'Passing marks cannot be negative'],
    },
    isTheory: { type: Boolean, default: true },
    isPractical: { type: Boolean, default: false },
    practicalMaxMarks: { type: Number, default: 0 },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.index({ classId: 1 });
subjectSchema.index({ code: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);

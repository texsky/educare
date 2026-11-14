'use strict';
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{4}$/, 'Academic year format: YYYY-YYYY'],
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    roomNo: { type: String, trim: true },
    maxStrength: { type: Number, default: 40, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });
classSchema.index({ classTeacherId: 1 });

module.exports = mongoose.model('Class', classSchema);

'use strict';
const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    year: { type: Number },
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    phone: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    photo: { type: String },
    qualifications: [qualificationSchema],
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    designation: { type: String, default: 'Teacher', trim: true },
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    specialization: { type: String, trim: true },
    experience: { type: Number, default: 0, min: 0 }, // years
  },
  { timestamps: true }
);

teacherSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

teacherSchema.index({ employeeId: 1 });
teacherSchema.index({ userId: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);

'use strict';
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    admissionNo: {
      type: String,
      required: [true, 'Admission number is required'],
      unique: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: { values: ['male', 'female', 'other'], message: 'Invalid gender' },
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      default: 'unknown',
    },
    nationality: { type: String, default: 'Indian', trim: true },
    religion: { type: String, trim: true },
    address: addressSchema,
    photo: { type: String }, // relative path under uploads/
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    section: { type: String, trim: true, uppercase: true },
    rollNo: { type: Number },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    academicYear: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{4}$/, 'Academic year format: YYYY-YYYY'],
    },
    isActive: { type: Boolean, default: true },
    joiningDate: { type: Date, default: Date.now },
    leavingDate: { type: Date },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    medicalNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.index({ classId: 1, section: 1 });
studentSchema.index({ admissionNo: 1 });
studentSchema.index({ parentId: 1 });

module.exports = mongoose.model('Student', studentSchema);

'use strict';
const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    relation: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other'],
      default: 'guardian',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: { type: String, trim: true },
    occupation: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

parentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

parentSchema.index({ userId: 1 });
parentSchema.index({ studentIds: 1 });

module.exports = mongoose.model('Parent', parentSchema);

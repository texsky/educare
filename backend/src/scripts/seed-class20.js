'use strict';

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getMongoUri } = require('../config/db');
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');

const STUDENT_NAMES = [
  'Akhilesh',
  'Ruchi',
  'Bhawna',
  'Isha',
  'Chetan',
  'Neeti',
  'Chanchal',
  'Preeti',
];
const CLASS_NAME = 'Class 20';
const SECTION = 'A';
const STUDENT_PASSWORD = 'Student@123';
const UNKNOWN_DATE_OF_BIRTH = new Date('2000-01-01T00:00:00.000Z');

const academicYearFor = (date = new Date()) => {
  const startYear = date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

const pad = (value) => String(value).padStart(3, '0');

async function seedClass20() {
  const uri = getMongoUri();
  console.log('Connecting to MongoDB at:', uri.replace(/:[^:@]+@/, ':***@'));
  await mongoose.connect(uri);

  try {
    const academicYear = academicYearFor();
    let classroom = await Class.findOne({
      name: CLASS_NAME,
      section: SECTION,
      academicYear,
    });

    if (!classroom) {
      classroom = await Class.create({
        name: CLASS_NAME,
        section: SECTION,
        academicYear,
        roomNo: 'Room 20A',
        maxStrength: 40,
        studentIds: [],
        subjects: [],
        isActive: true,
      });
    } else if (!classroom.isActive) {
      classroom.isActive = true;
      await classroom.save();
    }

    const studentIds = [];
    for (const [index, firstName] of STUDENT_NAMES.entries()) {
      const rollNo = index + 1;
      const email = `class20a${pad(rollNo)}@educare.com`;
      const admissionNo = `ADM-${academicYear.slice(0, 4)}-C20A-${pad(rollNo)}`;

      let user = await User.findOne({ email });
      if (user && user.role !== 'student') {
        throw new Error(`Account ${email} already exists with role "${user.role}".`);
      }

      const existingByAdmission = await Student.findOne({ admissionNo });
      const existingByUser = user ? await Student.findOne({ userId: user._id }) : null;
      if (
        existingByAdmission &&
        existingByUser &&
        !existingByAdmission._id.equals(existingByUser._id)
      ) {
        throw new Error(`Admission number ${admissionNo} and account ${email} belong to different students.`);
      }

      let student = existingByAdmission || existingByUser;
      if (student) {
        if (!user || !student.userId.equals(user._id)) {
          throw new Error(`Existing student ${admissionNo} is not linked to account ${email}.`);
        }
        if (!student.classId.equals(classroom._id)) {
          throw new Error(`Existing student ${admissionNo} is assigned to a different class.`);
        }

        student.isActive = true;
        student.rollNo = rollNo;
        await student.save();
      } else {
        const rollOccupant = await Student.findOne({
          classId: classroom._id,
          rollNo,
          isActive: { $ne: false },
        });
        if (rollOccupant) {
          throw new Error(`Roll number ${rollNo} is already in use in ${CLASS_NAME} ${SECTION}.`);
        }

        if (!user) {
          user = await User.create({
            name: `${firstName} Student`,
            email,
            password: STUDENT_PASSWORD,
            role: 'student',
            isActive: true,
          });
        }

        student = await Student.create({
          userId: user._id,
          admissionNo,
          firstName,
          lastName: 'Student',
          dateOfBirth: UNKNOWN_DATE_OF_BIRTH,
          gender: 'other',
          classId: classroom._id,
          section: SECTION,
          rollNo,
          academicYear,
          isActive: true,
        });
      }

      await User.updateOne(
        { _id: user._id },
        { $set: { profileRef: student._id, profileModel: 'Student', isActive: true } }
      );
      studentIds.push(student._id);
    }

    await Class.updateOne(
      { _id: classroom._id },
      { $addToSet: { studentIds: { $each: studentIds } } }
    );

    console.log(`Seeded ${studentIds.length} students into ${CLASS_NAME} ${SECTION} (${academicYear}).`);
    console.log('No marks, exams, parents, or memos were created.');
    console.log(`Student accounts: class20a001@educare.com through class20a008@educare.com`);
    console.log(`Password for all eight accounts: ${STUDENT_PASSWORD}`);
    console.log('Names and roll numbers:');
    STUDENT_NAMES.forEach((name, index) => console.log(`  ${index + 1}. ${name}`));
    console.log('Last name, date of birth, and gender use placeholders because they were not in the supplied image.');
  } finally {
    await mongoose.disconnect();
  }
}

seedClass20().catch((error) => {
  console.error('Class 20 seed failed:', error);
  process.exitCode = 1;
});

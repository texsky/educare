/**
 * Seeds a complete, linked demo dataset. The CLI mode clears seeded
 * collections; startup mode only seeds when every seeded collection is empty.
 */
'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getMongoUri } = require('../config/db');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Marks = require('../models/Marks');
const Memo = require('../models/Memo');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { assignRanks, getGrade } = require('../utils/gradeCalculator');
const { generateMemoPDF } = require('../utils/pdfGenerator');

const UPLOADS_DIR = process.env.UPLOAD_DIR || 'uploads';
const STUDENTS_PER_CLASS = 30;
const PARENT_COUNT = 120;
const SECTIONS = ['A', 'B'];
const GRADES = [6, 7, 8, 9, 10];
const SUBJECTS = [
  { name: 'Mathematics', key: 'MATH' },
  { name: 'English', key: 'ENG' },
  { name: 'Science', key: 'SCI' },
  { name: 'Social Studies', key: 'SOC' },
  { name: 'Computer Science', key: 'CS' },
  { name: 'Physical Education', key: 'PE' },
];
const FIRST_NAMES = [
  'Aarav', 'Aisha', 'Alex', 'Amara', 'Anaya', 'Arjun', 'Ava', 'Daniel', 'Ethan',
  'Fatima', 'Grace', 'Ishaan', 'Jasmine', 'Kabir', 'Leah', 'Liam', 'Maya', 'Noah',
  'Olivia', 'Priya', 'Rohan', 'Sara', 'Sophia', 'Theo', 'Uma', 'Vihaan', 'William',
  'Yara', 'Zara', 'Zayn',
];
const CLASS20_STUDENT_NAMES = [
  'Akhilesh', 'Ruchi', 'Bhawna', 'Isha', 'Chetan', 'Neeti', 'Chanchal', 'Preeti',
];
const LAST_NAMES = [
  'Anderson', 'Bennett', 'Brown', 'Campbell', 'Clark', 'Davis', 'Garcia', 'Hall',
  'Harris', 'Johnson', 'Khan', 'Lee', 'Lewis', 'Martin', 'Miller', 'Morgan',
  'Patel', 'Robinson', 'Sharma', 'Singh', 'Smith', 'Taylor', 'Thomas', 'Verma',
  'Walker', 'White', 'Wilson', 'Wright', 'Young', 'Zhang',
];
const TEACHER_NAMES = [
  ['Alice', 'Johnson'], ['Bob', 'Smith'], ['Clara', 'Oswald'], ['David', 'Miller'],
  ['Elena', 'Garcia'], ['Farah', 'Khan'], ['George', 'Taylor'], ['Hana', 'Patel'],
  ['Isaac', 'Brown'], ['Julia', 'Davis'], ['Kiran', 'Sharma'], ['Leo', 'Wilson'],
  ['Meera', 'Singh'], ['Nathan', 'Clark'], ['Olga', 'Martin'], ['Peter', 'Lee'],
  ['Quinn', 'Walker'], ['Riya', 'Thomas'], ['Sam', 'White'], ['Tara', 'Morgan'],
];

const academicYearFor = (date = new Date()) => {
  const startYear = date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

const shiftMonths = (date, months) => {
  const shifted = new Date(date);
  shifted.setMonth(shifted.getMonth() + months);
  return shifted;
};

const plusDays = (date, days) => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

const pad = (value, length = 3) => String(value).padStart(length, '0');
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

async function seed({
  clearExisting = true,
  manageConnection = true,
  logCredentials = true,
} = {}) {
  const uri = getMongoUri();
  if (manageConnection) {
    console.log('🌱 Connecting to MongoDB at:', uri.replace(/:[^:@]+@/, ':***@'));
    await mongoose.connect(uri);
  }

  try {
    const seededModels = [
      User, Teacher, Student, Parent, Class, Subject, Exam, Marks, Memo, Notification, AuditLog,
    ];

    if (clearExisting) {
      console.log('⚠️  Clearing demo collections before inserting the new dataset…');
      await Promise.all(seededModels.map((model) => model.deleteMany({})));
    } else {
      const collectionCounts = await Promise.all(
        seededModels.map((model) => model.countDocuments({}))
      );
      const existingCollections = seededModels
        .filter((_, index) => collectionCounts[index] > 0)
        .map((model) => model.collection.collectionName);

      if (existingCollections.length) {
        console.log(
          `SEED_DATA enabled, but existing data was found in: ${existingCollections.join(', ')}. ` +
          'Skipping demo seed to preserve database contents.'
        );
        return false;
      }

      console.log('SEED_DATA enabled and seeded collections are empty; inserting demo data.');
    }

    const academicYear = academicYearFor();
    const currentDate = new Date();
    const passwordHashes = new Map();
    const insertSeedUsers = async (userRows) => {
      const hashedRows = await Promise.all(userRows.map(async (user) => {
        let hashPromise = passwordHashes.get(user.password);
        if (!hashPromise) {
          hashPromise = bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
          passwordHashes.set(user.password, hashPromise);
        }
        return { ...user, password: await hashPromise };
      }));
      return User.insertMany(hashedRows);
    };

    const [admin] = await insertSeedUsers([{
      name: 'System Administrator',
      email: 'admin@educare.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true,
    }]);

    const teacherUsers = await insertSeedUsers(
      TEACHER_NAMES.map(([first, last], index) => ({
        name: `${first} ${last}`,
        email: `teacher${pad(index + 1, 2)}@educare.com`,
        password: 'Teacher@123',
        role: 'teacher',
        isActive: true,
      }))
    );

    const parentUsers = await insertSeedUsers(
      Array.from({ length: PARENT_COUNT }, (_, index) => {
        const first = FIRST_NAMES[(index + 4) % FIRST_NAMES.length];
        const last = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length];
        return {
          name: `${first} ${last}`,
          email: `parent${pad(index + 1)}@educare.com`,
          password: 'Parent@123',
          role: 'parent',
          isActive: true,
        };
      })
    );

    const studentUsers = await insertSeedUsers(
      Array.from({ length: GRADES.length * SECTIONS.length * STUDENTS_PER_CLASS }, (_, index) => {
        const first = FIRST_NAMES[index % FIRST_NAMES.length];
        const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
        return {
          name: `${first} ${last}`,
          email: `student${pad(index + 1)}@educare.com`,
          password: 'Student@123',
          role: 'student',
          isActive: true,
        };
      })
    );

    const classDefinitions = GRADES.flatMap((grade) =>
      SECTIONS.map((section) => ({ grade, section }))
    );
    const classes = await Class.create(classDefinitions.map(({ grade, section }) => ({
      name: `Grade ${grade}`,
      section,
      academicYear,
      roomNo: `Room ${grade}${section}`,
      maxStrength: 35,
      studentIds: [],
      subjects: [],
      isActive: true,
    })));
    const class20 = await Class.create({
      name: 'Class 20',
      section: 'A',
      academicYear,
      roomNo: 'Room 20A',
      maxStrength: 40,
      studentIds: [],
      subjects: [],
      isActive: true,
    });

    const teachers = await Teacher.create(TEACHER_NAMES.map(([firstName, lastName], index) => ({
      userId: teacherUsers[index]._id,
      employeeId: `EMP${pad(index + 1, 3)}`,
      firstName,
      lastName,
      email: teacherUsers[index].email,
      phone: `+91-98765${pad(index + 1, 5)}`,
      designation: index < 5 ? 'Senior Teacher' : 'Subject Teacher',
      specialization: SUBJECTS[index % SUBJECTS.length].name,
      gender: index % 2 === 0 ? 'female' : 'male',
      qualifications: [{
        degree: index % 2 === 0 ? 'M.Sc Education' : 'B.Ed',
        institution: 'EduCare Institute of Education',
        year: 2015 + (index % 8),
      }],
      classes: [],
      subjects: [],
      isActive: true,
    })));

    const parents = await Parent.create(parentUsers.map((user, index) => ({
      userId: user._id,
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ').slice(1).join(' '),
      phone: `+91-91234${pad(index + 1, 5)}`,
      relation: index % 2 === 0 ? 'mother' : 'father',
      occupation: ['Teacher', 'Engineer', 'Doctor', 'Business Owner', 'Accountant'][index % 5],
      address: {
        street: `${index + 10} School Road`,
        city: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai'][index % 4],
        state: ['Karnataka', 'Telangana', 'Maharashtra', 'Tamil Nadu'][index % 4],
        pincode: String(560001 + index),
        country: 'India',
      },
      studentIds: [],
      isActive: true,
    })));

    const students = await Student.create(studentUsers.map((user, index) => {
      const classIndex = Math.floor(index / STUDENTS_PER_CLASS);
      const parentIndex = index % parents.length;
      const [firstName, ...lastParts] = user.name.split(' ');
      return {
        userId: user._id,
        admissionNo: `ADM-${academicYear.slice(0, 4)}-${pad(index + 1)}`,
        firstName,
        lastName: lastParts.join(' '),
        dateOfBirth: new Date(currentDate.getFullYear() - 14 - (index % 4), index % 12, 12),
        gender: index % 2 === 0 ? 'female' : 'male',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][index % 4],
        address: {
          street: `${index + 1} Student Avenue`,
          city: ['Bengaluru', 'Hyderabad', 'Pune', 'Chennai'][classIndex % 4],
          state: ['Karnataka', 'Telangana', 'Maharashtra', 'Tamil Nadu'][classIndex % 4],
          pincode: String(560001 + index),
          country: 'India',
        },
        classId: classes[classIndex]._id,
        section: classes[classIndex].section,
        rollNo: (index % STUDENTS_PER_CLASS) + 1,
        parentId: parents[parentIndex]._id,
        academicYear,
        isActive: true,
      };
    }));

    const class20Users = await insertSeedUsers(CLASS20_STUDENT_NAMES.map((firstName, index) => ({
      name: `${firstName} Student`,
      email: `class20a${pad(index + 1)}@educare.com`,
      password: 'Student@123',
      role: 'student',
      isActive: true,
    })));
    const class20Students = await Student.create(class20Users.map((user, index) => ({
      userId: user._id,
      admissionNo: `ADM-${academicYear.slice(0, 4)}-C20A-${pad(index + 1)}`,
      firstName: CLASS20_STUDENT_NAMES[index],
      lastName: 'Student',
      dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
      gender: 'other',
      classId: class20._id,
      section: 'A',
      rollNo: index + 1,
      academicYear,
      isActive: true,
    })));

    await Promise.all([
      Class.updateOne(
        { _id: class20._id },
        { $set: { studentIds: class20Students.map((student) => student._id) } }
      ),
      ...class20Students.map((student, index) => User.updateOne(
        { _id: class20Users[index]._id },
        { $set: { profileRef: student._id, profileModel: 'Student' } }
      )),
    ]);

    const subjectRows = [];
    const classStudentIds = classes.map(() => []);
    const parentStudentIds = parents.map(() => []);
    const teacherClassIds = teachers.map(() => []);
    const teacherSubjectIds = teachers.map(() => []);
    const teacherForSubject = new Map();
    const subjectsByClass = classes.map(() => []);

    students.forEach((student, index) => {
      const classIndex = Math.floor(index / STUDENTS_PER_CLASS);
      const parentIndex = index % parents.length;
      classStudentIds[classIndex].push(student._id);
      parentStudentIds[parentIndex].push(student._id);
    });

    classes.forEach((classDoc, classIndex) => {
      const classTeacherIndex = classIndex % teachers.length;
      teacherClassIds[classTeacherIndex].push(classDoc._id);

      SUBJECTS.forEach((subjectDefinition, subjectIndex) => {
        const teacherIndex = (classIndex * 3 + subjectIndex) % teachers.length;
        const subjectId = new mongoose.Types.ObjectId();
        teacherClassIds[teacherIndex].push(classDoc._id);
        teacherSubjectIds[teacherIndex].push(subjectId);
        subjectsByClass[classIndex].push(subjectId);
        teacherForSubject.set(subjectId.toString(), teacherIndex);
        subjectRows.push({
          _id: subjectId,
          name: subjectDefinition.name,
          code: `G${classDoc.name.replace('Grade ', '')}${classDoc.section}-${subjectDefinition.key}`,
          classId: classDoc._id,
          teacherId: teachers[teacherIndex]._id,
          maxMarks: 100,
          passingMarks: 40,
          isTheory: true,
          isPractical: false,
          practicalMaxMarks: 0,
          isActive: true,
        });
      });
    });

    const subjects = await Subject.create(subjectRows);
    await Promise.all([
      ...classes.map((classDoc, index) => Class.updateOne(
        { _id: classDoc._id },
        {
          $set: {
            classTeacherId: teachers[index % teachers.length]._id,
            studentIds: classStudentIds[index],
            subjects: subjectsByClass[index],
          },
        }
      )),
      ...teachers.map((teacher, index) => Teacher.updateOne(
        { _id: teacher._id },
        {
          $set: {
            classes: [...new Set(teacherClassIds[index].map(String))],
            subjects: teacherSubjectIds[index],
          },
        }
      )),
      ...parents.map((parent, index) => Parent.updateOne(
        { _id: parent._id },
        { $set: { studentIds: parentStudentIds[index] } }
      )),
      User.updateOne(
        { _id: admin._id },
        { $set: { profileRef: null, profileModel: null } }
      ),
      ...teachers.map((teacher, index) => User.updateOne(
        { _id: teacherUsers[index]._id },
        { $set: { profileRef: teacher._id, profileModel: 'Teacher' } }
      )),
      ...parents.map((parent, index) => User.updateOne(
        { _id: parentUsers[index]._id },
        { $set: { profileRef: parent._id, profileModel: 'Parent' } }
      )),
      ...students.map((student, index) => User.updateOne(
        { _id: studentUsers[index]._id },
        { $set: { profileRef: student._id, profileModel: 'Student' } }
      )),
    ]);

    const exams = [];
    const examConfigs = [
      { name: 'Term 1 Assessment', type: 'unit', monthOffset: -5, status: 'completed', isPublished: true },
      { name: 'Mid-Year Examination', type: 'midterm', monthOffset: -2, status: 'completed', isPublished: true },
      { name: 'Final Examination', type: 'final', monthOffset: 1, status: 'upcoming', isPublished: false },
    ];

    classDefinitions.forEach((_, classIndex) => {
      examConfigs.forEach((config) => {
        const startDate = shiftMonths(currentDate, config.monthOffset);
        exams.push({
          name: `Grade ${classDefinitions[classIndex].grade} ${config.name}`,
          type: config.type,
          classId: classes[classIndex]._id,
          subjects: subjectsByClass[classIndex].map((subjectId) => ({
            subjectId,
            maxMarks: 100,
            passingMarks: 40,
          })),
          startDate,
          endDate: plusDays(startDate, 5),
          academicYear,
          isPublished: config.isPublished,
          publishedAt: config.isPublished ? plusDays(startDate, 7) : undefined,
          createdBy: admin._id,
          status: config.status,
          instructions: 'Bring your student identification and required stationery.',
        });
      });
    });
    const createdExams = await Exam.create(exams);

    const marksRows = [];
    const memosRows = [];
    const completedExamCount = 2;
    for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
      const classStudents = students.slice(
        classIndex * STUDENTS_PER_CLASS,
        (classIndex + 1) * STUDENTS_PER_CLASS
      );
      const classSubjects = subjects.filter((subject) => subject.classId.equals(classes[classIndex]._id));

      for (let examIndex = 0; examIndex < completedExamCount; examIndex += 1) {
        const exam = createdExams[classIndex * examConfigs.length + examIndex];
        const studentSummaries = [];

        classStudents.forEach((student, studentIndex) => {
          let totalObtained = 0;
          let totalMax = 0;
          let failed = false;
          const subjectWise = [];

          classSubjects.forEach((subject, subjectIndex) => {
            const score = 25 + ((studentIndex * 13 + subjectIndex * 17 + examIndex * 19) % 76);
            const grade = getGrade(score).grade;
            const teacherIndex = teacherForSubject.get(subject._id.toString());
            totalObtained += score;
            totalMax += subject.maxMarks;
            if (score < subject.passingMarks) failed = true;

            marksRows.push({
              studentId: student._id,
              examId: exam._id,
              subjectId: subject._id,
              marksObtained: score,
              practicalMarks: 0,
              grade,
              isAbsent: false,
              entryMethod: 'manual',
              reviewStatus: 'approved',
              reviewedBy: admin._id,
              reviewedAt: plusDays(exam.endDate, 1),
              enteredBy: teacherUsers[teacherIndex]._id,
            });
            subjectWise.push({
              subjectId: subject._id,
              subjectName: subject.name,
              marksObtained: score,
              maxMarks: subject.maxMarks,
              passingMarks: subject.passingMarks,
              grade,
              isAbsent: false,
            });
          });

          const percentage = Number(((totalObtained / totalMax) * 100).toFixed(2));
          studentSummaries.push({
            student,
            totalObtained,
            totalMax,
            percentage,
            grade: getGrade(percentage).grade,
            result: failed ? 'fail' : 'pass',
            subjectWise,
          });
        });

        const ranked = assignRanks(studentSummaries.map((summary) => ({
          studentId: summary.student._id.toString(),
          totalMarks: summary.totalObtained,
        })));
        const rankByStudent = new Map(ranked.map((row) => [row.studentId, row.rank]));

        studentSummaries.forEach((summary) => {
          memosRows.push({
            _id: new mongoose.Types.ObjectId(),
            studentId: summary.student._id,
            examId: exam._id,
            totalMarksObtained: summary.totalObtained,
            totalMaxMarks: summary.totalMax,
            percentage: summary.percentage,
            rank: rankByStudent.get(summary.student._id.toString()),
            grade: summary.grade,
            result: summary.result,
            subjectWise: summary.subjectWise,
            isPublished: true,
            publishedAt: exam.publishedAt,
            academicYear,
            generatedBy: admin._id,
            generatedAt: plusDays(exam.endDate, 7),
          });
        });
      }
    }

    const upcomingExams = createdExams.filter((exam) => exam.status === 'upcoming');
    upcomingExams.forEach((exam, classIndex) => {
      const classStudents = students.slice(
        classIndex * STUDENTS_PER_CLASS,
        (classIndex + 1) * STUDENTS_PER_CLASS
      );
      const subject = subjects.find((item) => item.classId.equals(exam.classId));
      const teacherIndex = teacherForSubject.get(subject._id.toString());
      classStudents.slice(0, 5).forEach((student) => {
        const marksObtained = 55 + ((student.rollNo * 7) % 46);
        marksRows.push({
          studentId: student._id,
          examId: exam._id,
          subjectId: subject._id,
          marksObtained,
          grade: getGrade(marksObtained).grade,
          isAbsent: false,
          entryMethod: 'manual',
          reviewStatus: 'pending',
          enteredBy: teacherUsers[teacherIndex]._id,
          remarks: `Awaiting review for ${student.firstName}'s assessment.`,
        });
      });
    });

    const [savedMarks, savedMemos] = await Promise.all([
      Marks.insertMany(marksRows),
      Memo.insertMany(memosRows),
    ]);

    const studentsById = new Map(students.map((student) => [student._id.toString(), student]));
    const classesById = new Map(classes.map((classDoc) => [classDoc._id.toString(), classDoc]));
    const examsById = new Map(createdExams.map((exam) => [exam._id.toString(), exam]));
    const pdfUpdates = [];
    for (let offset = 0; offset < savedMemos.length; offset += 20) {
      const batch = savedMemos.slice(offset, offset + 20);
      const batchUpdates = await Promise.all(batch.map(async (memo) => {
        const student = studentsById.get(memo.studentId.toString());
        const exam = examsById.get(memo.examId.toString());
        const examForPdf = {
          ...exam.toObject(),
          classId: classesById.get(exam.classId.toString()),
        };
        const relativePath = path.join('memos', `memo_${memo._id}.pdf`);
        const outputPath = path.resolve(UPLOADS_DIR, relativePath);
        await generateMemoPDF({ student, exam: examForPdf, memo, outputPath });
        return {
          updateOne: {
            filter: { _id: memo._id },
            update: { $set: { pdfPath: relativePath } },
          },
        };
      }));
      pdfUpdates.push(...batchUpdates);
    }
    await Memo.bulkWrite(pdfUpdates);

    const notificationRows = Array.from({ length: 120 }, (_, index) => {
      const isStudent = index % 2 === 0;
      const user = isStudent ? studentUsers[index % studentUsers.length] : parentUsers[index % parentUsers.length];
      const student = isStudent ? students[index % students.length] : null;
      const createdAt = plusDays(currentDate, -(index % 21));
      return {
        _id: new mongoose.Types.ObjectId(),
        userId: user._id,
        type: 'in-app',
        subject: 'School update',
        message: student
          ? `Your school account is active for ${student.academicYear}. Check the portal for results and announcements.`
          : 'Welcome to the EduCare family portal. Linked student results and school notices are available here.',
        recipientEmail: user.email,
        status: 'sent',
        sentAt: createdAt,
        isRead: index % 3 === 0,
        readAt: index % 3 === 0 ? plusDays(createdAt, 1) : undefined,
        metadata: { category: 'school-update' },
        createdAt,
        updatedAt: createdAt,
      };
    });
    await Notification.insertMany(notificationRows);

    const auditActions = ['CREATE', 'UPDATE', 'PUBLISH', 'APPROVE', 'LOGIN'];
    const auditEntities = [
      ['Student', [...students, ...class20Students]], ['Class', [...classes, class20]], ['Exam', createdExams],
      ['Memo', memosRows], ['Notification', notificationRows],
    ];
    const auditRows = Array.from({ length: 150 }, (_, index) => {
      const [entity, records] = auditEntities[index % auditEntities.length];
      const record = records[Math.floor(index / auditEntities.length) % records.length];
      const createdAt = plusDays(currentDate, -(index % 30));
      return {
        userId: index % 4 === 0 ? teacherUsers[index % teacherUsers.length]._id : admin._id,
        action: auditActions[index % auditActions.length],
        entity,
        entityId: record._id,
        description: `${auditActions[index % auditActions.length]} ${entity.toLowerCase()} demo record`,
        timestamp: createdAt,
      };
    });
    await AuditLog.insertMany(auditRows);

    console.log('\n✅ Seed complete.');
    console.log('   Academic year:', academicYear);
    console.log(`   Users: 1 admin, ${teachers.length} teachers, ${parents.length} parents, ${students.length + class20Students.length} students`);
    console.log(`   Classes: ${classes.length + 1} | Subjects: ${subjects.length} | Exams: ${createdExams.length}`);
    console.log(`   Marks: ${savedMarks.length} | Published memos with PDFs: ${savedMemos.length}`);
    console.log(`   Notifications: ${notificationRows.length} | Audit logs: ${auditRows.length}`);
    if (logCredentials) {
      console.log('\n🔑 Demo credentials (all seeded users are active):');
      console.log('   Admin   admin@educare.com / Admin@123');
      console.log('   Teacher teacher01@educare.com / Teacher@123');
      console.log('   Parent  parent001@educare.com / Parent@123');
      console.log('   Student student001@educare.com / Student@123\n');
    }
    return true;
  } finally {
    if (manageConnection) await mongoose.disconnect();
  }
}

if (require.main === module) {
  const clearExisting = !process.argv.includes('--if-empty');
  seed({ clearExisting }).catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { seed };

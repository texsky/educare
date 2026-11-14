'use strict';
const express = require('express');
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const teacherRoutes = require('./teacher.routes');
const parentRoutes = require('./parent.routes');
const classRoutes = require('./class.routes');
const subjectRoutes = require('./subject.routes');
const examRoutes = require('./exam.routes');
const marksRoutes = require('./marks.routes');
const memoRoutes = require('./memo.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');
const reportRoutes = require('./report.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/parents', parentRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/exams', examRoutes);
router.use('/marks', marksRoutes);
router.use('/memos', memoRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

module.exports = router;

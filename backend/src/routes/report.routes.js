'use strict';
const express = require('express');
const {
  getClassReport,
  getStudentReport,
  getExamReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/class/:classId/exam/:examId', authorize('admin', 'teacher'), getClassReport);
router.get('/student/:studentId', authorize('admin', 'teacher', 'student', 'parent'), getStudentReport);
router.get('/exam/:examId', authorize('admin', 'teacher'), getExamReport);

module.exports = router;

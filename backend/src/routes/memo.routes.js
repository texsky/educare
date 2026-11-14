'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  generateMemo,
  getMemos,
  getMemoById,
  downloadMemo,
  publishResults,
  getMemoByStudent,
  getMemosByExam,
} = require('../controllers/memoController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'teacher', 'student', 'parent'), getMemos);
router.get('/:id', authorize('admin', 'teacher', 'student', 'parent'), getMemoById);

router.post(
  '/generate',
  authorize('admin', 'teacher'),
  [body('examId').isMongoId().withMessage('Valid examId required')],
  validate,
  generateMemo
);

router.patch(
  '/publish',
  authorize('admin'),
  [body('examId').isMongoId().withMessage('Valid examId required')],
  validate,
  publishResults
);

router.get('/exam/:examId', authorize('admin', 'teacher'), getMemosByExam);
router.get('/student/:studentId/exam/:examId', authorize('admin', 'teacher', 'student', 'parent'), getMemoByStudent);
router.get('/:id/download', authorize('admin', 'teacher', 'student', 'parent'), downloadMemo);

module.exports = router;

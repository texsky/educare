'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  createExam,
  getAllExams,
  getExam,
  updateExam,
  deleteExam,
  publishExam,
} = require('../controllers/examController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'teacher', 'student', 'parent'), getAllExams);
router.get('/:id', authorize('admin', 'teacher', 'student', 'parent'), getExam);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Exam name is required'),
    body('type').isIn(['unit', 'midterm', 'final', 'practical', 'assignment']).withMessage('Valid exam type required'),
    body('classId').isMongoId().withMessage('Valid classId required'),
    body('startDate').isISO8601().withMessage('Valid startDate required'),
    body('endDate').isISO8601().withMessage('Valid endDate required'),
    body('academicYear').matches(/^\d{4}-\d{4}$/).withMessage('academicYear format: YYYY-YYYY'),
  ],
  validate,
  createExam
);

router.put('/:id', authorize('admin'), updateExam);
router.delete('/:id', authorize('admin'), deleteExam);
router.patch('/:id/publish', authorize('admin'), publishExam);

module.exports = router;

'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'teacher', 'student', 'parent'), getAllSubjects);
router.get('/:id', authorize('admin', 'teacher', 'student', 'parent'), getSubject);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Subject name is required'),
    body('code').notEmpty().withMessage('Subject code is required'),
    body('classId').isMongoId().withMessage('Valid classId required'),
    body('maxMarks').isNumeric().withMessage('maxMarks must be numeric'),
    body('passingMarks').isNumeric().withMessage('passingMarks must be numeric'),
  ],
  validate,
  createSubject
);

router.put('/:id', authorize('admin'), updateSubject);
router.delete('/:id', authorize('admin'), deleteSubject);

module.exports = router;

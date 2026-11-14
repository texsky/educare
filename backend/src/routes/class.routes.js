'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  createClass,
  getAllClasses,
  getClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
} = require('../controllers/classController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();
const classTeacherValidation = body('classTeacherId')
  .optional({ values: 'falsy' })
  .isMongoId()
  .withMessage('Valid classTeacherId required');

router.use(protect);

router.get('/', authorize('admin', 'teacher', 'student', 'parent'), getAllClasses);
router.get('/:id', authorize('admin', 'teacher', 'student', 'parent'), getClass);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Class name is required'),
    body('section').notEmpty().withMessage('Section is required'),
    body('academicYear').matches(/^\d{4}-\d{4}$/).withMessage('academicYear format: YYYY-YYYY'),
    classTeacherValidation,
  ],
  validate,
  createClass
);

router.put('/:id', authorize('admin'), classTeacherValidation, validate, updateClass);
router.delete('/:id', authorize('admin'), deleteClass);

router.post(
  '/:id/add-student',
  authorize('admin'),
  [body('studentId').isMongoId().withMessage('Valid studentId required')],
  validate,
  addStudentToClass
);

router.post(
  '/:id/remove-student',
  authorize('admin'),
  [body('studentId').isMongoId().withMessage('Valid studentId required')],
  validate,
  removeStudentFromClass
);

module.exports = router;

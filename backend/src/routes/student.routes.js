'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const {
  createStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  uploadStudentPhoto,
  getStudentsByClass,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadPhoto } = require('../middlewares/upload');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'teacher'), getAllStudents);
router.get('/class/:classId', authorize('admin', 'teacher'), getStudentsByClass);
router.get('/:id', authorize('admin', 'teacher', 'student', 'parent'), getStudent);

router.post(
  '/',
  authorize('admin'),
  [
    body('userId').isMongoId().withMessage('Valid userId required'),
    body('admissionNo').notEmpty().withMessage('Admission number is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid dateOfBirth required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
    body('classId').isMongoId().withMessage('Valid classId required'),
    body('academicYear').matches(/^\d{4}-\d{4}$/).withMessage('academicYear format: YYYY-YYYY'),
  ],
  validate,
  createStudent
);

router.put('/:id', authorize('admin'), updateStudent);
router.delete('/:id', authorize('admin'), deleteStudent);
router.post('/:id/photo', authorize('admin', 'teacher'), uploadPhoto.single('photo'), uploadStudentPhoto);

module.exports = router;

'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  createTeacher,
  getAllTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  uploadTeacherPhoto,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadPhoto } = require('../middlewares/upload');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'teacher'), getAllTeachers);
router.get('/:id', authorize('admin', 'teacher'), getTeacher);

router.post(
  '/',
  authorize('admin'),
  [
    body('userId').isMongoId().withMessage('Valid userId required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  validate,
  createTeacher
);

router.put('/:id', authorize('admin'), updateTeacher);
router.delete('/:id', authorize('admin'), deleteTeacher);
router.post('/:id/photo', authorize('admin'), uploadPhoto.single('photo'), uploadTeacherPhoto);

module.exports = router;

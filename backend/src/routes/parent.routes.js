'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  getMyParent,
  createParent,
  getAllParents,
  getParent,
  updateParent,
  deleteParent,
  linkStudent,
  unlinkStudent,
} = require('../controllers/parentController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('parent'), getMyParent);
router.get('/', authorize('admin', 'teacher'), getAllParents);
router.get('/:id', authorize('admin', 'teacher', 'parent'), getParent);

router.post(
  '/',
  authorize('admin'),
  [
    body('userId').isMongoId().withMessage('Valid userId required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
  ],
  validate,
  createParent
);

router.put('/:id', authorize('admin'), updateParent);
router.delete('/:id', authorize('admin'), deleteParent);

router.post(
  '/:id/link-student',
  authorize('admin'),
  [body('studentId').isMongoId().withMessage('Valid studentId required')],
  validate,
  linkStudent
);

router.post(
  '/:id/unlink-student',
  authorize('admin'),
  [body('studentId').isMongoId().withMessage('Valid studentId required')],
  validate,
  unlinkStudent
);

module.exports = router;

'use strict';
const express = require('express');
const { body } = require('express-validator');
const {
  uploadMarksOCR,
  manualEntry,
  reviewMarks,
  bulkUpload,
  getMarks,
} = require('../controllers/marksController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadMarksImage } = require('../middlewares/upload');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'teacher'), getMarks);

// Upload answer sheet image and run OCR
router.post(
  '/upload-ocr',
  authorize('admin', 'teacher'),
  uploadMarksImage.single('answerSheet'),
  [
    body('studentId').isMongoId().withMessage('Valid studentId required'),
    body('examId').isMongoId().withMessage('Valid examId required'),
    body('subjectId').isMongoId().withMessage('Valid subjectId required'),
  ],
  validate,
  uploadMarksOCR
);

// Manual entry
router.post(
  '/manual',
  authorize('admin', 'teacher'),
  [body('entries').isArray({ min: 1 }).withMessage('Entries must be a non-empty array')],
  validate,
  manualEntry
);

// Bulk upload
router.post(
  '/bulk',
  authorize('admin'),
  [
    body('examId').isMongoId().withMessage('Valid examId required'),
    body('subjectId').isMongoId().withMessage('Valid subjectId required'),
    body('records').isArray().withMessage('records must be an array'),
  ],
  validate,
  bulkUpload
);

// Review marks (approve/reject)
router.patch(
  '/:id/review',
  authorize('admin', 'teacher'),
  [body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')],
  validate,
  reviewMarks
);

module.exports = router;

'use strict';
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errorHandler');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_IMAGE_SIZE = (parseInt(process.env.MAX_IMAGE_SIZE_MB) || 5) * 1024 * 1024;
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

/** Allowed MIME types */
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = ['application/pdf', ...IMAGE_TYPES];

/** Build a multer storage engine for a given sub-folder */
const buildStorage = (subDir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(UPLOAD_DIR, subDir);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });

/** Generic file-type filter factory */
const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type "${file.mimetype}". Allowed: ${allowedTypes.join(', ')}`,
        400
      ),
      false
    );
  }
};

/** Upload for student/teacher photos */
const uploadPhoto = multer({
  storage: buildStorage('photos'),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: fileFilter(IMAGE_TYPES),
});

/** Upload for marks answer-sheet images */
const uploadMarksImage = multer({
  storage: buildStorage('marks'),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: fileFilter(IMAGE_TYPES),
});

/** Upload for general documents (PDF / image) */
const uploadDocument = multer({
  storage: multer.memoryStorage(), // keep in memory for further processing
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(DOC_TYPES),
});

/** Bulk upload (CSV / Excel in memory) */
const uploadBulk = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(['text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
});

module.exports = { uploadPhoto, uploadMarksImage, uploadDocument, uploadBulk };

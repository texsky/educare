'use strict';
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const logger = require('../config/logger');

const SCHOOL_NAME = process.env.SCHOOL_NAME || 'EduCare International School';
const SCHOOL_ADDRESS = process.env.SCHOOL_ADDRESS || '123 Education Street';
const SCHOOL_PHONE = process.env.SCHOOL_PHONE || '';
const SCHOOL_EMAIL = process.env.SCHOOL_EMAIL || '';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * Generate a memo PDF for a student's exam results.
 * @param {object} opts
 * @param {object} opts.student - Student document (with fullName, admissionNo, classId, etc.)
 * @param {object} opts.exam - Exam document
 * @param {object} opts.memo - Memo document (with subjectWise, percentage, grade, rank, result)
 * @param {string} opts.outputPath - Absolute path to write the PDF.
 * @returns {Promise<string>} Resolves with outputPath on success.
 */
const generateMemoPDF = (opts) =>
  new Promise((resolve, reject) => {
    const { student, exam, memo, outputPath } = opts;

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // --- Header ---
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(SCHOOL_NAME, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(SCHOOL_ADDRESS, { align: 'center' })
      .text(`Phone: ${SCHOOL_PHONE}  |  Email: ${SCHOOL_EMAIL}`, { align: 'center' });

    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('RESULT MEMO', { align: 'center' });

    doc.moveDown(1);

    // --- Student Info Table ---
    const infoY = doc.y;
    const col1 = 60, col2 = 220, col3 = 350, col4 = 480;

    const addInfoRow = (label1, val1, label2, val2) => {
      doc.fontSize(10).font('Helvetica-Bold').text(label1, col1, doc.y, { continued: false });
      doc.fontSize(10).font('Helvetica').text(String(val1 || '-'), col2, doc.y - doc.currentLineHeight(), { continued: false });
      if (label2) {
        doc.fontSize(10).font('Helvetica-Bold').text(label2, col3, doc.y - doc.currentLineHeight() * 2, { continued: false });
        doc.fontSize(10).font('Helvetica').text(String(val2 || '-'), col4, doc.y - doc.currentLineHeight(), { continued: false });
      }
      doc.moveDown(0.4);
    };

    addInfoRow('Student Name:', student.fullName || `${student.firstName} ${student.lastName}`,
               'Admission No:', student.admissionNo);
    addInfoRow('Class:', `${exam.classId?.name || ''} - ${student.section || ''}`,
               'Roll No:', student.rollNo);
    addInfoRow('Exam:', exam.name,
               'Academic Year:', memo.academicYear);
    addInfoRow('Date:', dayjs(memo.generatedAt).format('DD MMM YYYY'), '', '');

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // --- Marks Table Header ---
    doc.fontSize(10).font('Helvetica-Bold');
    const tHeaders = ['Subject', 'Max Marks', 'Marks Obtained', 'Grade', 'Status'];
    const tColWidths = [170, 70, 100, 60, 80];
    const tStartX = 50;
    let tx = tStartX;
    tHeaders.forEach((h, i) => {
      doc.text(h, tx, doc.y, { width: tColWidths[i], align: 'center' });
      tx += tColWidths[i];
    });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.2);

    // --- Marks Table Rows ---
    doc.font('Helvetica').fontSize(10);
    (memo.subjectWise || []).forEach((row) => {
      tx = tStartX;
      const rowY = doc.y;
      const cols = [
        row.subjectName || 'N/A',
        row.maxMarks,
        row.isAbsent ? 'AB' : row.marksObtained,
        row.grade || '-',
        row.isAbsent ? 'Absent' : (row.marksObtained >= 0 ? 'Present' : '-'),
      ];
      cols.forEach((c, i) => {
        doc.text(String(c), tx, rowY, { width: tColWidths[i], align: 'center' });
        tx += tColWidths[i];
      });
      doc.moveDown(0.5);
    });

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // --- Summary ---
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Total Marks: ${memo.totalMarksObtained} / ${memo.totalMaxMarks}`, 60);
    doc.text(`Percentage: ${memo.percentage}%`);
    doc.text(`Grade: ${memo.grade}`);
    doc.text(`Rank: ${memo.rank || 'N/A'}`);
    doc
      .fillColor(memo.result === 'pass' ? '#006400' : '#8B0000')
      .text(`Result: ${(memo.result || 'N/A').toUpperCase()}`)
      .fillColor('black');

    doc.moveDown(2);

    // --- Signatures ---
    doc.fontSize(10).font('Helvetica');
    doc
      .text('Class Teacher', 60, doc.y, { width: 150, align: 'center' })
      .text('Principal', 300, doc.y - doc.currentLineHeight(), { width: 150, align: 'center' });
    doc.moveDown(2);
    doc
      .moveTo(60, doc.y).lineTo(210, doc.y).stroke()
      .moveTo(300, doc.y).lineTo(450, doc.y).stroke();

    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .fillColor('#888888')
      .text(`Generated on ${dayjs().format('DD MMM YYYY HH:mm')} | EduCare Solutions`, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      logger.info(`Memo PDF generated: ${outputPath}`);
      resolve(outputPath);
    });
    stream.on('error', (err) => {
      logger.error(`PDF stream error: ${err.message}`);
      reject(err);
    });
  });

module.exports = { generateMemoPDF };

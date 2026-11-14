'use strict';
const Tesseract = require('tesseract.js');
const logger = require('../config/logger');

/**
 * Extract text from an image buffer using Tesseract.js OCR.
 * @param {Buffer} imageBuffer - Raw image bytes.
 * @param {string} [lang='eng'] - Tesseract language code.
 * @returns {Promise<{ rawText: string, parsedMarks: number|null }>}
 */
const extractTextFromImage = async (imageBuffer, lang = 'eng') => {
  try {
    logger.info('Starting OCR processing…');
    const { data: { text } } = await Tesseract.recognize(imageBuffer, lang, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.debug(`OCR progress: ${(m.progress * 100).toFixed(1)}%`);
        }
      },
    });

    const rawText = text.trim();
    const parsedMarks = parseMarksFromText(rawText);
    logger.info(`OCR complete. Parsed marks: ${parsedMarks}`);
    return { rawText, parsedMarks };
  } catch (err) {
    logger.error(`OCR failed: ${err.message}`);
    throw err;
  }
};

/**
 * Attempt to parse numeric marks from raw OCR text.
 * Looks for patterns like "Total: 85", "Marks: 92/100", or standalone numbers.
 * @param {string} text - Raw OCR output.
 * @returns {number|null}
 */
const parseMarksFromText = (text) => {
  if (!text) return null;

  // Pattern: "Total: 85" or "Marks: 85" or "Score: 85"
  const labeled = text.match(/(?:total|marks?|score|obtained)[:\s]+(\d+(?:\.\d+)?)/i);
  if (labeled) return parseFloat(labeled[1]);

  // Pattern: "85/100" or "85 / 100"
  const fraction = text.match(/(\d+(?:\.\d+)?)\s*\/\s*\d+/);
  if (fraction) return parseFloat(fraction[1]);

  // Last resort: extract all numbers and return the largest reasonable one
  const nums = text.match(/\b\d{1,3}(?:\.\d+)?\b/g);
  if (nums) {
    const candidates = nums.map(Number).filter((n) => n >= 0 && n <= 1000);
    if (candidates.length) return Math.max(...candidates);
  }

  return null;
};

module.exports = { extractTextFromImage, parseMarksFromText };

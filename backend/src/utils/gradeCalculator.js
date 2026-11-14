'use strict';

/**
 * Grade thresholds (percentage-based).
 * Adjust to match your institution's grading policy.
 */
const GRADE_SCALE = [
  { min: 90, grade: 'A+', gpa: 10.0 },
  { min: 80, grade: 'A',  gpa: 9.0 },
  { min: 70, grade: 'B+', gpa: 8.0 },
  { min: 60, grade: 'B',  gpa: 7.0 },
  { min: 50, grade: 'C',  gpa: 6.0 },
  { min: 40, grade: 'D',  gpa: 5.0 },
  { min: 0,  grade: 'F',  gpa: 0.0 },
];

/**
 * Get grade and GPA for a given percentage.
 * @param {number} percentage
 * @returns {{ grade: string, gpa: number }}
 */
const getGrade = (percentage) => {
  const entry = GRADE_SCALE.find((g) => percentage >= g.min);
  return entry ? { grade: entry.grade, gpa: entry.gpa } : { grade: 'F', gpa: 0 };
};

/**
 * Calculate percentage from obtained vs maximum marks.
 * @param {number} obtained
 * @param {number} maxMarks
 * @returns {number} Rounded to 2 decimal places.
 */
const calcPercentage = (obtained, maxMarks) => {
  if (!maxMarks || maxMarks === 0) return 0;
  return parseFloat(((obtained / maxMarks) * 100).toFixed(2));
};

/**
 * Determine if a student passed based on marks and passing threshold.
 * @param {number} marksObtained
 * @param {number} passingMarks
 * @param {boolean} [isAbsent=false]
 * @returns {boolean}
 */
const isPassed = (marksObtained, passingMarks, isAbsent = false) => {
  if (isAbsent) return false;
  return marksObtained >= passingMarks;
};

/**
 * Compute rank positions for an array of student scores.
 * @param {Array<{ studentId: string, totalMarks: number }>} scores - Sorted descending externally.
 * @returns {Array<{ studentId: string, totalMarks: number, rank: number }>}
 */
const assignRanks = (scores) => {
  const sorted = [...scores].sort((a, b) => b.totalMarks - a.totalMarks);
  let rank = 1;
  return sorted.map((s, i) => {
    if (i > 0 && s.totalMarks < sorted[i - 1].totalMarks) rank = i + 1;
    return { ...s, rank };
  });
};

/**
 * Full summary for a student: total, percentage, grade, pass/fail.
 * @param {Array<{ marksObtained: number, maxMarks: number, passingMarks: number, isAbsent?: boolean }>} subjects
 * @returns {{ totalObtained: number, totalMax: number, percentage: number, grade: string, gpa: number, result: string }}
 */
const calcStudentSummary = (subjects) => {
  let totalObtained = 0;
  let totalMax = 0;
  let hasFail = false;
  let hasAbsent = false;

  subjects.forEach(({ marksObtained, maxMarks, passingMarks, isAbsent }) => {
    if (isAbsent) {
      hasAbsent = true;
      totalMax += maxMarks || 0;
    } else {
      totalObtained += marksObtained || 0;
      totalMax += maxMarks || 0;
      if (!isPassed(marksObtained, passingMarks, isAbsent)) hasFail = true;
    }
  });

  const percentage = calcPercentage(totalObtained, totalMax);
  const { grade, gpa } = getGrade(percentage);
  const result = hasAbsent ? 'absent' : hasFail ? 'fail' : 'pass';

  return { totalObtained, totalMax, percentage, grade, gpa, result };
};

module.exports = { getGrade, calcPercentage, isPassed, assignRanks, calcStudentSummary, GRADE_SCALE };

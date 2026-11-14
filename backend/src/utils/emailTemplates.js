'use strict';

const SCHOOL_NAME = process.env.SCHOOL_NAME || 'EduCare Solutions';
const SCHOOL_EMAIL = process.env.SCHOOL_EMAIL || 'info@educare.com';

/** Shared HTML wrapper */
const wrap = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff;
                 border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .header { background: #1a3c6e; color: #fff; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .footer { background: #f0f0f0; text-align: center; padding: 16px; font-size: 12px; color: #888; }
    .btn { display: inline-block; margin-top: 20px; padding: 12px 28px;
           background: #1a3c6e; color: #fff; text-decoration: none;
           border-radius: 4px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #1a3c6e; color: #fff; }
    tr:nth-child(even) { background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${SCHOOL_NAME}</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.<br/>
      <a href="mailto:${SCHOOL_EMAIL}">${SCHOOL_EMAIL}</a>
    </div>
  </div>
</body>
</html>`;

/** Templates registry */
const TEMPLATES = {
  /**
   * Results published email.
   * @param {{ studentName: string, examName: string, percentage: number, grade: string, loginUrl: string }} d
   */
  resultsPublished: (d) => wrap(`
    <h2>🎓 Exam Results Published</h2>
    <p>Dear <strong>${d.studentName}</strong>,</p>
    <p>Your results for <strong>${d.examName}</strong> have been published.</p>
    <table>
      <tr><th>Percentage</th><td>${d.percentage}%</td></tr>
      <tr><th>Grade</th><td>${d.grade}</td></tr>
    </table>
    <p>Log in to view your detailed result memo:</p>
    <a href="${d.loginUrl}" class="btn">View Results</a>
  `),

  /**
   * Account created email.
   * @param {{ name: string, role: string, email: string, tempPassword: string, loginUrl: string }} d
   */
  accountCreated: (d) => wrap(`
    <h2>Welcome to ${SCHOOL_NAME}!</h2>
    <p>Dear <strong>${d.name}</strong>,</p>
    <p>Your <strong>${d.role}</strong> account has been created.</p>
    <table>
      <tr><th>Email</th><td>${d.email}</td></tr>
      <tr><th>Temporary Password</th><td><code>${d.tempPassword}</code></td></tr>
    </table>
    <p>Please log in and change your password immediately.</p>
    <a href="${d.loginUrl}" class="btn">Login Now</a>
  `),

  /**
   * Password reset email.
   * @param {{ name: string, resetUrl: string, expiresIn: string }} d
   */
  passwordReset: (d) => wrap(`
    <h2>🔐 Password Reset Request</h2>
    <p>Dear <strong>${d.name}</strong>,</p>
    <p>We received a request to reset your password. Click the button below
       (expires in <strong>${d.expiresIn}</strong>):</p>
    <a href="${d.resetUrl}" class="btn">Reset Password</a>
    <p style="margin-top:16px;font-size:12px;color:#888;">
      If you did not request this, please ignore this email.
    </p>
  `),

  /**
   * Marks uploaded notification.
   * @param {{ teacherName: string, examName: string, subjectName: string, className: string }} d
   */
  marksUploaded: (d) => wrap(`
    <h2>📋 Marks Uploaded for Review</h2>
    <p>Dear Admin,</p>
    <p>Marks have been uploaded by <strong>${d.teacherName}</strong> and are pending review.</p>
    <table>
      <tr><th>Exam</th><td>${d.examName}</td></tr>
      <tr><th>Subject</th><td>${d.subjectName}</td></tr>
      <tr><th>Class</th><td>${d.className}</td></tr>
    </table>
    <p>Please log in to review and approve.</p>
  `),

  /** Generic fallback */
  generic: (d) => wrap(`<h2>${d.subject || 'Notification'}</h2><p>${d.message}</p>`),
};

/**
 * Get a compiled HTML email template.
 * @param {string} name - Template name.
 * @param {object} data - Template variables.
 * @returns {string} HTML string.
 */
const getTemplate = (name, data) => {
  const tpl = TEMPLATES[name];
  if (!tpl) {
    return TEMPLATES.generic(data);
  }
  return tpl(data);
};

module.exports = { getTemplate, TEMPLATES };

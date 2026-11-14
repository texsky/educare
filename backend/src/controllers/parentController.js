'use strict';
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const { asyncWrapper, AppError } = require('../middlewares/errorHandler');
const { sendSuccess, paginateMeta } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

/** GET /api/v1/parents/me */
const getMyParent = asyncWrapper(async (req, res) => {
  const parent = await Parent.findOne({ userId: req.user._id })
    .populate('userId', 'email')
    .populate({
      path: 'studentIds',
      select: 'firstName lastName admissionNo classId section rollNo isActive',
      populate: { path: 'classId', select: 'name section academicYear' },
    });
  if (!parent) throw new AppError('Parent profile not found.', 404);
  sendSuccess(res, 200, 'Parent profile fetched.', parent);
});

/** POST /api/v1/parents */
const createParent = asyncWrapper(async (req, res) => {
  const parent = await Parent.create(req.body);
  await logAudit({ userId: req.user._id, action: 'CREATE', entity: 'Parent',
    entityId: parent._id, newValue: parent, ip: req.ip });
  sendSuccess(res, 201, 'Parent created.', parent);
});

/** GET /api/v1/parents */
const getAllParents = asyncWrapper(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const filter = { isActive: { $ne: false } };
  if (req.query.search) {
    filter.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const [parents, total] = await Promise.all([
    Parent.find(filter)
      .populate('userId', 'email')
      .populate('studentIds', 'firstName lastName admissionNo')
      .skip(skip).limit(limit).sort({ firstName: 1 }),
    Parent.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Parents fetched.', parents, paginateMeta(total, page, limit));
});

/** GET /api/v1/parents/:id */
const getParent = asyncWrapper(async (req, res) => {
  const parent = await Parent.findById(req.params.id)
    .populate('userId', 'email isActive')
    .populate({
      path: 'studentIds',
      select: 'firstName lastName admissionNo classId section rollNo academicYear isActive',
      populate: { path: 'classId', select: 'name section academicYear' },
    });
  if (!parent) throw new AppError('Parent not found.', 404);
  sendSuccess(res, 200, 'Parent fetched.', parent);
});

/** PUT /api/v1/parents/:id */
const updateParent = asyncWrapper(async (req, res) => {
  const old = await Parent.findById(req.params.id);
  if (!old) throw new AppError('Parent not found.', 404);
  const parent = await Parent.findByIdAndUpdate(req.params.id, req.body,
    { new: true, runValidators: true });
  await logAudit({ userId: req.user._id, action: 'UPDATE', entity: 'Parent',
    entityId: parent._id, oldValue: old, newValue: parent, ip: req.ip });
  sendSuccess(res, 200, 'Parent updated.', parent);
});

/** DELETE /api/v1/parents/:id */
const deleteParent = asyncWrapper(async (req, res) => {
  const parent = await Parent.findById(req.params.id);
  if (!parent) throw new AppError('Parent not found.', 404);
  parent.isActive = false;
  await parent.save();
  await logAudit({ userId: req.user._id, action: 'DELETE', entity: 'Parent',
    entityId: parent._id, ip: req.ip });
  sendSuccess(res, 200, 'Parent deactivated.');
});

/** POST /api/v1/parents/:id/link-student */
const linkStudent = asyncWrapper(async (req, res) => {
  const { studentId } = req.body;
  const [parent, student] = await Promise.all([
    Parent.findById(req.params.id),
    Student.findById(studentId),
  ]);
  if (!parent) throw new AppError('Parent not found.', 404);
  if (!student) throw new AppError('Student not found.', 404);
  if (parent.studentIds.includes(studentId)) {
    throw new AppError('Student already linked to this parent.', 409);
  }
  parent.studentIds.push(studentId);
  student.parentId = parent._id;
  await Promise.all([parent.save(), student.save()]);
  sendSuccess(res, 200, 'Student linked to parent.', parent);
});

/** POST /api/v1/parents/:id/unlink-student */
const unlinkStudent = asyncWrapper(async (req, res) => {
  const { studentId } = req.body;
  const parent = await Parent.findById(req.params.id);
  if (!parent) throw new AppError('Parent not found.', 404);
  parent.studentIds = parent.studentIds.filter((id) => id.toString() !== studentId);
  await parent.save();
  await Student.findByIdAndUpdate(studentId, { $unset: { parentId: 1 } });
  sendSuccess(res, 200, 'Student unlinked from parent.', parent);
});

module.exports = {
  getMyParent,
  createParent,
  getAllParents,
  getParent,
  updateParent,
  deleteParent,
  linkStudent,
  unlinkStudent,
};

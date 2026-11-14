import * as yup from 'yup'

const phone = yup
  .string()
  .matches(/^[+]?[\d\s\-()]{7,15}$/, 'Invalid phone number')
  .nullable()

const email = yup
  .string()
  .email('Invalid email address')
  .required('Email is required')

const password = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .required('Password is required')

// Auth schemas
export const loginSchema = yup.object({
  email,
  password: yup.string().required('Password is required'),
})

export const forgotPasswordSchema = yup.object({ email })

export const resetPasswordSchema = yup.object({
  password,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
})

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: password,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm new password'),
})

// Student schema
export const studentSchema = yup.object({
  firstName:    yup.string().required('First name is required').min(2),
  lastName:     yup.string().required('Last name is required').min(2),
  dateOfBirth:  yup.string().required('Date of birth is required'),
  gender:       yup.string().required('Gender is required'),
  email:        yup.string().email('Invalid email').nullable(),
  phone:        phone,
  admissionNo:  yup.string().required('Admission number is required'),
  classId:      yup.string().required('Class is required'),
  rollNo:       yup.number().typeError('Must be a number').required('Roll number is required'),
  bloodGroup:   yup.string().nullable(),
  address:      yup.string().nullable(),
  parentId:     yup.string().nullable(),
})

// Teacher schema
export const teacherSchema = yup.object({
  firstName:    yup.string().required('First name is required'),
  lastName:     yup.string().required('Last name is required'),
  email,
  phone:        phone,
  employeeId:   yup.string().required('Employee ID is required'),
  qualifications: yup.string().nullable(),
  subjectIds:   yup.array().of(yup.string()).min(1, 'At least one subject required'),
})

// Parent schema
export const parentSchema = yup.object({
  firstName:  yup.string().required('First name is required'),
  lastName:   yup.string().required('Last name is required'),
  email,
  phone:      yup.string().required('Phone is required'),
  occupation: yup.string().nullable(),
  address:    yup.string().nullable(),
})

// Class schema
export const classSchema = yup.object({
  name:         yup.string().required('Class name is required'),
  section:      yup.string().required('Section is required'),
  academicYear: yup.string().required('Academic year is required'),
  teacherId:    yup.string().nullable(),
})

// Subject schema
export const subjectSchema = yup.object({
  name:          yup.string().required('Subject name is required'),
  code:          yup.string().required('Subject code is required'),
  classId:       yup.string().required('Class is required'),
  maxMarks:      yup.number().typeError('Must be a number').required('Max marks required').min(1),
  passingMarks:  yup.number().typeError('Must be a number').required('Passing marks required').min(1),
})

// Exam schema
export const examSchema = yup.object({
  name:         yup.string().required('Exam name is required'),
  type:         yup.string().required('Exam type is required'),
  classId:      yup.string().required('Class is required'),
  startDate:    yup.string().required('Start date is required'),
  endDate:      yup.string().required('End date is required'),
  academicYear: yup.string().required('Academic year is required'),
})

// Notification schema
export const notificationSchema = yup.object({
  type:     yup.string().required('Type is required'),
  subject:  yup.string().required('Subject is required'),
  message:  yup.string().required('Message is required').min(10),
  audience: yup.string().required('Audience is required'),
})

// Settings schema
export const settingsSchema = yup.object({
  schoolName:    yup.string().required('School name is required'),
  schoolEmail:   yup.string().email('Invalid email').nullable(),
  schoolPhone:   phone,
  schoolAddress: yup.string().nullable(),
  academicYear:  yup.string().required('Academic year is required'),
})

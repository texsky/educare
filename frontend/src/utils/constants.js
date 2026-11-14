export const ROLES = {
  ADMIN:   'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT:  'parent',
}

export const GRADE_SCALE = [
  { min: 90, max: 100, grade: 'A+', points: 4.0, label: 'Outstanding' },
  { min: 80, max: 89,  grade: 'A',  points: 3.7, label: 'Excellent' },
  { min: 70, max: 79,  grade: 'B+', points: 3.3, label: 'Very Good' },
  { min: 60, max: 69,  grade: 'B',  points: 3.0, label: 'Good' },
  { min: 50, max: 59,  grade: 'C',  points: 2.0, label: 'Average' },
  { min: 40, max: 49,  grade: 'D',  points: 1.0, label: 'Below Average' },
  { min: 0,  max: 39,  grade: 'F',  points: 0.0, label: 'Fail' },
]

export const STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SENT:     'sent',
  FAILED:   'failed',
  DRAFT:    'draft',
  PUBLISHED:'published',
}

export const EXAM_TYPES = [
  { value: 'unit',    label: 'Unit Test' },
  { value: 'midterm', label: 'Mid-Term' },
  { value: 'final',   label: 'Final Exam' },
  { value: 'mock',    label: 'Mock Exam' },
]

export const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
]

export const BLOOD_GROUP_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
].map(v => ({ value: v, label: v }))

export const NOTIFICATION_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'sms',   label: 'SMS' },
]

export const PAGE_SIZES = [10, 25, 50, 100]

export const ACADEMIC_YEARS = (() => {
  const year = new Date().getFullYear()
  return [
    `${year - 1}-${year}`,
    `${year}-${year + 1}`,
    `${year + 1}-${year + 2}`,
  ]
})()

export const SECTIONS = ['A', 'B', 'C', 'D', 'E']

export const TOKEN_KEY    = 'educare_token'
export const USER_KEY     = 'educare_user'
export const REFRESH_KEY  = 'educare_refresh'

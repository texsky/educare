import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { GRADE_SCALE } from './constants'

dayjs.extend(relativeTime)

// Date formatters
export const formatDate = (date, fmt = 'DD MMM YYYY') =>
  date ? dayjs(date).format(fmt) : '—'

export const formatDateTime = (date) =>
  date ? dayjs(date).format('DD MMM YYYY, HH:mm') : '—'

export const formatRelative = (date) =>
  date ? dayjs(date).fromNow() : '—'

export const formatDateInput = (date) =>
  date ? dayjs(date).format('YYYY-MM-DD') : ''

// Number formatters
export const formatNumber = (n, decimals = 0) =>
  n != null ? Number(n).toFixed(decimals) : '—'

export const formatPercent = (value, total) => {
  if (!total || total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export const formatCurrency = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n || 0)

// Grade formatters
export const getGrade = (percentage) => {
  const scale = GRADE_SCALE.find(
    (g) => percentage >= g.min && percentage <= g.max
  )
  return scale ? scale.grade : 'F'
}

export const getGradeLabel = (percentage) => {
  const scale = GRADE_SCALE.find(
    (g) => percentage >= g.min && percentage <= g.max
  )
  return scale ? scale.label : 'Fail'
}

export const getGradeColor = (grade) => {
  const colors = {
    'A+': 'text-green-700 bg-green-100',
    'A':  'text-green-600 bg-green-50',
    'B+': 'text-blue-700 bg-blue-100',
    'B':  'text-blue-600 bg-blue-50',
    'C':  'text-yellow-700 bg-yellow-100',
    'D':  'text-orange-700 bg-orange-100',
    'F':  'text-red-700 bg-red-100',
  }
  return colors[grade] || 'text-gray-700 bg-gray-100'
}

// Status formatters
export const getStatusColor = (status) => {
  const colors = {
    pending:   'text-yellow-700 bg-yellow-100',
    approved:  'text-green-700 bg-green-100',
    rejected:  'text-red-700 bg-red-100',
    published: 'text-blue-700 bg-blue-100',
    draft:     'text-gray-700 bg-gray-100',
    sent:      'text-green-700 bg-green-100',
    failed:    'text-red-700 bg-red-100',
    active:    'text-green-700 bg-green-100',
    inactive:  'text-gray-700 bg-gray-100',
  }
  return colors[status] || 'text-gray-700 bg-gray-100'
}

export const capitalise = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

// File size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// Initials from name
export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

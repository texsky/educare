import api from './axios'

export const getClassReport = (classId, params) =>
  api.get(`/reports/class/${classId}`, { params }).then((r) => r.data)

export const getStudentReport = (studentId, params) =>
  api.get(`/reports/student/${studentId}`, { params }).then((r) => r.data)

export const getExamReport = (examId) =>
  api.get(`/reports/exam/${examId}`).then((r) => r.data)

export const getOverallReport = (params) =>
  api.get('/reports/overall', { params }).then((r) => r.data)

export const downloadReport = (type, params) =>
  api.get(`/reports/download/${type}`, {
    params,
    responseType: 'blob',
  }).then((r) => r.data)

import api from './axios'

export const getMarks = (params) =>
  api.get('/marks', { params }).then((r) => r.data)

export const getMarksByExam = (examId, params) =>
  api.get(`/marks/exam/${examId}`, { params }).then((r) => r.data)

export const getMarksByStudent = (studentId, params) =>
  api.get(`/marks/student/${studentId}`, { params }).then((r) => r.data)

export const uploadMarksImage = (formData, onProgress) =>
  api.post('/marks/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  }).then((r) => r.data)

export const manualEntryMarks = (data) =>
  api.post('/marks/manual', data).then((r) => r.data)

export const updateMark = (id, data) =>
  api.put(`/marks/${id}`, data).then((r) => r.data)

export const reviewMark = (id, action, remarks) =>
  api.patch(`/marks/${id}/review`, {
    status: action === 'approve' ? 'approved' : 'rejected',
    remarks,
  }).then((r) => r.data)

export const getPendingMarks = (params) =>
  getMarks({ limit: 100, ...params, reviewStatus: 'pending' })

export const bulkUpdateMarks = (data) =>
  api.post('/marks/bulk', data).then((r) => r.data)

import api from './axios'

export const getExams = (params) =>
  api.get('/exams', { params: { limit: 100, ...params } }).then((r) => r.data)

export const getExam = (id) =>
  api.get(`/exams/${id}`).then((r) => r.data)

export const createExam = (data) =>
  api.post('/exams', data).then((r) => r.data)

export const updateExam = (id, data) =>
  api.put(`/exams/${id}`, data).then((r) => r.data)

export const deleteExam = (id) =>
  api.delete(`/exams/${id}`).then((r) => r.data)

export const publishExam = (id) =>
  api.post(`/exams/${id}/publish`).then((r) => r.data)

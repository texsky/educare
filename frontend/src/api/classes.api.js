import api from './axios'

export const getClasses = (params) =>
  api.get('/classes', { params }).then((r) => r.data)

export const getClass = (id) =>
  api.get(`/classes/${id}`).then((r) => r.data)

export const createClass = (data) =>
  api.post('/classes', data).then((r) => r.data)

export const updateClass = (id, data) =>
  api.put(`/classes/${id}`, data).then((r) => r.data)

export const deleteClass = (id) =>
  api.delete(`/classes/${id}`).then((r) => r.data)

export const addStudentToClass = (classId, studentId) =>
  api.post(`/classes/${classId}/students/${studentId}`).then((r) => r.data)

export const removeStudentFromClass = (classId, studentId) =>
  api.delete(`/classes/${classId}/students/${studentId}`).then((r) => r.data)

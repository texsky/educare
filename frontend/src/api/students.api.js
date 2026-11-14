import api from './axios'

export const getStudents = (params) =>
  api.get('/students', { params }).then((r) => r.data)

export const getStudent = (id) =>
  api.get(`/students/${id}`).then((r) => r.data)

export const createStudent = (data) =>
  api.post('/students', data).then((r) => r.data)

export const updateStudent = (id, data) =>
  api.put(`/students/${id}`, data).then((r) => r.data)

export const deleteStudent = (id) =>
  api.delete(`/students/${id}`).then((r) => r.data)

export const uploadStudentPhoto = (id, formData) =>
  api.post(`/students/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const getStudentsByClass = (classId, params) =>
  api.get(`/students/class/${classId}`, { params }).then((r) => r.data)

import api from './axios'

export const getSubjects = (params) =>
  api.get('/subjects', { params: { limit: 100, ...params } }).then((r) => r.data)

export const getSubject = (id) =>
  api.get(`/subjects/${id}`).then((r) => r.data)

export const createSubject = (data) =>
  api.post('/subjects', data).then((r) => r.data)

export const updateSubject = (id, data) =>
  api.put(`/subjects/${id}`, data).then((r) => r.data)

export const deleteSubject = (id) =>
  api.delete(`/subjects/${id}`).then((r) => r.data)

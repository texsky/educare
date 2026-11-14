import api from './axios'

export const getMyParent = () =>
  api.get('/parents/me').then((r) => r.data)

export const getParents = (params) =>
  api.get('/parents', { params }).then((r) => r.data)

export const getParent = (id) =>
  api.get(`/parents/${id}`).then((r) => r.data)

export const createParent = (data) =>
  api.post('/parents', data).then((r) => r.data)

export const updateParent = (id, data) =>
  api.put(`/parents/${id}`, data).then((r) => r.data)

export const deleteParent = (id) =>
  api.delete(`/parents/${id}`).then((r) => r.data)

export const linkStudent = (parentId, studentId) =>
  api.post(`/parents/${parentId}/students/${studentId}`).then((r) => r.data)

export const unlinkStudent = (parentId, studentId) =>
  api.delete(`/parents/${parentId}/students/${studentId}`).then((r) => r.data)

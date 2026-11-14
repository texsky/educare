import api from './axios'

export const getDashboardStats = () =>
  api.get('/admin/dashboard').then((r) => r.data)

export const getAuditLogs = (params) =>
  api.get('/admin/audit-logs', { params }).then((r) => r.data)

export const getSettings = () =>
  api.get('/admin/settings').then((r) => r.data)

export const updateSettings = (data) =>
  api.put('/admin/settings', data).then((r) => r.data)

export const uploadSchoolLogo = (formData) =>
  api.post('/admin/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const getUsers = (params) =>
  api.get('/admin/users', { params }).then((r) => r.data)

export const toggleUserStatus = (userId) =>
  api.patch(`/admin/users/${userId}/toggle`).then((r) => r.data)

export const resetUserPassword = (userId) =>
  api.post(`/admin/users/${userId}/reset-password`).then((r) => r.data)

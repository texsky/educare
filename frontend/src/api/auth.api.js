import api from './axios'

export const login = (data) =>
  api.post('/auth/login', data).then((r) => r.data)

export const logout = () =>
  api.post('/auth/logout').then((r) => r.data)

export const refreshToken = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken }).then((r) => r.data)

export const changePassword = (data) =>
  api.post('/auth/change-password', data).then((r) => r.data)

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token, password) =>
  api.post(`/auth/reset-password/${token}`, { password }).then((r) => r.data)

export const getProfile = () =>
  api.get('/auth/me').then((r) => r.data)

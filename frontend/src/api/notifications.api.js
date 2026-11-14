import api from './axios'

export const getNotifications = (params) =>
  api.get('/notifications', { params }).then((r) => r.data)

export const sendNotification = (data) =>
  api.post('/notifications/send', data).then((r) => r.data)

export const markAsRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data)

export const markAllAsRead = () =>
  api.patch('/notifications/read-all').then((r) => r.data)

export const getUnreadCount = () =>
  api.get('/notifications/unread-count').then((r) => r.data)

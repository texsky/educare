import api from './axios'

export const getMemos = (params) =>
  api.get('/memos', { params }).then((r) => r.data)

export const getMemo = (id) =>
  api.get(`/memos/${id}`).then((r) => r.data)

export const getMemoByStudent = (studentId, examId) =>
  api.get(`/memos/student/${studentId}`, { params: { examId } }).then((r) => r.data)

export const generateMemo = (data) =>
  api.post('/memos/generate', data).then((r) => r.data)

export const downloadMemo = (id) =>
  api.get(`/memos/${id}/download`, { responseType: 'blob' }).then((r) => r.data)

export const publishMemo = (id) =>
  api.post(`/memos/${id}/publish`).then((r) => r.data)

export const publishBulkMemos = (examId) =>
  api.post(`/memos/publish-bulk`, { examId }).then((r) => r.data)

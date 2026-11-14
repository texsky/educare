import axios from 'axios'
import toast from 'react-hot-toast'
import { TOKEN_KEY, REFRESH_KEY, USER_KEY } from '@/utils/constants'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 / token refresh without hard reload
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest?._retry) {
      // If the 401 is on login or refresh itself, don't loop or reload — just show toast
      if (originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh')) {
        const msg = error.response?.data?.message || 'Invalid email or password.'
        toast.error(msg, { id: 'auth-toast' })
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem(REFRESH_KEY)
      if (!refreshToken) {
        logout('Session expired. Please log in.')
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        const { token } = data.data
        localStorage.setItem(TOKEN_KEY, token)
        api.defaults.headers.common.Authorization = `Bearer ${token}`
        processQueue(null, token)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        logout('Session expired. Please log in again.')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

function logout(message = 'Session expired. Please log in again.') {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  if (message) {
    toast.error(message, { id: 'auth-toast' })
  }
}

export default api

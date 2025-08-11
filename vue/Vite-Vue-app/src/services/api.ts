// src/services/api.ts
import axios, { type AxiosInstance } from 'axios'
import { getCookie } from '@/utils/csrf'

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor for CSRF
api.interceptors.request.use((config) => {
  const csrftoken = getCookie('csrftoken') ?? ''
  if (config.headers) {
    config.headers['X-CSRFToken'] = csrftoken
  }
  return config
})

// Request interceptor for JWT access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for handling token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        try {
          // Try refreshing the access token
          const res = await axios.post('http://localhost:8000/api/auth/refresh/', {
            refresh: refreshToken,
          })

          const newAccess = res.data.access
          localStorage.setItem('access_token', newAccess)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh token invalid → logout
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        // No refresh token → logout
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

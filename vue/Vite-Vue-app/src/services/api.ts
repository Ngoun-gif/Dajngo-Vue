// src/services/api.ts
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { getCookie } from '@/utils/csrf'

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const csrftoken = getCookie('csrftoken') ?? ''
  if (config.headers) {
    config.headers['X-CSRFToken'] = csrftoken
  }
  return config
})

export default api

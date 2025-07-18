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

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api

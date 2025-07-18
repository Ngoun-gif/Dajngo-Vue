import api from './api' // axios instance with baseURL

export interface LoginResponse {
  access: string
  refresh: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('auth/login/', {
    username: email, // Django uses "username", even if it's an email
    password: password,
  })
  return response.data
}

export async function logout(refreshToken: string) {
  try {
    await api.post('auth/logout/', { refresh: refreshToken })
  } catch (error) {
    console.warn('Logout API call failed:', error)
  }
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}
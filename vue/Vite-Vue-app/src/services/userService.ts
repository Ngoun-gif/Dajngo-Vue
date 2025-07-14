import api from '@/services/api'


export interface User {
  id: number
  username: string
  email: string
  password : string
  is_staff : boolean
  is_active : boolean
}

// Fetch all users
export async function fetchUsers(): Promise<User[]> {
  const response = await api.get<User[]>('users/')
  return response.data
}

// Create a new user (exclude 'id' because it's assigned by the backend)
export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const response = await api.post<User>('users/', data)
  return response.data
}

// Update an existing user (partial fields, exclude 'id')
export async function updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User> {
  const response = await api.put<User>(`users/${id}/`, data)
  return response.data
}

// Delete a user by ID
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`users/${id}/`)
}



// src/services/categoryService.ts
import api from '@/services/api'

export interface Category {
  id: number
  name: string
}

// Fetch all categories
export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('categories/')
  return response.data
}

// Create a new category (omit 'id' since it's assigned by the backend)
export async function createCategories(data: Omit<Category, 'id'>): Promise<Category> {
  const response = await api.post<Category>('categories/', data)
  return response.data
}

// Update an existing category (partial, in case only some fields change)
export async function updateCategories(id: number, data: Partial<Omit<Category, 'id'>>): Promise<Category> {
  const response = await api.put<Category>(`categories/${id}/`, data)
  return response.data
}

// Delete a category by ID
export async function deleteCategories(id: number): Promise<void> {
  await api.delete(`categories/${id}/`)
}

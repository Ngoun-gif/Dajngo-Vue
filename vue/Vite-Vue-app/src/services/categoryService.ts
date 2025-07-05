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

// Create a new category
export async function createCategories(data: { name: string }): Promise<Category> {
  const response = await api.post<Category>('categories/', data)
  return response.data
}

// Update a category
export async function updateCategories(id: number, data: { name: string }): Promise<Category> {
  const response = await api.put<Category>(`categories/${id}/`, data)
  return response.data
}

// Delete a category
export async function deleteCategories(id: number): Promise<void> {
  await api.delete(`categories/${id}/`)
}

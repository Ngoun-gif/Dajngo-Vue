// src/services/subjectService.ts
import api from '@/services/api'

export interface Subject {
  id: number
  subject_name: string
  created_at?: string
  created_by?: number
  updated_at?: string
  updated_by?: number
}

// Fetch all subjects
export async function fetchSubjects(): Promise<Subject[]> {
  const response = await api.get<Subject[]>('subjects/')
  return response.data
}

// Create subject
export async function createSubject(data: { subject_name: string }): Promise<Subject> {
  const response = await api.post<Subject>('subjects/', data)
  return response.data
}

// Update subject
export async function updateSubject(id: number, data: { subject_name: string }): Promise<Subject> {
  const response = await api.put<Subject>(`subjects/${id}/`, data)
  return response.data
}

// Delete subject
export async function deleteSubject(id: number): Promise<void> {
  await api.delete(`subjects/${id}/`)
}

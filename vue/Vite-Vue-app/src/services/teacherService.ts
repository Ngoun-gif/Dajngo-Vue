// src/services/teacherService.ts
import api from '@/services/api'

export interface Teacher {
  id: number
  first_name: string
  last_name: string
  gender: 'M' | 'F' | 'O'
  date_of_birth: string // ISO format date
  salary: number
  photo?: string | null
  created_at?: string
  created_by?: number
  updated_at?: string
  updated_by?: number
  subject: number
  subject_details?: {
    id: number
    subject_name: string
  }
 
}

// Get all teachers (optionally with subject details)
export async function fetchTeachers(withSubject: boolean = false): Promise<Teacher[]> {
  const url = withSubject ? 'teachers/?expand=subject' : 'teachers/'
  const response = await api.get<Teacher[]>(url)
  return response.data
}

// Get one teacher (optionally with subject details)
export async function fetchTeacher(id: number, withSubject: boolean = false): Promise<Teacher> {
  const url = withSubject ? `teachers/${id}/?expand=subject` : `teachers/${id}/`
  const response = await api.get<Teacher>(url)
  return response.data
}

// Create teacher (using FormData)
export async function createTeacher(formData: FormData): Promise<Teacher> {
  const response = await api.post<Teacher>('teachers/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Update teacher (using FormData)
export async function updateTeacher(id: number, formData: FormData): Promise<Teacher> {
  const response = await api.put<Teacher>(`teachers/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Delete teacher
export async function deleteTeacher(id: number): Promise<void> {
  await api.delete(`teachers/${id}/`)
}

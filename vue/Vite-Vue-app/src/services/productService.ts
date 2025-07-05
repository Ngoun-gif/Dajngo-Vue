// src/services/productService.ts
import api from '@/services/api'

export interface Product {
  id: number
  name: string
  category: number  // category ID
  category_details?: {  // expanded category details when requested
    id: number
    name: string
  }
}

// Fetch all products (with optional category details)
export async function fetchProducts(withCategory: boolean = false): Promise<Product[]> {
  const url = withCategory ? 'products/?expand=category' : 'products/'
  const response = await api.get<Product[]>(url)
  return response.data
}

// Get single product with category details
export async function fetchProduct(id: number, withCategory: boolean = false): Promise<Product> {
  const url = withCategory ? `products/${id}/?expand=category` : `products/${id}/`
  const response = await api.get<Product>(url)
  return response.data
}

// Create a new product with category
export async function createProduct(data: { name: string; category: number }): Promise<Product> {
  const response = await api.post<Product>('products/', data)
  return response.data
}

// Update a product (including category change)
export async function updateProduct(
  id: number, 
  data: { name: string; category: number }
): Promise<Product> {
  const response = await api.put<Product>(`products/${id}/`, data)
  return response.data
}

// Delete a product
export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`products/${id}/`)
}
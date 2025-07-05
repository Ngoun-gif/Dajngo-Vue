// src/services/productService.ts
import api from '@/services/api'

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  image?: string | null; // Changed from File | null to string | null
  category: number;
  category_details?: {
    id: number;
    name: string;
  }
}

// Fetch all products (with optional category details)
export async function fetchProducts(withCategory: boolean = false): Promise<Product[]> {
  const url = withCategory ? 'products/?expand=category' : 'products/'
  const response = await api.get<Product[]>(url)
  return response.data
}

// Get single product with category details
export async function fetchProduct(id: number,  withCategory: boolean = false): Promise<Product> {
  const url = withCategory ? `products/${id}/?expand=category` : `products/${id}/`
  const response = await api.get<Product>(url)
  return response.data
}


// CREATE product with multipart/form-data
export async function createProduct(formData: FormData): Promise<Product> {
  const response = await api.post<Product>('products/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// UPDATE product with multipart/form-data
export async function updateProduct(id: number, formData: FormData): Promise<Product> {
  const response = await api.put<Product>(`products/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Delete a product
export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`products/${id}/`)
}
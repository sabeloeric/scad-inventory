import { apiRequest } from './client'

export interface Product {
  code: string
  description: string
}

export function listProducts(token: string, signal?: AbortSignal): Promise<Product[]> {
  return apiRequest<Product[]>('/products', { token, signal })
}

export function getProduct(code: string, token: string, signal?: AbortSignal): Promise<Product> {
  return apiRequest<Product>(`/products/${encodeURIComponent(code)}`, { token, signal })
}

export function createProduct(code: string, description: string, token: string): Promise<Product> {
  return apiRequest<Product>('/products', {
    method: 'POST',
    token,
    body: JSON.stringify({ code, description }),
  })
}

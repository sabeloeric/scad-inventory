import { apiRequest } from './client'

export interface Warehouse {
  code: string
  name: string
}

export function listWarehouses(token: string, signal?: AbortSignal): Promise<Warehouse[]> {
  return apiRequest<Warehouse[]>('/warehouses', { token, signal })
}

export function createWarehouse(code: string, name: string, token: string): Promise<Warehouse> {
  return apiRequest<Warehouse>('/warehouses', {
    method: 'POST',
    token,
    body: JSON.stringify({ code, name }),
  })
}

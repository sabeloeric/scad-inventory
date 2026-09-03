import { apiRequest } from './client'

export interface StockItem {
  productCode: string
  productDescription: string
  warehouseCode: string
  warehouseName: string
  quantity: number
}

export interface StockReceipt {
  productCode: string
  warehouseCode: string
  quantity: number
}

export interface StockFilters {
  productCode?: string
  warehouseCode?: string
}

export function listStock(
  token: string,
  filters: StockFilters = {},
  signal?: AbortSignal,
): Promise<StockItem[]> {
  const search = new URLSearchParams()
  if (filters.productCode) search.set('productCode', filters.productCode)
  if (filters.warehouseCode) search.set('warehouseCode', filters.warehouseCode)
  const query = search.size > 0 ? `?${search.toString()}` : ''

  return apiRequest<StockItem[]>(`/stock${query}`, { token, signal })
}

export function addStock(
  productCode: string,
  warehouseCode: string,
  quantity: number,
  token: string,
): Promise<StockReceipt> {
  return apiRequest<StockReceipt>('/stock', {
    method: 'POST',
    token,
    body: JSON.stringify({ productCode, warehouseCode, quantity }),
  })
}

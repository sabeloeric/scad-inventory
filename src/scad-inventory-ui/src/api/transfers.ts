import { apiRequest } from './client'

export interface TransferResponse {
  productCode: string
  quantityTransferred: number
  source: {
    warehouseCode: string
    remainingQuantity: number
  }
  destination: {
    warehouseCode: string
    quantity: number
  }
}

export function createTransfer(
  productCode: string,
  sourceWarehouseCode: string,
  destinationWarehouseCode: string,
  quantity: number,
  token: string,
): Promise<TransferResponse> {
  return apiRequest<TransferResponse>('/orders', {
    method: 'POST',
    token,
    body: JSON.stringify({
      productCode,
      sourceWarehouseCode,
      destinationWarehouseCode,
      quantity,
    }),
  })
}

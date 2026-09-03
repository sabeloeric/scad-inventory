import type { TransferResponse } from '../api/transfers'

export function TransferReceipt({ transfer }: { transfer: TransferResponse }) {
  return (
    <div className="receipt-card" aria-label="Transfer result">
      <div className="receipt-product">
        <span className="eyebrow">Product</span>
        <strong>{transfer.productCode}</strong>
        <span>{transfer.quantityTransferred.toLocaleString()} units moved</span>
      </div>
      <div className="transfer-route" aria-label={`${transfer.source.warehouseCode} to ${transfer.destination.warehouseCode}`}>
        <div className="route-stop">
          <span>From</span>
          <strong>{transfer.source.warehouseCode}</strong>
          <small>{transfer.source.remainingQuantity.toLocaleString()} remaining</small>
        </div>
        <div className="route-arrow" aria-hidden="true">→</div>
        <div className="route-stop route-stop-destination">
          <span>To</span>
          <strong>{transfer.destination.warehouseCode}</strong>
          <small>{transfer.destination.quantity.toLocaleString()} on hand</small>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import type { StockItem } from '../api/stock'

export function StockTable({ items, compact = false }: { items: StockItem[]; compact?: boolean }) {
  return (
    <div className={`table-card${compact ? ' table-compact' : ''}`}>
      <table>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Description</th>
            <th scope="col">Warehouse</th>
            <th scope="col" className="quantity-cell">On hand</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.productCode}-${item.warehouseCode}`}>
              <td data-label="Product">
                <Link className="code-link" to={`/products/${encodeURIComponent(item.productCode)}`}>
                  {item.productCode}
                </Link>
              </td>
              <td data-label="Description">{item.productDescription}</td>
              <td data-label="Warehouse">
                <span className="warehouse-code">{item.warehouseCode}</span>
              </td>
              <td data-label="On hand" className="quantity-cell">
                <strong className="quantity-value">{item.quantity.toLocaleString()}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

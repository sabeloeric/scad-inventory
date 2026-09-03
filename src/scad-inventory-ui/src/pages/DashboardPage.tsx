import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { listProducts, type Product } from '../api/products'
import { listStock, type StockItem } from '../api/stock'
import { listWarehouses, type Warehouse } from '../api/warehouses'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { StockTable } from '../components/StockTable'
import { useAuth } from '../auth/AuthContext'

interface DashboardData {
  products: Product[]
  warehouses: Warehouse[]
  stock: StockItem[]
}

export function DashboardPage() {
  const { session, signOut } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      listProducts(session!.accessToken, controller.signal),
      listWarehouses(session!.accessToken, controller.signal),
      listStock(session!.accessToken, {}, controller.signal),
    ])
      .then(([products, warehouses, stock]) => setData({ products, warehouses, stock }))
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          signOut()
          return
        }
        setError(requestError instanceof Error ? requestError.message : 'Dashboard data could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reload, session, signOut])

  function retry() {
    setLoading(true)
    setError(null)
    setReload((value) => value + 1)
  }

  const totalUnits = data?.stock.reduce((total, item) => total + item.quantity, 0) ?? 0

  return (
    <section aria-labelledby="dashboard-title">
      <PageHeader
        headingId="dashboard-title"
        eyebrow={`${session?.user.warehouseCode} workspace`}
        title="Warehouse overview"
        description="A live operational snapshot built from the inventory records you are authorized to see."
        actions={(
          <>
            <Link className="button button-secondary" to="/inventory/new">Receive stock</Link>
            <Link className="button" to="/transfers/new">New transfer</Link>
          </>
        )}
      />

      {loading && <LoadingState label="Preparing your warehouse overview…" />}
      {!loading && error && <ErrorState message={error} onRetry={retry} />}

      {!loading && !error && data && (
        <>
          <div className="stat-grid" aria-label="Warehouse summary">
            <StatCard label="Products" value={data.products.length} detail="Shared catalogue items" />
            <StatCard label="Stock positions" value={data.stock.length} detail={`Visible at ${session?.user.warehouseCode}`} />
            <StatCard label="Units on hand" value={totalUnits.toLocaleString()} detail="Across visible positions" />
            <StatCard label="Warehouses" value={data.warehouses.length} detail="Available transfer locations" />
          </div>

          <section className="panel panel-wide" aria-labelledby="inventory-snapshot-title">
            <div className="panel-heading">
              <h2 id="inventory-snapshot-title">Current stock</h2>
              <Link className="text-link" to="/inventory">View all inventory</Link>
            </div>
            {data.stock.length > 0 ? (
              <StockTable items={data.stock.slice(0, 5)} compact />
            ) : (
              <div className="panel-empty">
                <p>No stock has been received for this warehouse yet.</p>
                <Link className="text-link" to="/inventory/new">Receive the first stock</Link>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}

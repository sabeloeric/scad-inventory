import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { listStock, type StockItem } from '../api/stock'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState'
import { PageHeader } from '../components/PageHeader'
import { StockTable } from '../components/StockTable'

export function InventoryPage() {
  const { session, signOut } = useAuth()
  const [stock, setStock] = useState<StockItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listStock(session!.accessToken, {}, controller.signal)
      .then(setStock)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          signOut()
          return
        }
        setError(requestError instanceof Error ? requestError.message : 'Inventory could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reload, session, signOut])

  const filteredStock = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return stock
    return stock.filter((item) => (
      item.productCode.toLowerCase().includes(normalizedQuery)
      || item.productDescription.toLowerCase().includes(normalizedQuery)
    ))
  }, [query, stock])

  function retry() {
    setLoading(true)
    setError(null)
    setReload((value) => value + 1)
  }

  return (
    <section aria-labelledby="inventory-title">
      <PageHeader
        headingId="inventory-title"
        eyebrow={`${session?.user.warehouseCode} warehouse`}
        title="Inventory"
        description="Stock visibility is enforced by the API for your linked warehouse."
        actions={(
          <>
            <Link className="button button-secondary" to="/transfers/new">Transfer stock</Link>
            <Link className="button" to="/inventory/new">Receive stock</Link>
          </>
        )}
      />

      {loading && <LoadingState label="Loading current inventory…" />}
      {!loading && error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && stock.length === 0 && (
        <EmptyState
          title="No stock positions yet"
          message="Receive initial stock to begin tracking a product at this warehouse."
          actionLabel="Receive stock"
          actionTo="/inventory/new"
        />
      )}

      {!loading && !error && stock.length > 0 && (
        <>
          <div className="toolbar">
            <label className="search-field">
              <span className="visually-hidden">Search inventory</span>
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search by product code or description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <span className="result-count">{filteredStock.length} of {stock.length} positions</span>
          </div>

          {filteredStock.length > 0 ? (
            <StockTable items={filteredStock} />
          ) : (
            <EmptyState title="No matching stock" message={`No inventory matches “${query.trim()}”.`} />
          )}
        </>
      )}
    </section>
  )
}

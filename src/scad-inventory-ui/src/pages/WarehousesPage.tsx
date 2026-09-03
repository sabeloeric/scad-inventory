import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { listWarehouses, type Warehouse } from '../api/warehouses'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState'
import { PageHeader } from '../components/PageHeader'

export function WarehousesPage() {
  const { session, signOut } = useAuth()
  const location = useLocation()
  const createdCode = (location.state as { createdCode?: string } | null)?.createdCode
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listWarehouses(session!.accessToken, controller.signal)
      .then(setWarehouses)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          signOut()
          return
        }
        setError(requestError instanceof Error ? requestError.message : 'Warehouses could not be loaded.')
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

  return (
    <section aria-labelledby="warehouses-title">
      <PageHeader
        headingId="warehouses-title"
        eyebrow="Network"
        title="Warehouses"
        description="Locations available for receiving and transferring inventory."
        actions={<Link className="button" to="/warehouses/new">Create warehouse</Link>}
      />

      {createdCode && (
        <div className="alert alert-success" role="status">
          Warehouse <strong>{createdCode}</strong> was created successfully.
        </div>
      )}
      {loading && <LoadingState label="Loading warehouse network…" />}
      {!loading && error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && warehouses.length === 0 && (
        <EmptyState
          title="No warehouses yet"
          message="Create the first location to begin managing inventory."
          actionLabel="Create warehouse"
          actionTo="/warehouses/new"
        />
      )}

      {!loading && !error && warehouses.length > 0 && (
        <div className="warehouse-grid">
          {warehouses.map((warehouse) => {
            const isCurrent = warehouse.code === session?.user.warehouseCode
            return (
              <article className={`warehouse-card${isCurrent ? ' warehouse-card-current' : ''}`} key={warehouse.code}>
                <div className="warehouse-card-topline">
                  <span className="warehouse-monogram" aria-hidden="true">{warehouse.code.slice(0, 2)}</span>
                  {isCurrent && <span className="status-badge">Current workspace</span>}
                </div>
                <div>
                  <span className="eyebrow">{warehouse.code}</span>
                  <h2>{warehouse.name}</h2>
                </div>
                <Link className="text-link" to={`/transfers/new?destination=${encodeURIComponent(warehouse.code)}`}>
                  Transfer to this location
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

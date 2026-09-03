import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { getProduct, type Product } from '../api/products'
import { listStock, type StockItem } from '../api/stock'
import { useAuth } from '../auth/AuthContext'
import { ErrorState, LoadingState } from '../components/AsyncState'

export function ProductDetailPage() {
  const { code = '' } = useParams()
  const location = useLocation()
  const { session, signOut } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [stock, setStock] = useState<StockItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const created = Boolean((location.state as { created?: boolean } | null)?.created)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getProduct(code, session!.accessToken, controller.signal),
      listStock(session!.accessToken, { productCode: code }, controller.signal),
    ])
      .then(([productResponse, stockResponse]) => {
        setProduct(productResponse)
        setStock(stockResponse[0] ?? null)
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return

        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          signOut()
          return
        }

        if (requestError instanceof ApiRequestError && requestError.status === 404) {
          setError(`Product '${code.toUpperCase()}' was not found.`)
          return
        }

        setError(requestError instanceof Error ? requestError.message : 'The product could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [code, reload, session, signOut])

  function retry() {
    setLoading(true)
    setError(null)
    setReload((value) => value + 1)
  }

  return (
    <section className="detail-page" aria-labelledby="product-title">
      <Link className="back-link" to="/products">← Back to products</Link>

      {created && <div className="alert alert-success" role="status">Product created successfully.</div>}
      {loading && <LoadingState label="Loading product details…" />}

      {!loading && error && <ErrorState message={error} onRetry={retry} />}

      {!loading && !error && product && (
        <>
          <article className="detail-card product-hero">
            <div>
              <h1 id="product-title">{product.code}</h1>
              <p className="product-description">{product.description}</p>
            </div>
            <div className="product-actions">
              <Link className="button" to={`/inventory/new?product=${encodeURIComponent(product.code)}`}>Receive stock</Link>
              <Link className="button button-secondary" to={`/transfers/new?product=${encodeURIComponent(product.code)}`}>Transfer</Link>
            </div>
          </article>

          <div className="detail-grid">
            <section className="panel" aria-labelledby="stock-summary-title">
              <div className="panel-heading">
                <h2 id="stock-summary-title">Stock at {session?.user.warehouseCode}</h2>
              </div>
              {stock ? (
                <div className="stock-summary">
                  <strong>{stock.quantity.toLocaleString()}</strong>
                  <span>units on hand</span>
                </div>
              ) : (
                <div className="panel-empty">
                  <p>No stock position exists at your warehouse.</p>
                  <Link className="text-link" to={`/inventory/new?product=${encodeURIComponent(product.code)}`}>Receive stock</Link>
                </div>
              )}
            </section>
            <section className="panel" aria-labelledby="product-information-title">
              <div className="panel-heading">
                <h2 id="product-information-title">Product information</h2>
              </div>
              <dl className="compact-list">
                <div><dt>Code</dt><dd>{product.code}</dd></div>
                <div><dt>Description</dt><dd>{product.description}</dd></div>
                <div><dt>Visibility</dt><dd>Shared catalogue</dd></div>
              </dl>
            </section>
          </div>
        </>
      )}
    </section>
  )
}

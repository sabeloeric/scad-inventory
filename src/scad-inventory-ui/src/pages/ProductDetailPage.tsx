import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { getProduct, type Product } from '../api/products'
import { useAuth } from '../auth/AuthContext'

export function ProductDetailPage() {
  const { code = '' } = useParams()
  const location = useLocation()
  const { session, signOut } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const created = Boolean((location.state as { created?: boolean } | null)?.created)

  useEffect(() => {
    const controller = new AbortController()

    getProduct(code, session!.accessToken, controller.signal)
      .then(setProduct)
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
      {loading && <div className="state-card" role="status">Loading product…</div>}

      {!loading && error && (
        <div className="state-card state-error" role="alert">
          <p>{error}</p>
          <button className="button button-secondary" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && product && (
        <article className="detail-card">
          <div className="eyebrow">Product detail</div>
          <h1 id="product-title">{product.code}</h1>
          <dl>
            <div><dt>Code</dt><dd>{product.code}</dd></div>
            <div><dt>Description</dt><dd>{product.description}</dd></div>
          </dl>
        </article>
      )}
    </section>
  )
}

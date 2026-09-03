import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { listProducts, type Product } from '../api/products'
import { useAuth } from '../auth/AuthContext'

export function ProductsPage() {
  const { session, signOut } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listProducts(session!.accessToken, controller.signal)
      .then(setProducts)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return

        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          signOut()
          return
        }

        setError(requestError instanceof Error ? requestError.message : 'Products could not be loaded.')
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
    <section aria-labelledby="products-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Catalogue</div>
          <h1 id="products-title">Products</h1>
          <p className="muted">Products are shared across warehouses; stock visibility remains warehouse-scoped.</p>
        </div>
        <Link className="button" to="/products/new">Create product</Link>
      </div>

      {loading && <div className="state-card" role="status">Loading products…</div>}

      {!loading && error && (
        <div className="state-card state-error" role="alert">
          <p>{error}</p>
          <button className="button button-secondary" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="state-card">
          <h2>No products yet</h2>
          <p>Create the first product to start tracking inventory.</p>
          <Link className="text-link" to="/products/new">Create a product</Link>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Description</th>
                <th scope="col"><span className="visually-hidden">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.code}>
                  <td><strong>{product.code}</strong></td>
                  <td>{product.description}</td>
                  <td className="table-action">
                    <Link className="text-link" to={`/products/${encodeURIComponent(product.code)}`}>
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

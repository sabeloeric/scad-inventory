import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { listProducts, type Product } from '../api/products'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState'
import { PageHeader } from '../components/PageHeader'

export function ProductsPage() {
  const { session, signOut } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return products
    return products.filter((product) => (
      product.code.toLowerCase().includes(normalizedQuery)
      || product.description.toLowerCase().includes(normalizedQuery)
    ))
  }, [products, query])

  return (
    <section aria-labelledby="products-title">
      <PageHeader
        headingId="products-title"
        eyebrow="Catalogue"
        title="Products"
        description="Products are shared across warehouses; stock visibility remains warehouse-scoped."
        actions={<Link className="button" to="/products/new">Create product</Link>}
      />

      {loading && <LoadingState label="Loading product catalogue…" />}

      {!loading && error && <ErrorState message={error} onRetry={retry} />}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          title="No products yet"
          message="Create the first product to start tracking inventory."
          actionLabel="Create a product"
          actionTo="/products/new"
        />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="toolbar">
            <label className="search-field">
              <span className="visually-hidden">Search products</span>
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search by code or description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <span className="result-count">{filteredProducts.length} of {products.length} products</span>
          </div>

          {filteredProducts.length > 0 ? (
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
                  {filteredProducts.map((product) => (
                    <tr key={product.code}>
                      <td data-label="Code"><span className="product-code">{product.code}</span></td>
                      <td data-label="Description">{product.description}</td>
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
          ) : (
            <EmptyState title="No matching products" message={`No products match “${query.trim()}”.`} />
          )}
        </>
      )}
    </section>
  )
}

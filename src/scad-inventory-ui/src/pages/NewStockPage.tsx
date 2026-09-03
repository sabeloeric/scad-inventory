import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { listProducts, type Product } from '../api/products'
import { addStock, type StockReceipt } from '../api/stock'
import { listWarehouses, type Warehouse } from '../api/warehouses'
import { useAuth } from '../auth/AuthContext'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageHeader } from '../components/PageHeader'

export function NewStockPage() {
  const { session, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [productCode, setProductCode] = useState(searchParams.get('product') ?? '')
  const [warehouseCode, setWarehouseCode] = useState(session!.user.warehouseCode)
  const [quantity, setQuantity] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<StockReceipt | null>(null)
  const [addedQuantity, setAddedQuantity] = useState(0)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      listProducts(session!.accessToken, controller.signal),
      listWarehouses(session!.accessToken, controller.signal),
    ])
      .then(([productOptions, warehouseOptions]) => {
        setProducts(productOptions)
        setWarehouses(warehouseOptions)
        setProductCode((current) => current || productOptions[0]?.code || '')
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          signOut()
          return
        }
        setOptionsError(requestError instanceof Error ? requestError.message : 'Form options could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOptions(false)
      })

    return () => controller.abort()
  }, [reload, session, signOut])

  function retryOptions() {
    setLoadingOptions(true)
    setOptionsError(null)
    setReload((value) => value + 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string[]> = {}
    const parsedQuantity = Number(quantity)

    if (!productCode) nextErrors.productCode = ['Product is required.']
    if (!warehouseCode) nextErrors.warehouseCode = ['Warehouse is required.']
    if (!quantity.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      nextErrors.quantity = ['Quantity must be a whole number greater than zero.']
    }

    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      setReceipt(await addStock(productCode, warehouseCode, parsedQuantity, session!.accessToken))
      setAddedQuantity(parsedQuantity)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          signOut()
          return
        }
        setErrors(error.fieldErrors)
        setFormError(error.message)
      } else {
        setFormError('The API could not be reached. Check that it is running and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function receiveAnother() {
    setReceipt(null)
    setQuantity('')
    setErrors({})
    setFormError(null)
  }

  if (receipt) {
    return (
      <section className="form-page" aria-labelledby="stock-received-title">
        <div className="completion-card">
          <div className="completion-mark" aria-hidden="true">✓</div>
          <div className="eyebrow">Inventory updated</div>
          <h1 id="stock-received-title">Stock received</h1>
          <p className="muted">{addedQuantity.toLocaleString()} units were added.</p>
          <dl className="receipt-list">
            <div><dt>Product</dt><dd>{receipt.productCode}</dd></div>
            <div><dt>Warehouse</dt><dd>{receipt.warehouseCode}</dd></div>
            <div><dt>New total</dt><dd>{receipt.quantity.toLocaleString()} units</dd></div>
          </dl>
          <div className="form-actions">
            <button className="button" type="button" onClick={receiveAnother}>Receive another</button>
            <Link className="button button-secondary" to="/inventory">View inventory</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="form-page" aria-labelledby="receive-stock-title">
      <PageHeader
        headingId="receive-stock-title"
        eyebrow="Inventory operation"
        title="Receive stock"
        description="Add units to a product's quantity at a warehouse. Works whether or not stock already exists there."
      />

      {loadingOptions && <LoadingState label="Preparing stock form…" />}
      {!loadingOptions && optionsError && <ErrorState message={optionsError} onRetry={retryOptions} />}

      {!loadingOptions && !optionsError && (products.length === 0 || warehouses.length === 0) && (
        <div className="state-card state-error" role="alert">
          <h2>Setup required</h2>
          <p>Create at least one product and warehouse before receiving stock.</p>
          <div className="form-actions">
            {products.length === 0 && <Link className="button" to="/products/new">Create product</Link>}
            {warehouses.length === 0 && <Link className="button button-secondary" to="/warehouses/new">Create warehouse</Link>}
          </div>
        </div>
      )}

      {!loadingOptions && !optionsError && products.length > 0 && warehouses.length > 0 && (
        <form className="form-card form-stack" onSubmit={handleSubmit} noValidate>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}

          <div className="field">
            <label htmlFor="stock-product">Product</label>
            <select
              id="stock-product"
              value={productCode}
              onChange={(event) => setProductCode(event.target.value)}
              aria-invalid={Boolean(errors.productCode)}
            >
              {products.map((product) => (
                <option value={product.code} key={product.code}>{product.code} — {product.description}</option>
              ))}
            </select>
            {errors.productCode && <span className="field-error">{errors.productCode[0]}</span>}
          </div>

          <div className="field">
            <label htmlFor="stock-warehouse">Warehouse</label>
            <select
              id="stock-warehouse"
              value={warehouseCode}
              onChange={(event) => setWarehouseCode(event.target.value)}
              aria-invalid={Boolean(errors.warehouseCode)}
            >
              {warehouses.map((warehouse) => (
                <option value={warehouse.code} key={warehouse.code}>
                  {warehouse.code} — {warehouse.name}{warehouse.code === session?.user.warehouseCode ? ' (current)' : ''}
                </option>
              ))}
            </select>
            {errors.warehouseCode && <span className="field-error">{errors.warehouseCode[0]}</span>}
          </div>

          <div className="field">
            <label htmlFor="stock-quantity">Quantity</label>
            <div className="input-suffix">
              <input
                id="stock-quantity"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                aria-invalid={Boolean(errors.quantity)}
              />
              <span>units</span>
            </div>
            {errors.quantity && <span className="field-error">{errors.quantity[0]}</span>}
          </div>

          <div className="form-actions">
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Receiving…' : 'Receive stock'}
            </button>
            <Link className="button button-secondary" to="/inventory">Cancel</Link>
          </div>
        </form>
      )}
    </section>
  )
}

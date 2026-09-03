import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { listProducts, type Product } from '../api/products'
import { createTransfer, type TransferResponse } from '../api/transfers'
import { listWarehouses, type Warehouse } from '../api/warehouses'
import { useAuth } from '../auth/AuthContext'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageHeader } from '../components/PageHeader'
import { TransferReceipt } from '../components/TransferReceipt'

export function NewTransferPage() {
  const { session, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const requestedProduct = searchParams.get('product') ?? ''
  const requestedDestination = searchParams.get('destination') ?? ''
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [productCode, setProductCode] = useState(requestedProduct)
  const [sourceCode, setSourceCode] = useState(session!.user.warehouseCode)
  const [destinationCode, setDestinationCode] = useState(requestedDestination)
  const [quantity, setQuantity] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<TransferResponse | null>(null)
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
        setDestinationCode((current) => {
          if (current && current !== session!.user.warehouseCode && warehouseOptions.some((item) => item.code === current)) {
            return current
          }
          return warehouseOptions.find((item) => item.code !== session!.user.warehouseCode)?.code ?? ''
        })
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          signOut()
          return
        }
        setOptionsError(requestError instanceof Error ? requestError.message : 'Transfer options could not be loaded.')
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

  function changeSource(nextSource: string) {
    setSourceCode(nextSource)
    if (destinationCode === nextSource) {
      setDestinationCode(warehouses.find((warehouse) => warehouse.code !== nextSource)?.code ?? '')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string[]> = {}
    const parsedQuantity = Number(quantity)

    if (!productCode) nextErrors.productCode = ['Product is required.']
    if (!sourceCode) nextErrors.sourceWarehouseCode = ['Source warehouse is required.']
    if (!destinationCode) nextErrors.destinationWarehouseCode = ['Destination warehouse is required.']
    if (sourceCode && sourceCode === destinationCode) {
      nextErrors.destinationWarehouseCode = ['Destination must be different from the source.']
    }
    if (!quantity.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      nextErrors.quantity = ['Quantity must be a whole number greater than zero.']
    }

    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      setResult(await createTransfer(
        productCode,
        sourceCode,
        destinationCode,
        parsedQuantity,
        session!.accessToken,
      ))
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

  function startAnotherTransfer() {
    setResult(null)
    setQuantity('')
    setErrors({})
    setFormError(null)
  }

  if (result) {
    return (
      <section className="form-page" aria-labelledby="transfer-complete-title">
        <div className="completion-card completion-card-wide">
          <div className="completion-mark" aria-hidden="true">✓</div>
          <div className="eyebrow">Inventory moved</div>
          <h1 id="transfer-complete-title">Transfer complete</h1>
          <p className="muted">Both warehouse quantities were updated in one database transaction.</p>
          <TransferReceipt transfer={result} />
          <div className="form-actions">
            <button className="button" type="button" onClick={startAnotherTransfer}>Create another transfer</button>
            <Link className="button button-secondary" to="/inventory">View inventory</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="form-page" aria-labelledby="transfer-title">
      <PageHeader
        headingId="transfer-title"
        eyebrow="Inventory operation"
        title="Transfer stock"
        description="Move inventory between warehouses with an atomic, concurrency-safe transaction."
      />

      {loadingOptions && <LoadingState label="Preparing transfer form…" />}
      {!loadingOptions && optionsError && <ErrorState message={optionsError} onRetry={retryOptions} />}
      {!loadingOptions && !optionsError && (products.length === 0 || warehouses.length < 2) && (
        <div className="state-card state-error" role="alert">
          <h2>Transfer setup required</h2>
          <p>At least one product and two warehouses are required before stock can be transferred.</p>
          <div className="form-actions">
            {products.length === 0 && <Link className="button" to="/products/new">Create product</Link>}
            {warehouses.length < 2 && <Link className="button button-secondary" to="/warehouses/new">Create warehouse</Link>}
          </div>
        </div>
      )}

      {!loadingOptions && !optionsError && products.length > 0 && warehouses.length >= 2 && (
        <form className="form-card form-stack" onSubmit={handleSubmit} noValidate>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}
          <div className="field">
            <label htmlFor="transfer-product">Product</label>
            <select
              id="transfer-product"
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

          <div className="form-row">
            <div className="field">
              <label htmlFor="source-warehouse">Source warehouse</label>
              <select
                id="source-warehouse"
                value={sourceCode}
                onChange={(event) => changeSource(event.target.value)}
                aria-invalid={Boolean(errors.sourceWarehouseCode)}
              >
                {warehouses.map((warehouse) => (
                  <option value={warehouse.code} key={warehouse.code}>
                    {warehouse.code}{warehouse.code === session?.user.warehouseCode ? ' (current)' : ''}
                  </option>
                ))}
              </select>
              {errors.sourceWarehouseCode && <span className="field-error">{errors.sourceWarehouseCode[0]}</span>}
            </div>

            <div className="field">
              <label htmlFor="destination-warehouse">Destination warehouse</label>
              <select
                id="destination-warehouse"
                value={destinationCode}
                onChange={(event) => setDestinationCode(event.target.value)}
                aria-invalid={Boolean(errors.destinationWarehouseCode)}
              >
                {warehouses.filter((warehouse) => warehouse.code !== sourceCode).map((warehouse) => (
                  <option value={warehouse.code} key={warehouse.code}>{warehouse.code} — {warehouse.name}</option>
                ))}
              </select>
              {errors.destinationWarehouseCode && <span className="field-error">{errors.destinationWarehouseCode[0]}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="transfer-quantity">Quantity to transfer</label>
            <div className="input-suffix">
              <input
                id="transfer-quantity"
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
              {submitting ? 'Transferring…' : 'Transfer stock'}
            </button>
            <Link className="button button-secondary" to="/inventory">Cancel</Link>
          </div>
        </form>
      )}
    </section>
  )
}

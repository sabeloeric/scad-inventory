import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { createProduct } from '../api/products'
import { useAuth } from '../auth/AuthContext'

export function NewProductPage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string[]> = {}

    if (!code.trim()) nextErrors.code = ['Code is required.']
    if (!description.trim()) nextErrors.description = ['Description is required.']

    setErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)

    try {
      const product = await createProduct(code, description, session!.accessToken)
      navigate(`/products/${encodeURIComponent(product.code)}`, { state: { created: true } })
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          signOut()
          return
        }

        const fieldErrors = { ...error.fieldErrors }
        if (error.code === 'DUPLICATE_PRODUCT_CODE') fieldErrors.code = [error.message]
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length === 0) setFormError(error.message)
      } else {
        setFormError('The API could not be reached. Check that it is running and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="form-page" aria-labelledby="new-product-title">
      <Link className="back-link" to="/products">← Back to products</Link>
      <div className="form-card">
        <div className="eyebrow">Catalogue</div>
        <h1 id="new-product-title">Create product</h1>
        <p className="muted">Codes are trimmed and normalized to uppercase by the API.</p>

        {formError && <div className="alert alert-error" role="alert">{formError}</div>}

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="code">Product code</label>
            <input
              id="code"
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? 'code-error' : 'code-help'}
            />
            <span id="code-help" className="field-help">Use the business code; no restrictive format is imposed.</span>
            {errors.code && <span id="code-error" className="field-error">{errors.code[0]}</span>}
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && (
              <span id="description-error" className="field-error">{errors.description[0]}</span>
            )}
          </div>

          <div className="form-actions">
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create product'}
            </button>
            <Link className="button button-secondary" to="/products">Cancel</Link>
          </div>
        </form>
      </div>
    </section>
  )
}

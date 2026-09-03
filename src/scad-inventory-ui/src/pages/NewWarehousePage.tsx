import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { createWarehouse } from '../api/warehouses'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/PageHeader'

export function NewWarehousePage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string[]> = {}
    if (!code.trim()) nextErrors.code = ['Warehouse code is required.']
    if (!name.trim()) nextErrors.name = ['Warehouse name is required.']

    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const warehouse = await createWarehouse(code, name, session!.accessToken)
      navigate('/warehouses', { state: { createdCode: warehouse.code } })
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.status === 401) {
          signOut()
          return
        }
        const fieldErrors = { ...error.fieldErrors }
        if (error.code === 'DUPLICATE_WAREHOUSE_CODE') fieldErrors.code = [error.message]
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
    <section className="form-page" aria-labelledby="new-warehouse-title">
      <PageHeader
        headingId="new-warehouse-title"
        eyebrow="Network"
        title="Create warehouse"
        description="Add a location that can receive and transfer stock."
      />
      <form className="form-card form-stack" onSubmit={handleSubmit} noValidate>
        {formError && <div className="alert alert-error" role="alert">{formError}</div>}
        <div className="field">
          <label htmlFor="warehouse-code">Warehouse code</label>
          <input
            id="warehouse-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? 'warehouse-code-error' : 'warehouse-code-help'}
          />
          <span id="warehouse-code-help" className="field-help">Codes are normalized to uppercase.</span>
          {errors.code && <span id="warehouse-code-error" className="field-error">{errors.code[0]}</span>}
        </div>
        <div className="field">
          <label htmlFor="warehouse-name">Warehouse name</label>
          <input
            id="warehouse-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className="field-error">{errors.name[0]}</span>}
        </div>
        <div className="form-actions">
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create warehouse'}
          </button>
          <Link className="button button-secondary" to="/warehouses">Cancel</Link>
        </div>
      </form>
    </section>
  )
}

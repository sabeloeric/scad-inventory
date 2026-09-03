import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { ApiRequestError } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { session, saveSession } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string[]> = {}

    if (!username.trim()) nextErrors.username = ['Username is required.']
    if (!password.trim()) nextErrors.password = ['Password is required.']

    setErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)

    try {
      const response = await login(username.trim(), password)
      saveSession(response)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrors(error.fieldErrors)
        setFormError(error.message)
      } else {
        setFormError('The API could not be reached. Check that it is running and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">S</span>
          SCAD Inventory
        </div>
        <h1 id="login-title">Welcome back</h1>
        <p className="muted">Sign in with the account linked to your warehouse.</p>

        {formError && <div className="alert alert-error" role="alert">{formError}</div>}

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
            />
            {errors.username && <span id="username-error" className="field-error">{errors.username[0]}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && <span id="password-error" className="field-error">{errors.password[0]}</span>}
          </div>

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="credential-hint">
          Development access<br />
          <code>jhb@scad.local</code> / <code>Password123!</code>
        </p>
      </section>
    </main>
  )
}

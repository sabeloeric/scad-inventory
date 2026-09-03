import { Link } from 'react-router-dom'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state-card loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state-card state-error" role="alert">
      <div className="state-icon" aria-hidden="true">!</div>
      <div>
        <h2>Something went wrong</h2>
        <p>{message}</p>
        <button className="button button-secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  actionTo?: string
}

export function EmptyState({ title, message, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="state-card empty-state">
      <div className="state-icon state-icon-soft" aria-hidden="true">+</div>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        {actionLabel && actionTo && <Link className="text-link" to={actionTo}>{actionLabel}</Link>}
      </div>
    </div>
  )
}

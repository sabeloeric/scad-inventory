import type { ReactNode } from 'react'

interface PageHeaderProps {
  headingId?: string
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ headingId, eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 id={headingId}>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

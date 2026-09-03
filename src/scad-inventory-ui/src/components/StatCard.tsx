interface StatCardProps {
  label: string
  value: string | number
  detail: string
  accent?: boolean
}

export function StatCard({ label, value, detail, accent = false }: StatCardProps) {
  return (
    <article className={`stat-card${accent ? ' stat-card-accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  )
}

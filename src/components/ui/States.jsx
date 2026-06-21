export function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="state-block">
      <div className="state-icon">{icon}</div>
      <p className="state-title">{title}</p>
      {description && <p className="state-desc">{description}</p>}
    </div>
  )
}

export function LoadingState({ label = 'Memuat data...' }) {
  return (
    <div className="state-block">
      <div className="spinner spinner-lg" />
      <p className="text-small">{label}</p>
    </div>
  )
}

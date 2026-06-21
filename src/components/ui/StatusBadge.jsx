const STATUS_MAP = {
  submitted: { tone: 'warning', label: 'Menunggu Review' },
  approved:  { tone: 'success', label: 'Disetujui' },
  rejected:  { tone: 'danger',  label: 'Ditolak' },
}

export default function StatusBadge({ status, compact = false }) {
  const s = STATUS_MAP[status] || { tone: 'neutral', label: status }
  const shortLabel = { submitted: 'Pending', approved: 'Acc', rejected: 'Tolak' }
  return (
    <span className={`badge badge-${s.tone}`}>
      <span className="badge-dot" />
      {compact ? (shortLabel[status] || s.label) : s.label}
    </span>
  )
}

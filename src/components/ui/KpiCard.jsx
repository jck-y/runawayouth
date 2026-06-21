export default function KpiCard({ icon, label, value, unit, trend }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <span className="text-caption">{label}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      <div>
        <span className="kpi-value">{value}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {trend && (
        <span className={`kpi-trend ${trend.direction || 'neutral'}`}>
          {trend.direction === 'up' && '▲'}
          {trend.direction === 'down' && '▼'}
          {trend.text}
        </span>
      )}
    </div>
  )
}

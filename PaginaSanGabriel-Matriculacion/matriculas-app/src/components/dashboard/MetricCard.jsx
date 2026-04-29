import SectionCard from '../ui/SectionCard'

function MetricCard({ title, value, description, trend, icon: Icon }) {
  return (
    <SectionCard className="metric-card">
      {/* Encabezado con indicador visual y texto corto de tendencia. */}
      <div className="metric-card-top">
        <span className="metric-icon" aria-hidden="true">
          {Icon ? <Icon size={18} strokeWidth={2.2} /> : <span className="metric-icon-core" />}
        </span>
        <span className="metric-trend">{trend}</span>
      </div>

      <p className="metric-title">{title}</p>
      <strong className="metric-value">{value}</strong>
      <span className="metric-description">{description}</span>
    </SectionCard>
  )
}

export default MetricCard
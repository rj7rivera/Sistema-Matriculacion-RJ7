import SectionCard from '../ui/SectionCard'

function AlertsPanel({ alerts }) {
  return (
    <SectionCard className="alerts-card">
      {/* Panel que agrupa alertas de pagos y documentos faltantes. */}
      <div className="section-heading">
        <div>
          <p className="section-kicker">Alertas operativas</p>
          <h3>Pagos y documentos</h3>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.title} className="alert-item">
            <span className={`alert-dot ${alert.tone}`} aria-hidden="true" />
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export default AlertsPanel
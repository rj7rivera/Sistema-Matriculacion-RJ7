import SectionCard from '../ui/SectionCard'

function DashboardChart({ data }) {
  const safeData = Array.isArray(data) ? data : []
  const maxValue = Math.max(...safeData.map((item) => Number(item.value) || 0), 1)

  return (
    <SectionCard className="chart-card">
      {/* Grafico simplificado para representar matriculas por curso. */}
      <div className="section-heading">
        <div>
          <p className="section-kicker">Estadistica de matriculas</p>
          <h3>Distribucion por curso</h3>
        </div>
        <span className="section-tag">Resumen actual</span>
      </div>

      <div className="chart-area" role="img" aria-label="Grafico de matriculas por curso">
        {safeData.map((item) => {
          const rawValue = Number(item.value) || 0
          const progress = Math.max(8, Math.round((rawValue / maxValue) * 100))
          const estimatedClasses = Math.max(10, Math.round(rawValue * 0.45))

          return (
          <div key={item.label} className="chart-column">
            <article className="chart-track">
              <div className="chart-card-head">
                <span className="chart-badge">{item.label}</span>
                <span className="chart-chip">Curso</span>
              </div>

              <div className="chart-cover" aria-hidden="true">
                <div className="chart-cover-board">
                </div>
              </div>

              <div className="chart-tutor-row">
                <span className="chart-tutor-avatar" aria-hidden="true">JP</span>
                <div>
                  <span className="chart-tutor-label">Tutor</span>
                  <strong>Juan Perez</strong>
                </div>
              </div>

              <div className="chart-progress" aria-hidden="true">
                <div className="chart-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="chart-footer">
                <span className="chart-meta">{rawValue} estudiantes</span>
                <span className="chart-meta">{estimatedClasses} clases</span>
                <button type="button" className="chart-action-button">Ver</button>
              </div>
            </article>
            <span className="chart-label">{item.label}</span>
          </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export default DashboardChart
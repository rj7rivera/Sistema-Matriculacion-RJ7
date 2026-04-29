import SectionCard from '../ui/SectionCard'

function QuickActionsPanel({ actions, onNavigate }) {
  const handleAction = (action) => {
    // Solo se navega si esa accion ya tiene una vista implementada.
    if (action.targetView) {
      onNavigate(action.targetView)
    }
  }

  return (
    <SectionCard className="quick-actions-card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Accesos rapidos</p>
          <h3>Tareas frecuentes</h3>
        </div>
      </div>

      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="quick-action-button"
            onClick={() => handleAction(action)}
          >
            <strong>{action.label}</strong>
            <span>{action.detail}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

export default QuickActionsPanel
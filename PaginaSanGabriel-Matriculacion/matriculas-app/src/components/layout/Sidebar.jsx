import {
  Circle,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Users,
  Wallet,
} from 'lucide-react'

const sidebarIcons = {
  dashboard: LayoutDashboard,
  alumnos: GraduationCap,
  representantes: Users,
  matricula: ClipboardList,
  rubros: Wallet,
  reportes: FileText,
}

function Sidebar({ items, activeView, onNavigate }) {
  return (
    <aside className="sidebar">
      {/* Marca institucional del sistema. */}
      <div className="brand-block">
        <div className="brand-mark">SG</div>
        <div>
          <p className="brand-eyebrow">Unidad Educativa</p>
          <h1>San Gabriel</h1>
        </div>
      </div>

      {/* Navegacion lateral. Solo se habilita lo ya construido. */}
      <nav className="sidebar-nav" aria-label="Menu principal">
        {items.map((item) => {
          const isActive = item.id === activeView
          const Icon = sidebarIcons[item.id] ?? Circle

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'is-active' : ''} ${item.available ? '' : 'is-disabled'}`}
              onClick={() => item.available && onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={!item.available}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Resumen fijo del periodo de trabajo. */}
      <div className="sidebar-summary">
        <p className="sidebar-summary-label">Periodo activo</p>
        <strong>2026 - 2027</strong>
        <span>Proceso de matriculacion en seguimiento administrativo.</span>
      </div>
    </aside>
  )
}

export default Sidebar
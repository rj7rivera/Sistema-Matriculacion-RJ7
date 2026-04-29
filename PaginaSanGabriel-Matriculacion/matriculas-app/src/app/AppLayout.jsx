import PageHeader from '../components/layout/PageHeader'
import Sidebar from '../components/layout/Sidebar'

function AppLayout({ sidebarItems, activeView, onNavigate, header, children, userEmail, onLogout }) {
  return (
    <div className="app-shell">
      {/* Sidebar fijo para la navegacion principal del panel administrativo. */}
      <Sidebar items={sidebarItems} activeView={activeView} onNavigate={onNavigate} />

      <main className="layout-main">
        {/* Header reutilizable que cambia segun la vista seleccionada. */}
        <PageHeader {...header} userEmail={userEmail} onLogout={onLogout} />

        {/* Espacio donde se monta el contenido especifico de cada modulo. */}
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}

export default AppLayout
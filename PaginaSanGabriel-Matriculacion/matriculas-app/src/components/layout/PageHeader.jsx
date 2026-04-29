function PageHeader({ kicker, title, description, statusLabel, statusValue, statusMeta, userEmail, onLogout }) {
  return (
    <header className="page-header">
      <div>
        {/* Etiqueta corta para ubicar al usuario dentro del modulo. */}
        <p className="page-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p className="page-description">{description}</p>
      </div>

      {/* Tarjeta secundaria que resume el estado del modulo actual. */}
      <div className="header-right">
        <div className="header-card">
          <span className="header-card-label">{statusLabel}</span>
          <strong>{statusValue}</strong>
          <small>{statusMeta}</small>
        </div>

        <div className="session-card">
          <span className="header-card-label">Sesion activa</span>
          <strong>{userEmail || 'Usuario autenticado'}</strong>
          <button type="button" className="logout-button" onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>
    </header>
  )
}

export default PageHeader
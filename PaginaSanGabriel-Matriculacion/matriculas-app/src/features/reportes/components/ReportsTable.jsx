function ReportsTable({ reports }) {
  return (
    <div className="table-wrapper">
      <table className="students-table" aria-label="Tabla de reportes generados">
        <thead>
          <tr>
            <th>Tipo de reporte</th>
            <th>Generado por</th>
            <th>Fecha</th>
            <th>Registros</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>
                <div className="table-primary-cell">
                  <strong>{report.name}</strong>
                  <span>{report.description}</span>
                </div>
              </td>
              <td>{report.generatedBy}</td>
              <td>{report.date}</td>
              <td>{report.records}</td>
              <td>
                <span className={`status-badge ${report.statusTone}`}>{report.status}</span>
              </td>
              <td>
                <div className="table-row-actions">
                  <button type="button" className="table-row-button is-delete">
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ReportsTable

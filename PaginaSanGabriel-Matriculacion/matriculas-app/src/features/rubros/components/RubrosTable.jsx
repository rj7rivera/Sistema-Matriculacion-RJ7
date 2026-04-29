function RubrosTable({ rubros, onEditRubro, onDeleteRubro, onViewRubro, onMarkRubroPaid }) {
  return (
    <div className="table-wrapper">
      <table className="students-table" aria-label="Tabla de rubros y colecturia">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Rubro</th>
            <th>Valor</th>
            <th>Fecha limite</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {rubros.map((rubro) => (
            <tr key={rubro.id}>
              <td>
                <div className="table-primary-cell">
                  <strong>{rubro.studentName}</strong>
                  <span>{rubro.course}</span>
                </div>
              </td>
              <td>{rubro.item}</td>
              <td>${rubro.amount}</td>
              <td>{rubro.dueDate}</td>
              <td>
                <span className={`status-badge ${rubro.statusTone}`}>{rubro.status}</span>
              </td>
              <td>
                <div className="table-row-actions">
                  <button type="button" className="table-row-button is-view" onClick={() => onViewRubro(rubro)}>
                    Ver
                  </button>
                  {rubro.estadoRaw !== 'pagado' && (
                    <button type="button" className="table-row-button is-pay" onClick={() => onMarkRubroPaid(rubro.id)}>
                      Registrar pago
                    </button>
                  )}
                  <button type="button" className="table-row-button is-edit" onClick={() => onEditRubro(rubro)}>
                    Editar
                  </button>
                  <button type="button" className="table-row-button is-delete" onClick={() => onDeleteRubro(rubro.id)}>
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

export default RubrosTable

function EnrollmentTable({ enrollments, onEditEnrollment, onDeleteEnrollment, onViewEnrollment }) {
  return (
    <div className="table-wrapper">
      <table className="students-table" aria-label="Tabla de matriculas">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Curso y paralelo</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment) => (
            <tr key={enrollment.id}>
              <td>
                <div className="table-primary-cell">
                  <strong>{enrollment.studentName}</strong>
                  <span>{enrollment.representativeName}</span>
                </div>
              </td>
              <td>{enrollment.course}</td>
              <td>{enrollment.date}</td>
              <td>
                <span className={`status-badge ${enrollment.statusTone}`}>{enrollment.status}</span>
              </td>
              <td>
                <div className="table-row-actions">
                  <button type="button" className="table-row-button is-view" onClick={() => onViewEnrollment(enrollment)}>
                    Ver
                  </button>
                  <button type="button" className="table-row-button is-edit" onClick={() => onEditEnrollment(enrollment)}>
                    Editar
                  </button>
                  <button type="button" className="table-row-button is-delete" onClick={() => onDeleteEnrollment(enrollment.id)}>
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

export default EnrollmentTable

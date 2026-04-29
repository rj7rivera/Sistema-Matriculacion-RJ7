function StudentsTable({ students, onEditStudent, onDeleteStudent, onViewStudent }) {
  return (
    <div className="table-wrapper">
      {/* Tabla base del modulo de alumnos con los campos mas importantes. */}
      <table className="students-table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Identificacion</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>
                <div className="table-primary-cell">
                  <strong>{student.name}</strong>
                  <span>{student.representative}</span>
                </div>
              </td>
              <td>{student.identification}</td>
              <td>
                <span className={`status-badge ${student.statusTone}`}>{student.status}</span>
              </td>
              <td>
                <div className="table-row-actions">
                  <button type="button" className="table-row-button is-view" onClick={() => onViewStudent(student)}>
                    Ver
                  </button>
                  <button type="button" className="table-row-button is-edit" onClick={() => onEditStudent(student)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="table-row-button is-delete"
                    onClick={() => onDeleteStudent(student.id)}
                  >
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

export default StudentsTable
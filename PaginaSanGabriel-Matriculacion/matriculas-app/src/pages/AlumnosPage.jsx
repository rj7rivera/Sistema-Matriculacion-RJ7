import { AlertCircle, School, Search, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import MetricCard from '../components/dashboard/MetricCard'
import SaveButton from '../components/ui/SaveButton'
import SectionCard from '../components/ui/SectionCard'
import StudentsTable from '../features/alumnos/components/StudentsTable'
import { createStudent, deleteStudent, fetchStudentCounts, fetchStudents, updateStudent } from '../services/api'

// Datos estaticos de maqueta del modulo de alumnos — los valores se reemplazan dinamicamente.
const studentMetrics = [
  { title: 'Alumnos registrados', value: '...', description: 'Base estudiantil disponible', trend: '', icon: Users },
  { title: 'Fichas completas', value: '...', description: 'Alumno y representante verificados', trend: '', icon: School },
  { title: 'Sin representante', value: '...', description: 'Registros con datos incompletos', trend: 'Prioridad administrativa', icon: AlertCircle },
]

function AlumnosPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState([])
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [viewingStudent, setViewingStudent] = useState(null)
  const [counts, setCounts] = useState({ total: 0, conRepresentante: 0, sinRepresentante: 0 })
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    identification: '',
    fechaNacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    religion: '',
    escuelaProcedencia: '',
    vivePadre: '',
    viveMadre: '',
  })

  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchStudents(searchQuery)
        setStudents(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadStudents()
  }, [searchQuery])

  useEffect(() => {
    fetchStudentCounts().then(setCounts).catch(() => {})
  }, [students])

  const resetStudentForm = () => {
    setStudentForm({ firstName: '', lastName: '', identification: '', fechaNacimiento: '', genero: '', telefono: '', email: '', direccion: '', religion: '', escuelaProcedencia: '', vivePadre: '', viveMadre: '' })
    setEditingStudentId(null)
  }

  const handleSaveStudent = async () => {
    setErrorMessage('')
    const firstName = studentForm.firstName.trim()
    const lastName = studentForm.lastName.trim()
    const identification = studentForm.identification.trim()

    if (!firstName || !lastName || !identification) {
      setErrorMessage('Nombres, apellidos y cédula son obligatorios.')
      return
    }

    const studentPayload = {
      firstName,
      lastName,
      identification,
      fechaNacimiento: studentForm.fechaNacimiento || null,
      genero: studentForm.genero || null,
      telefono: studentForm.telefono || null,
      email: studentForm.email || null,
      direccion: studentForm.direccion || null,
      religion: studentForm.religion || null,
      escuelaProcedencia: studentForm.escuelaProcedencia || null,
      vivePadre: studentForm.vivePadre || null,
      viveMadre: studentForm.viveMadre || null,
    }

    try {
      setErrorMessage('')

      if (editingStudentId) {
        await updateStudent(editingStudentId, studentPayload)
      } else {
        await createStudent(studentPayload)
      }

      const data = await fetchStudents(searchQuery)
      setStudents(data)
      return true
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleEditStudent = (student) => {
    setStudentForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      identification: student.identification,
      fechaNacimiento: student.fechaNacimiento || '',
      genero: student.genero || '',
      telefono: student.telefono || '',
      email: student.email || '',
      direccion: student.direccion || '',
      religion: student.religion || '',
      escuelaProcedencia: student.escuelaProcedencia || '',
      vivePadre: student.vivePadre || '',
      viveMadre: student.viveMadre || '',
    })
    setEditingStudentId(student.id)
    setShowForm(true)
  }

  const handleDeleteStudent = async (studentId) => {
    try {
      setErrorMessage('')
      await deleteStudent(studentId)
      const data = await fetchStudents(searchQuery)
      setStudents(data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const latestStudent = students[0]
  const studentHighlights = [
    { label: 'Ultimo alumno registrado', value: latestStudent?.name || 'Sin registros' },
    { label: 'Cedula del ultimo registro', value: latestStudent?.identification || 'Sin registros' },
    { label: 'Total de alumnos activos', value: `${counts.total.toLocaleString()} alumnos` },
    { label: 'Alumnos con representante', value: `${counts.conRepresentante.toLocaleString()} casos` },
    { label: 'Registros sin tutor', value: `${counts.sinRepresentante.toLocaleString()} casos` },
    { label: 'Fichas completadas', value: `${counts.conRepresentante.toLocaleString()} / ${counts.total.toLocaleString()}` },
    { label: 'Fichas pendientes', value: `${counts.sinRepresentante.toLocaleString()} pendientes` },
  ]

  return (
    <div className="content-stack">
      {/* Resumen superior del modulo usando el mismo lenguaje visual del dashboard. */}
      <section className="metrics-grid metrics-grid-compact" aria-label="Resumen de alumnos">
        {[
          { ...studentMetrics[0], value: counts.total.toLocaleString() },
          { ...studentMetrics[1], value: counts.conRepresentante.toLocaleString(), trend: `${counts.total > 0 ? Math.round(counts.conRepresentante * 100 / counts.total) : 0}% del total` },
          { ...studentMetrics[2], value: counts.sinRepresentante.toLocaleString() },
        ].map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      {/* Estructura principal: tabla de alumnos o formulario a la izquierda y paneles de apoyo a la derecha. */}
      <section className="students-grid">
        <SectionCard className="students-panel">
          <div className="section-heading students-panel-heading">
            <div>
              <p className="section-kicker">Gestion de alumnos</p>
              <h3>{showForm ? (editingStudentId ? 'Editar alumno' : 'Registro de alumno') : 'Registro y consulta'}</h3>
            </div>

            {!showForm && (
              <div className="students-toolbar">
                <div className="search-field module-search-field">
                  <span className="module-search-leading" aria-hidden="true">
                    <Search size={18} />
                  </span>

                  <input
                    type="text"
                    placeholder="Buscar por nombre, cedula o curso"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Buscar alumno"
                  />

                  <button type="button" className="module-search-action" aria-label="Buscar alumno">
                    Buscar
                  </button>

                  {searchQuery && (
                    <button
                      type="button"
                      className="module-search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpiar busqueda"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    resetStudentForm()
                    setShowForm(true)
                  }}
                >
                  Registrar alumno
                </button>
              </div>
            )}
          </div>

          {showForm ? (
            <form className="student-form" onSubmit={(event) => event.preventDefault()}>
              <div className="student-form-grid">
                <label className="form-field">
                  <span>Nombres</span>
                  <input
                    type="text"
                    placeholder="Ingrese los nombres"
                    value={studentForm.firstName}
                    onChange={(event) =>
                      setStudentForm((prev) => ({
                        ...prev,
                        firstName: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="form-field">
                  <span>Apellidos</span>
                  <input
                    type="text"
                    placeholder="Ingrese los apellidos"
                    value={studentForm.lastName}
                    onChange={(event) =>
                      setStudentForm((prev) => ({
                        ...prev,
                        lastName: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="form-field">
                  <span>Cedula</span>
                  <input
                    type="text"
                    placeholder="Ingrese la cedula"
                    value={studentForm.identification}
                    onChange={(event) =>
                      setStudentForm((prev) => ({
                        ...prev,
                        identification: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="form-field">
                  <span>Telefono</span>
                  <input
                    type="text"
                    placeholder="Ingrese el telefono"
                    value={studentForm.telefono}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, telefono: event.target.value }))}
                  />
                </label>

                <label className="form-field">
                  <span>Fecha de nacimiento</span>
                  <input
                    type="date"
                    value={studentForm.fechaNacimiento}
                    onChange={(event) =>
                      setStudentForm((prev) => ({ ...prev, fechaNacimiento: event.target.value }))
                    }
                  />
                </label>

                <label className="form-field">
                  <span>Genero</span>
                  <select
                    value={studentForm.genero}
                    onChange={(event) =>
                      setStudentForm((prev) => ({ ...prev, genero: event.target.value }))
                    }
                  >
                    <option value="" disabled>
                      Seleccione una opcion
                    </option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Vive con el Padre</span>
                  <select
                    value={studentForm.vivePadre}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, vivePadre: event.target.value }))}
                  >
                    <option value="" disabled>
                      Seleccione una opcion
                    </option>
                    <option value="Si">Si</option>
                    <option value="No">No</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Vive con la Madre</span>
                  <select
                    value={studentForm.viveMadre}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, viveMadre: event.target.value }))}
                  >
                    <option value="" disabled>
                      Seleccione una opcion
                    </option>
                    <option value="Si">Si</option>
                    <option value="No">No</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>Direccion</span>
                  <input
                    type="text"
                    placeholder="Ingrese la direccion"
                    value={studentForm.direccion}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, direccion: event.target.value }))}
                  />
                </label>

                <label className="form-field form-field-full">
                  <span>Religion</span>
                  <input
                    type="text"
                    placeholder="Ingrese la religion"
                    value={studentForm.religion}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, religion: event.target.value }))}
                  />
                </label>

                <label className="form-field form-field-full">
                  <span>Correo</span>
                  <input
                    type="email"
                    placeholder="Ingrese el correo"
                    value={studentForm.email}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </label>

                <label className="form-field form-field-full">
                  <span>Escuela o Colegio de procedencia</span>
                  <input
                    type="text"
                    placeholder="Ingrese la unidad educativa de donde viene"
                    value={studentForm.escuelaProcedencia}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, escuelaProcedencia: event.target.value }))}
                  />
                </label>

                <p className="form-info-note" style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)', marginTop: '0.25rem' }}>
                  El curso se asigna desde el modulo de Matriculas.
                </p>
              </div>

              {errorMessage && <p className="form-error" style={{ color: 'red', marginBottom: '0.75rem' }}>{errorMessage}</p>}

              <div className="student-form-actions">
                <SaveButton
                  onSave={handleSaveStudent}
                  onComplete={() => { resetStudentForm(); setShowForm(false) }}
                  label="Guardar"
                  editingLabel="Actualizar"
                  isEditing={!!editingStudentId}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetStudentForm()
                    setShowForm(false)
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : isLoading ? (
            <p>Cargando alumnos...</p>
          ) : errorMessage ? (
            <p>{errorMessage}</p>
          ) : (
            <StudentsTable
              students={students}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onViewStudent={setViewingStudent}
            />
          )}
        </SectionCard>

        <div className="students-side-stack">
          <SectionCard className="students-highlight-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Vista rapida</p>
                <h3>Ficha operativa</h3>
              </div>
            </div>

            <div className="highlight-list">
              {studentHighlights.map((item) => (
                <div key={item.label} className="highlight-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>


        </div>
      </section>

      {viewingStudent && (
        <div className="detail-overlay" onClick={() => setViewingStudent(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3>Ficha del alumno</h3>
              <button type="button" className="detail-modal-close" onClick={() => setViewingStudent(null)}>✕</button>
            </div>
            <div className="detail-modal-body">
              <div className="detail-field"><span>Nombres</span><strong>{viewingStudent.firstName}</strong></div>
              <div className="detail-field"><span>Apellidos</span><strong>{viewingStudent.lastName}</strong></div>
              <div className="detail-field"><span>Cedula</span><strong>{viewingStudent.identification}</strong></div>
              <div className="detail-field"><span>Telefono</span><strong>{viewingStudent.telefono || '—'}</strong></div>
              <div className="detail-field"><span>Fecha de nacimiento</span><strong>{viewingStudent.fechaNacimiento || '—'}</strong></div>
              <div className="detail-field"><span>Genero</span><strong>{viewingStudent.genero === 'M' ? 'Masculino' : viewingStudent.genero === 'F' ? 'Femenino' : '—'}</strong></div>
              <div className="detail-field"><span>Vive con el padre</span><strong>{viewingStudent.vivePadre || '—'}</strong></div>
              <div className="detail-field"><span>Vive con la madre</span><strong>{viewingStudent.viveMadre || '—'}</strong></div>
              <div className="detail-field full"><span>Direccion</span><strong>{viewingStudent.direccion || '—'}</strong></div>
              <div className="detail-field"><span>Religion</span><strong>{viewingStudent.religion || '—'}</strong></div>
              <div className="detail-field"><span>Correo</span><strong>{viewingStudent.email || '—'}</strong></div>
              <div className="detail-field full"><span>Escuela de procedencia</span><strong>{viewingStudent.escuelaProcedencia || '—'}</strong></div>
              <div className="detail-field"><span>Representante</span><strong>{viewingStudent.representative}</strong></div>
              <div className="detail-field"><span>Estado</span><strong>{viewingStudent.status}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlumnosPage
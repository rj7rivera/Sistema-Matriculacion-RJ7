import { ClipboardCheck, FileWarning, GraduationCap, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import MetricCard from '../components/dashboard/MetricCard'
import SaveButton from '../components/ui/SaveButton'
import SectionCard from '../components/ui/SectionCard'
import EnrollmentTable from '../features/matricula/components/EnrollmentTable'
import {
  createEnrollment,
  deleteEnrollment,
  fetchCourses,
  fetchEnrollmentCounts,
  fetchEnrollments,
  fetchPeriods,
  fetchStudentsSimple,
  updateEnrollment,
} from '../services/api'

const enrollmentMetrics = [
  { title: 'Matriculas generadas', value: '...', description: 'Registros consolidados en el sistema', trend: '', icon: ClipboardCheck },
  { title: 'Pendientes por cerrar', value: '...', description: 'Casos con validaciones pendientes', trend: 'Documentacion o pago por revisar', icon: FileWarning },
  { title: 'Matriculas aprobadas', value: '...', description: 'Registros aprobados', trend: '', icon: GraduationCap },
]

function MatriculaPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [viewingEnrollment, setViewingEnrollment] = useState(null)
  const [counts, setCounts] = useState({ total: 0, pendientes: 0, aprobadas: 0 })
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [periods, setPeriods] = useState([])
  const [enrollmentForm, setEnrollmentForm] = useState({
    alumnoId: '',
    cursoId: '',
    periodoId: '',
    fechaMatricula: '',
    estado: 'pendiente',
    observaciones: '',
  })

  useEffect(() => {
    const loadEnrollments = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchEnrollments(searchQuery)
        setEnrollments(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadEnrollments()
  }, [searchQuery])

  useEffect(() => {
    fetchEnrollmentCounts().then(setCounts).catch(() => {})
  }, [enrollments])

  useEffect(() => {
    Promise.all([fetchStudentsSimple(), fetchCourses(), fetchPeriods()])
      .then(([s, c, p]) => {
        setStudents(s)
        setCourses(c)
        setPeriods(p)
      })
      .catch(() => {})
  }, [])

  const resetForm = () => {
    setEnrollmentForm({ alumnoId: '', cursoId: '', periodoId: '', fechaMatricula: '', estado: 'pendiente', observaciones: '' })
    setEditingId(null)
  }

  const handleSaveEnrollment = async () => {
    const { alumnoId, cursoId, periodoId } = enrollmentForm
    if (!editingId && (!alumnoId || !cursoId || !periodoId)) {
      setErrorMessage('Alumno, curso y periodo son obligatorios.')
      return
    }
    if (editingId && !cursoId) {
      setErrorMessage('Debe seleccionar un curso.')
      return
    }

    try {
      setErrorMessage('')
      if (editingId) {
        await updateEnrollment(editingId, enrollmentForm)
      } else {
        await createEnrollment(enrollmentForm)
      }
      const data = await fetchEnrollments(searchQuery)
      setEnrollments(data)
      return true
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleEditEnrollment = (enrollment) => {
    setEnrollmentForm({
      alumnoId: enrollment.alumnoId,
      cursoId: enrollment.cursoId,
      periodoId: enrollment.periodoId,
      fechaMatricula: enrollment.fechaMatriculaRaw || '',
      estado: enrollment.estadoRaw || 'pendiente',
      observaciones: '',
    })
    setEditingId(enrollment.id)
    setShowForm(true)
  }

  const handleDeleteEnrollment = async (id) => {
    if (!window.confirm('¿Desea eliminar esta matrícula?')) return
    try {
      setErrorMessage('')
      await deleteEnrollment(id)
      const data = await fetchEnrollments(searchQuery)
      setEnrollments(data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const setField = (field) => (event) =>
    setEnrollmentForm((prev) => ({ ...prev, [field]: event.target.value }))

  const latestEnrollment = enrollments[0]
  const latestApproved = enrollments.find((item) => item.estadoRaw === 'aprobada')
  const annulledCount = enrollments.filter((item) => item.estadoRaw === 'anulada').length
  const pendingByCourse = enrollments
    .filter((item) => item.estadoRaw === 'pendiente')
    .reduce((acc, item) => {
      acc[item.course] = (acc[item.course] || 0) + 1
      return acc
    }, {})
  const mostPendingCourse = Object.entries(pendingByCourse).sort((a, b) => b[1] - a[1])[0]

  const enrollmentHighlights = [
    { label: 'Ultima matricula registrada', value: latestEnrollment?.studentName || 'Sin registros' },
    { label: 'Ultima matricula aprobada', value: latestApproved?.studentName || 'Sin aprobadas' },
    { label: 'Total matriculados', value: `${counts.total.toLocaleString()} alumnos` },
    { label: 'Curso con mas pendientes', value: mostPendingCourse ? `${mostPendingCourse[0]} (${mostPendingCourse[1]})` : 'Sin pendientes' },
    { label: 'Matriculas aprobadas', value: `${counts.aprobadas.toLocaleString()} registros` },
    { label: 'Matriculas pendientes', value: `${counts.pendientes.toLocaleString()} casos` },
    { label: 'Matriculas anuladas', value: `${annulledCount.toLocaleString()} casos` },
  ]

  return (
    <div className="content-stack">
      <section className="metrics-grid metrics-grid-compact" aria-label="Resumen de matriculas">
        {[
          { ...enrollmentMetrics[0], value: counts.total.toLocaleString() },
          { ...enrollmentMetrics[1], value: counts.pendientes.toLocaleString() },
          { ...enrollmentMetrics[2], value: counts.aprobadas.toLocaleString(), trend: `${counts.total > 0 ? Math.round(counts.aprobadas * 100 / counts.total) : 0}% del total` },
        ].map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="students-grid">
        <SectionCard className="students-panel">
          <div className="section-heading students-panel-heading">
            <div>
              <p className="section-kicker">Gestion de matriculas</p>
              <h3>{showForm ? (editingId ? 'Editar matrícula' : 'Generar nueva matricula') : 'Consulta y seguimiento'}</h3>
            </div>

            {!showForm && (
              <div className="students-toolbar">
                <div className="search-field module-search-field">
                  <span className="module-search-leading" aria-hidden="true">
                    <Search size={18} />
                  </span>

                  <input
                    type="text"
                    placeholder="Buscar por alumno, curso o estado"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Buscar matricula"
                  />

                  <button type="button" className="module-search-action" aria-label="Buscar matricula">
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

                <button type="button" className="primary-button" onClick={() => { resetForm(); setShowForm(true) }}>
                  Nueva matricula
                </button>
              </div>
            )}
          </div>

          {showForm ? (
            <form className="student-form" onSubmit={(event) => event.preventDefault()}>
              <div className="student-form-grid">
                <label className="form-field form-field-full">
                  <span>Alumno</span>
                  <select value={enrollmentForm.alumnoId} onChange={setField('alumnoId')} disabled={!!editingId}>
                    <option value="" disabled>
                      Seleccione un alumno
                    </option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Periodo lectivo</span>
                  <select value={enrollmentForm.periodoId} onChange={setField('periodoId')} disabled={!!editingId}>
                    <option value="" disabled>
                      Seleccione un periodo
                    </option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}{p.activo ? ' (activo)' : ''}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Fecha de matricula</span>
                  <input type="date" value={enrollmentForm.fechaMatricula} onChange={setField('fechaMatricula')} />
                </label>

                <label className="form-field form-field-full">
                  <span>Curso</span>
                  <select value={enrollmentForm.cursoId} onChange={setField('cursoId')}>
                    <option value="" disabled>
                      Seleccione un curso
                    </option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Estado</span>
                  <select value={enrollmentForm.estado} onChange={setField('estado')}>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="anulada">Anulada</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>Observaciones</span>
                  <input type="text" placeholder="Observaciones adicionales" value={enrollmentForm.observaciones} onChange={setField('observaciones')} />
                </label>
              </div>

              {errorMessage && <p className="form-error">{errorMessage}</p>}

              <div className="student-form-actions">
                <SaveButton
                  onSave={handleSaveEnrollment}
                  onComplete={() => { resetForm(); setShowForm(false) }}
                  label="Guardar matricula"
                  editingLabel="Actualizar matricula"
                  isEditing={!!editingId}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetForm()
                    setShowForm(false)
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : isLoading ? (
            <p>Cargando matriculas...</p>
          ) : errorMessage ? (
            <p>{errorMessage}</p>
          ) : (
            <EnrollmentTable
              enrollments={enrollments}
              onEditEnrollment={handleEditEnrollment}
              onDeleteEnrollment={handleDeleteEnrollment}
              onViewEnrollment={setViewingEnrollment}
            />
          )}
        </SectionCard>

        <div className="students-side-stack">
          <SectionCard className="students-highlight-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Control rapido</p>
                <h3>Estado del proceso</h3>
              </div>
            </div>

            <div className="highlight-list">
              {enrollmentHighlights.map((item) => (
                <div key={item.label} className="highlight-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>


        </div>
      </section>

      {viewingEnrollment && (
        <div className="detail-overlay" onClick={() => setViewingEnrollment(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3>Detalle de matricula</h3>
              <button type="button" className="detail-modal-close" onClick={() => setViewingEnrollment(null)}>✕</button>
            </div>
            <div className="detail-modal-body">
              <div className="detail-field full"><span>Alumno</span><strong>{viewingEnrollment.studentName}</strong></div>
              <div className="detail-field full"><span>Representante</span><strong>{viewingEnrollment.representativeName}</strong></div>
              <div className="detail-field"><span>Curso</span><strong>{viewingEnrollment.course}</strong></div>
              <div className="detail-field"><span>Fecha de matricula</span><strong>{viewingEnrollment.date}</strong></div>
              <div className="detail-field"><span>Estado</span><strong>{viewingEnrollment.status}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MatriculaPage

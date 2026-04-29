import { AlertCircle, Search, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import MetricCard from '../components/dashboard/MetricCard'
import SaveButton from '../components/ui/SaveButton'
import SectionCard from '../components/ui/SectionCard'
import { createRepresentative, deleteRepresentative, fetchRepresentativeCounts, fetchRepresentatives, fetchStudentsSimple, linkStudentToRepresentative, updateRepresentative } from '../services/api'

const representativeMetrics = [
  { title: 'Representantes registrados', value: '...', description: 'Padres, madres y tutores activos', trend: '', icon: Users },
  { title: 'Con telefono registrado', value: '...', description: 'Contacto telefonico disponible', trend: '', icon: ShieldCheck },
  { title: 'Sin telefono', value: '...', description: 'Registros por actualizar', trend: 'Revision administrativa', icon: AlertCircle },
]

function RepresentativesTable({ representativesList, onEditRepresentative, onDeleteRepresentative, onViewRepresentative }) {
  return (
    <div className="table-wrapper">
      <table className="students-table" aria-label="Tabla de representantes">
        <thead>
          <tr>
            <th>Representante</th>
            <th>Identificacion</th>
            <th>Alumno representado</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {representativesList.map((representative) => (
            <tr key={representative.id}>
              <td>
                <div className="table-primary-cell">
                  <strong>{representative.name}</strong>
                  <span>{representative.relatedStudent}</span>
                </div>
              </td>
              <td>{representative.identification}</td>
              <td>{representative.relatedStudent}</td>
              <td>
                <span className={`status-badge ${representative.statusTone}`}>{representative.status}</span>
              </td>
              <td>
                <div className="table-row-actions">
                  <button type="button" className="table-row-button is-view" onClick={() => onViewRepresentative(representative)}>
                    Ver
                  </button>
                  <button type="button" className="table-row-button is-edit" onClick={() => onEditRepresentative(representative)}>
                    Editar
                  </button>
                  <button type="button" className="table-row-button is-delete" onClick={() => onDeleteRepresentative(representative.id)}>
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

function RepresentantesPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [representatives, setRepresentatives] = useState([])
  const [studentsSimple, setStudentsSimple] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [viewingRepresentative, setViewingRepresentative] = useState(null)
  const [counts, setCounts] = useState({ total: 0, conTelefono: 0, sinDatos: 0 })
  const [representativeForm, setRepresentativeForm] = useState({
    firstName: '',
    lastName: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    parentesco: '',
    alumnoAsignado: '',
  })

  useEffect(() => {
    fetchStudentsSimple().then(setStudentsSimple).catch(() => {})
  }, [])

  useEffect(() => {
    const loadRepresentatives = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchRepresentatives(searchQuery)
        setRepresentatives(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRepresentatives()
  }, [searchQuery])

  useEffect(() => {
    fetchRepresentativeCounts().then(setCounts).catch(() => {})
  }, [representatives])

  const resetForm = () => {
    setRepresentativeForm({ firstName: '', lastName: '', cedula: '', telefono: '', email: '', direccion: '', parentesco: '', alumnoAsignado: '' })
    setEditingId(null)
  }

  const handleSaveRepresentative = async () => {
    const { firstName, lastName, cedula, parentesco } = representativeForm
    if (!firstName.trim() || !lastName.trim() || !cedula.trim() || !parentesco) {
      setErrorMessage('Nombres, apellidos, cédula y parentesco son obligatorios.')
      return
    }

    try {
      setErrorMessage('')
      let savedId = editingId
      if (editingId) {
        await updateRepresentative(editingId, representativeForm)
      } else {
        const created = await createRepresentative(representativeForm)
        savedId = created.id
      }
      if (representativeForm.alumnoAsignado) {
        await linkStudentToRepresentative(representativeForm.alumnoAsignado, savedId)
      }
      const data = await fetchRepresentatives(searchQuery)
      setRepresentatives(data)
      return true
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleEditRepresentative = (representative) => {
    setRepresentativeForm({
      firstName: representative.firstName || '',
      lastName: representative.lastName || '',
      cedula: representative.identification,
      telefono: representative.telefono || '',
      email: representative.email || '',
      direccion: representative.direccion || '',
      parentesco: representative.parentesco || '',
      alumnoAsignado: representative.relatedStudentId || '',
    })
    setEditingId(representative.id)
    setShowForm(true)
  }

  const handleDeleteRepresentative = async (id) => {
    if (!window.confirm('¿Desea eliminar este representante?')) return
    try {
      setErrorMessage('')
      await deleteRepresentative(id)
      const data = await fetchRepresentatives(searchQuery)
      setRepresentatives(data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const setField = (field) => (event) =>
    setRepresentativeForm((prev) => ({ ...prev, [field]: event.target.value }))

  const latestRepresentative = representatives[0]
  const withAssignedStudent = representatives.filter((item) => item.relatedStudent !== 'Sin alumno asignado').length
  const withoutAssignedStudent = counts.total - withAssignedStudent
  const withoutEmail = representatives.filter((item) => !item.email?.trim()).length
  const representativeHighlights = [
    { label: 'Ultimo representante registrado', value: latestRepresentative?.name || 'Sin registros' },
    { label: 'Parentesco del ultimo registro', value: latestRepresentative?.parentesco || 'Sin registros' },
    { label: 'Total de representantes', value: `${counts.total.toLocaleString()} registros` },
    { label: 'Con alumno asignado', value: `${withAssignedStudent.toLocaleString()} casos` },
    { label: 'Sin alumno asignado', value: `${Math.max(0, withoutAssignedStudent).toLocaleString()} casos` },
    { label: 'Con telefono registrado', value: `${counts.conTelefono.toLocaleString()} casos` },
    { label: 'Correos pendientes', value: `${withoutEmail.toLocaleString()} registros` },
  ]

  return (
    <div className="content-stack">
      <section className="metrics-grid metrics-grid-compact" aria-label="Resumen de representantes">
        {[
          { ...representativeMetrics[0], value: counts.total.toLocaleString() },
          { ...representativeMetrics[1], value: counts.conTelefono.toLocaleString(), trend: `${counts.total > 0 ? Math.round(counts.conTelefono * 100 / counts.total) : 0}% del total` },
          { ...representativeMetrics[2], value: counts.sinDatos.toLocaleString() },
        ].map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="students-grid">
        <SectionCard className="students-panel representative-panel">
          <div className="section-heading students-panel-heading">
            <div>
              <p className="section-kicker">Gestion de representantes</p>
              <h3>{showForm ? (editingId ? 'Editar representante' : 'Registro de representante') : 'Registro y consulta'}</h3>
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
                    aria-label="Buscar representante"
                  />

                  <button type="button" className="module-search-action" aria-label="Buscar representante">
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

                <button type="button" className="primary-button" onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}>
                  Registrar representante
                </button>
              </div>
            )}
          </div>

          {showForm ? (
            <form className="student-form" onSubmit={(event) => event.preventDefault()}>
              <div className="student-form-grid">
                <label className="form-field">
                  <span>Nombres</span>
                  <input type="text" placeholder="Ingrese los nombres" value={representativeForm.firstName} onChange={setField('firstName')} />
                </label>

                <label className="form-field">
                  <span>Apellidos</span>
                  <input type="text" placeholder="Ingrese los apellidos" value={representativeForm.lastName} onChange={setField('lastName')} />
                </label>

                <label className="form-field">
                  <span>Cedula</span>
                  <input type="text" placeholder="Ingrese la cedula" value={representativeForm.cedula} onChange={setField('cedula')} />
                </label>

                <label className="form-field">
                  <span>Celular 1</span>
                  <input type="text" placeholder="Ingrese el telefono" value={representativeForm.telefono} onChange={setField('telefono')} />
                </label>

                <label className="form-field">
                  <span>Celular 2</span>
                  <input type="text" placeholder="Ingrese el telefono" />
                </label>

                <label className="form-field form-field-full">
                  <span>Direccion</span>
                  <input type="text" placeholder="Ingrese la direccion" value={representativeForm.direccion} onChange={setField('direccion')} />
                </label>

                <label className="form-field form-field-full">
                  <span>Correo</span>
                  <input type="email" placeholder="Ingrese el correo" value={representativeForm.email} onChange={setField('email')} />
                </label>

                <label className="form-field form-field-full">
                  <span>Ocupacion</span>
                  <input type="text" placeholder="Ingrese la Ocupacion" />
                </label>

                <label className="form-field form-field-full">
                  <span>Parentesco</span>
                  <select value={representativeForm.parentesco} onChange={setField('parentesco')}>
                    <option value="" disabled>
                      Seleccione una opcion
                    </option>
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Abuelo">Abuelo</option>
                    <option value="Abuela">Abuela</option>
                    <option value="Tutor">Tutor</option>
                    <option value="Hermano">Hermano</option>
                    <option value="Hermana">Hermana</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>Alumno a asignar</span>
                  <select value={representativeForm.alumnoAsignado} onChange={setField('alumnoAsignado')}>
                    <option value="">-- Sin asignar --</option>
                    {studentsSimple.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>Facturar</span>
                  <select defaultValue="">
                    <option value="" disabled>
                      Seleccione una opcion
                    </option>
                    <option>Si</option>
                    <option>No</option>
                  </select>
                </label>
              </div>

              {errorMessage && <p className="form-error">{errorMessage}</p>}

              <div className="student-form-actions">
                <SaveButton
                  onSave={handleSaveRepresentative}
                  onComplete={() => { resetForm(); setShowForm(false) }}
                  label="Guardar"
                  editingLabel="Actualizar"
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
            <p>Cargando representantes...</p>
          ) : errorMessage ? (
            <p>{errorMessage}</p>
          ) : (
            <RepresentativesTable
              representativesList={representatives}
              onEditRepresentative={handleEditRepresentative}
              onDeleteRepresentative={handleDeleteRepresentative}
              onViewRepresentative={setViewingRepresentative}
            />
          )}
        </SectionCard>

        <div className="students-side-stack">
          <SectionCard className="students-highlight-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Vista rapida</p>
                <h3>Control del representante</h3>
              </div>
            </div>

            <div className="highlight-list">
              {representativeHighlights.map((item) => (
                <div key={item.label} className="highlight-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>


        </div>
      </section>

      {viewingRepresentative && (
        <div className="detail-overlay" onClick={() => setViewingRepresentative(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3>Ficha del representante</h3>
              <button type="button" className="detail-modal-close" onClick={() => setViewingRepresentative(null)}>✕</button>
            </div>
            <div className="detail-modal-body">
              <div className="detail-field"><span>Nombres</span><strong>{viewingRepresentative.firstName}</strong></div>
              <div className="detail-field"><span>Apellidos</span><strong>{viewingRepresentative.lastName}</strong></div>
              <div className="detail-field"><span>Cedula</span><strong>{viewingRepresentative.identification}</strong></div>
              <div className="detail-field"><span>Parentesco</span><strong>{viewingRepresentative.parentesco || '—'}</strong></div>
              <div className="detail-field"><span>Telefono</span><strong>{viewingRepresentative.telefono || '—'}</strong></div>
              <div className="detail-field"><span>Correo</span><strong>{viewingRepresentative.email || '—'}</strong></div>
              <div className="detail-field full"><span>Direccion</span><strong>{viewingRepresentative.direccion || '—'}</strong></div>
              <div className="detail-field full"><span>Alumno representado</span><strong>{viewingRepresentative.relatedStudent}</strong></div>
              <div className="detail-field"><span>Estado</span><strong>{viewingRepresentative.status}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RepresentantesPage

import { CircleDollarSign, FileClock, Search, Wallet, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import MetricCard from '../components/dashboard/MetricCard'
import SaveButton from '../components/ui/SaveButton'
import SectionCard from '../components/ui/SectionCard'
import RubrosTable from '../features/rubros/components/RubrosTable'
import {
  createRubro,
  deleteRubro,
  fetchEnrollmentsSimple,
  fetchPeriods,
  fetchRubroCounts,
  fetchRubros,
  fetchTipoRubros,
  markRubroAsPaid,
  updateRubro,
} from '../services/api'

const rubroMetrics = [
  { title: 'Rubros emitidos', value: '...', description: 'Cargos registrados del periodo activo', trend: 'Incluye matricula, pension y servicios', icon: CircleDollarSign },
  { title: 'Pagos registrados', value: '...', description: 'Comprobantes aplicados en colecturia', trend: '', icon: Wallet },
  { title: 'Saldos pendientes', value: '...', description: 'Valores por regularizar', trend: 'Seguimiento prioritario', icon: FileClock },
]

function RubrosPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [rubrosList, setRubrosList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [viewingRubro, setViewingRubro] = useState(null)
  const [counts, setCounts] = useState({ total: 0, pagados: 0, pendientes: 0 })
  const [enrollmentsOptions, setEnrollmentsOptions] = useState([])
  const [tipoRubros, setTipoRubros] = useState([])
  const [periods, setPeriods] = useState([])
  const [rubroForm, setRubroForm] = useState({
    matriculaId: '',
    alumnoId: '',
    periodoId: '',
    tipoRubroId: '',
    monto: '',
    fechaLimite: '',
    estado: 'pendiente',
    observaciones: '',
  })

  useEffect(() => {
    const loadRubros = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchRubros(searchQuery)
        setRubrosList(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRubros()
  }, [searchQuery])

  useEffect(() => {
    fetchRubroCounts().then(setCounts).catch(() => {})
  }, [rubrosList])

  useEffect(() => {
    Promise.all([fetchEnrollmentsSimple(), fetchTipoRubros(), fetchPeriods()])
      .then(([e, t, p]) => {
        setEnrollmentsOptions(e)
        setTipoRubros(t)
        setPeriods(p)
      })
      .catch(() => {})
  }, [])

  const resetForm = () => {
    setRubroForm({ matriculaId: '', alumnoId: '', periodoId: '', tipoRubroId: '', monto: '', fechaLimite: '', estado: 'pendiente', observaciones: '' })
    setEditingId(null)
  }

  const handleMatriculaChange = (event) => {
    const selected = enrollmentsOptions.find((e) => e.id === event.target.value)
    setRubroForm((prev) => ({
      ...prev,
      matriculaId: event.target.value,
      alumnoId: selected?.alumnoId || '',
      periodoId: selected?.periodoId || '',
    }))
  }

  const handleSaveRubro = async () => {
    const { tipoRubroId, monto, fechaLimite } = rubroForm
    if (!tipoRubroId || !monto || !fechaLimite) {
      setErrorMessage('Tipo de rubro, valor y fecha límite son obligatorios.')
      return
    }
    if (!editingId && !rubroForm.matriculaId) {
      setErrorMessage('Debe seleccionar una matrícula.')
      return
    }

    try {
      setErrorMessage('')
      if (editingId) {
        await updateRubro(editingId, rubroForm)
      } else {
        await createRubro(rubroForm)
      }
      const data = await fetchRubros(searchQuery)
      setRubrosList(data)
      return true
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleEditRubro = (rubro) => {
    setRubroForm({
      matriculaId: rubro.matriculaId,
      alumnoId: rubro.alumnoId,
      periodoId: rubro.periodoId,
      tipoRubroId: rubro.tipoRubroId,
      monto: rubro.montoRaw,
      fechaLimite: rubro.fechaLimiteRaw,
      estado: rubro.estadoRaw || 'pendiente',
      observaciones: rubro.observacionesRaw || '',
    })
    setEditingId(rubro.id)
    setShowForm(true)
  }

  const handleDeleteRubro = async (id) => {
    if (!window.confirm('¿Desea eliminar este rubro?')) return
    try {
      setErrorMessage('')
      await deleteRubro(id)
      const data = await fetchRubros(searchQuery)
      setRubrosList(data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleMarkRubroPaid = async (id) => {
    if (!window.confirm('¿Confirmar registro de pago de este rubro?')) return
    try {
      setErrorMessage('')
      await markRubroAsPaid(id)
      const data = await fetchRubros(searchQuery)
      setRubrosList(data)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const setField = (field) => (event) =>
    setRubroForm((prev) => ({ ...prev, [field]: event.target.value }))

  const currency = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
  const today = new Date().toISOString().split('T')[0]
  const monthPrefix = today.slice(0, 7)

  const paidTodayTotal = rubrosList
    .filter((r) => r.estadoRaw === 'pagado' && r.fechaPagoRaw === today)
    .reduce((sum, r) => sum + Number(r.montoRaw || 0), 0)

  const paidMonthTotal = rubrosList
    .filter((r) => r.estadoRaw === 'pagado' && r.fechaPagoRaw?.startsWith(monthPrefix))
    .reduce((sum, r) => sum + Number(r.montoRaw || 0), 0)

  const debtByCourse = rubrosList
    .filter((r) => r.estadoRaw !== 'pagado')
    .reduce((acc, r) => {
      acc[r.course] = (acc[r.course] || 0) + Number(r.montoRaw || 0)
      return acc
    }, {})

  const topDebtCourse = Object.entries(debtByCourse).sort((a, b) => b[1] - a[1])[0]
  const overdueCount = rubrosList.filter((r) => r.estadoRaw === 'vencido').length

  const statusByStudent = rubrosList.reduce((acc, r) => {
    if (!acc[r.alumnoId]) {
      acc[r.alumnoId] = []
    }
    acc[r.alumnoId].push(r.estadoRaw)
    return acc
  }, {})

  const studentsUpToDate = Object.values(statusByStudent).filter(
    (statuses) => statuses.length > 0 && statuses.every((status) => status === 'pagado'),
  ).length

  const rubroHighlights = [
    { label: 'Ultimo recibo emitido', value: rubrosList[0]?.receiptNumber || 'Sin registros' },
    { label: 'Recaudacion del dia', value: currency.format(paidTodayTotal) },
    { label: 'Recaudacion del mes', value: currency.format(paidMonthTotal) },
    { label: 'Rubros pendientes de cobro', value: `${counts.pendientes.toLocaleString()} registros` },
    { label: 'Mayor deuda por curso', value: topDebtCourse ? `${topDebtCourse[0]} (${currency.format(topDebtCourse[1])})` : 'Sin deuda' },
    { label: 'Rubros vencidos', value: `${overdueCount.toLocaleString()} casos` },
    { label: 'Alumnos al dia en pagos', value: `${studentsUpToDate.toLocaleString()} alumnos` },
  ]

  return (
    <div className="content-stack">
      <section className="metrics-grid metrics-grid-compact" aria-label="Resumen de rubros y colecturia">
        {[
          { ...rubroMetrics[0], value: counts.total.toLocaleString() },
          { ...rubroMetrics[1], value: counts.pagados.toLocaleString(), trend: `${counts.total > 0 ? Math.round(counts.pagados * 100 / counts.total) : 0}% de cumplimiento` },
          { ...rubroMetrics[2], value: counts.pendientes.toLocaleString() },
        ].map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="students-grid">
        <SectionCard className="students-panel">
          <div className="section-heading students-panel-heading">
            <div>
              <p className="section-kicker">Gestion de rubros y colecturia</p>
              <h3>{showForm ? (editingId ? 'Editar rubro' : 'Registrar rubro') : 'Control de cobros y pagos'}</h3>
            </div>

            {!showForm && (
              <div className="students-toolbar">
                <div className="search-field module-search-field">
                  <span className="module-search-leading" aria-hidden="true">
                    <Search size={18} />
                  </span>

                  <input
                    type="text"
                    placeholder="Buscar por alumno, rubro o estado"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Buscar rubro"
                  />

                  <button type="button" className="module-search-action" aria-label="Buscar rubro">
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
                  Nuevo rubro
                </button>
              </div>
            )}
          </div>

          {showForm ? (
            <form className="student-form" onSubmit={(event) => event.preventDefault()}>
              <div className="student-form-grid">
                <label className="form-field form-field-full">
                  <span>Matrícula (alumno — curso)</span>
                  <select value={rubroForm.matriculaId} onChange={handleMatriculaChange} disabled={!!editingId}>
                    <option value="" disabled>
                      Seleccione una matrícula
                    </option>
                    {enrollmentsOptions.map((e) => (
                      <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Tipo de rubro</span>
                  <select value={rubroForm.tipoRubroId} onChange={setField('tipoRubroId')}>
                    <option value="" disabled>
                      Seleccione una opcion
                    </option>
                    {tipoRubros.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Valor</span>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={rubroForm.monto} onChange={setField('monto')} />
                </label>

                <label className="form-field">
                  <span>Fecha limite</span>
                  <input type="date" value={rubroForm.fechaLimite} onChange={setField('fechaLimite')} />
                </label>

                <label className="form-field">
                  <span>Estado de cobro</span>
                  <select value={rubroForm.estado} onChange={setField('estado')}>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>Observacion</span>
                  <input type="text" placeholder="Detalle adicional del cobro" value={rubroForm.observaciones} onChange={setField('observaciones')} />
                </label>
              </div>

              {errorMessage && <p className="form-error">{errorMessage}</p>}

              <div className="student-form-actions">
                <SaveButton
                  onSave={handleSaveRubro}
                  onComplete={() => { resetForm(); setShowForm(false) }}
                  label="Guardar rubro"
                  editingLabel="Actualizar rubro"
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
            <p>Cargando rubros...</p>
          ) : errorMessage ? (
            <p>{errorMessage}</p>
          ) : (
            <RubrosTable
              rubros={rubrosList}
              onEditRubro={handleEditRubro}
              onDeleteRubro={handleDeleteRubro}
              onViewRubro={setViewingRubro}
              onMarkRubroPaid={handleMarkRubroPaid}
            />
          )}
        </SectionCard>

        <div className="students-side-stack">
          <SectionCard className="students-highlight-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Vista rapida</p>
                <h3>Control financiero</h3>
              </div>
            </div>

            <div className="highlight-list">
              {rubroHighlights.map((item) => (
                <div key={item.label} className="highlight-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>


        </div>
      </section>

      {viewingRubro && (
        <div className="detail-overlay" onClick={() => setViewingRubro(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3>Detalle del rubro</h3>
              <button type="button" className="detail-modal-close" onClick={() => setViewingRubro(null)}>✕</button>
            </div>
            <div className="detail-modal-body">
              <div className="detail-field full"><span>Alumno</span><strong>{viewingRubro.studentName}</strong></div>
              <div className="detail-field"><span>Curso</span><strong>{viewingRubro.course}</strong></div>
              <div className="detail-field"><span>Rubro</span><strong>{viewingRubro.item}</strong></div>
              <div className="detail-field"><span>Monto</span><strong>${viewingRubro.amount}</strong></div>
              <div className="detail-field"><span>Fecha limite</span><strong>{viewingRubro.dueDate}</strong></div>
              <div className="detail-field"><span>Fecha de pago</span><strong>{viewingRubro.fechaPagoRaw || 'No registrada'}</strong></div>
              <div className="detail-field"><span>Número de recibo</span><strong>{viewingRubro.receiptNumber}</strong></div>
              <div className="detail-field"><span>Estado</span><strong>{viewingRubro.status}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RubrosPage

import { BarChart3, FileDown, PieChart, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import MetricCard from '../components/dashboard/MetricCard'
import SectionCard from '../components/ui/SectionCard'
import ReportsTable from '../features/reportes/components/ReportsTable'
import {
  createReportRecord,
  fetchEnrollmentDocumentData,
  fetchEnrollmentsSimple,
  fetchReportCounts,
  fetchReports,
} from '../services/api'

const reportMetrics = [
  { title: 'Reportes generados', value: '0', description: 'Exportaciones del periodo activo', trend: '', icon: FileDown },
  { title: 'Registros exportados', value: '0', description: 'Datos consolidados en reportes', trend: 'Incluye alumnos, matriculas y pagos', icon: BarChart3 },
  { title: 'Reportes esta semana', value: '0', description: 'Documentos generados recientemente', trend: '', icon: PieChart },
]



function ReportesPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [generatedReports, setGeneratedReports] = useState([])
  const [enrollmentsOptions, setEnrollmentsOptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [counts, setCounts] = useState({ totalReports: 0, totalExportedRecords: 0, reportsThisWeek: 0 })
  const [reportForm, setReportForm] = useState({
    tipoReporte: 'comprobante_matricula',
    enrollmentId: '',
    formato: 'pdf',
  })

  useEffect(() => {
    fetchEnrollmentsSimple().then(setEnrollmentsOptions).catch(() => {})
  }, [])

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await fetchReports(searchQuery)
        setGeneratedReports(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [searchQuery])

  useEffect(() => {
    fetchReportCounts().then(setCounts).catch(() => {})
  }, [generatedReports])

  const generateEnrollmentPdf = (data, fileName) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const currency = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
    let y = 40

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Comprobante de matricula y obligaciones de pago', 40, y)
    y += 20

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Fecha de emision: ${new Date().toLocaleDateString('es-EC')}`, 40, y)
    y += 14
    doc.text(`ID matricula: ${data.enrollment.id}`, 40, y)
    y += 10

    const addInfoSection = (title, rows) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(title, 40, y + 12)
      autoTable(doc, {
        startY: y + 18,
        body: rows,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 170, fontStyle: 'bold' },
          1: { cellWidth: 340 },
        },
      })
      y = doc.lastAutoTable.finalY + 12
    }

    addInfoSection('Datos de la matricula', [
      ['Estado', data.enrollment.status],
      ['Fecha de matricula', data.enrollment.date],
      ['Periodo lectivo', `${data.period.name} (${data.period.startDate} - ${data.period.endDate})`],
      ['Curso', data.course.label],
      ['Nivel', data.course.level || '-'],
    ])

    addInfoSection('Datos del estudiante', [
      ['Apellidos y nombres', data.student.fullName],
      ['Cedula', data.student.identification],
      ['Fecha de nacimiento', data.student.birthDate],
      ['Genero', data.student.gender || '-'],
      ['Telefono', data.student.phone || '-'],
      ['Correo', data.student.email || '-'],
      ['Direccion', data.student.address || '-'],
      ['Religion', data.student.religion || '-'],
      ['Escuela de procedencia', data.student.schoolOrigin || '-'],
    ])

    addInfoSection('Datos del representante', [
      ['Nombre', data.representative.fullName],
      ['Cedula', data.representative.identification || '-'],
      ['Parentesco', data.representative.relationship || '-'],
      ['Telefono', data.representative.phone || '-'],
      ['Correo', data.representative.email || '-'],
      ['Direccion', data.representative.address || '-'],
    ])

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Detalle de rubros y pagos', 40, y + 12)
    autoTable(doc, {
      startY: y + 18,
      head: [['Rubro', 'Recibo', 'Fecha limite', 'Fecha pago', 'Estado', 'Monto']],
      body:
        data.rubros.length > 0
          ? data.rubros.map((item) => [
              item.item,
              item.receiptNumber,
              item.dueDate || '-',
              item.paymentDate || '-',
              item.statusLabel,
              currency.format(item.amount),
            ])
          : [['Sin rubros registrados', '-', '-', '-', '-', '-']],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3.5 },
      headStyles: { fillColor: [238, 242, 247], textColor: [24, 24, 24] },
    })
    y = doc.lastAutoTable.finalY + 12

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Total registrado: ${currency.format(data.totals.totalAmount)}`, 40, y)
    y += 14
    doc.text(`Total pendiente por pagar: ${currency.format(data.totals.totalPending)}`, 40, y)
    y += 20

    addInfoSection('Observaciones de la matricula', [['Observaciones', data.enrollment.observations || 'Sin observaciones registradas.']])

    doc.save(fileName)
  }

  const handleGenerateReport = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!reportForm.enrollmentId) {
      setErrorMessage('Debe seleccionar una matrícula para generar el documento.')
      return
    }

    try {
      const data = await fetchEnrollmentDocumentData(reportForm.enrollmentId)
      const safeStudentName = (data.student.fullName || 'estudiante')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      const fileName = `comprobante_matricula_${safeStudentName || 'estudiante'}_${new Date().toISOString().slice(0, 10)}.pdf`

      generateEnrollmentPdf(data, fileName)

      await createReportRecord({
        name: 'Comprobante de matricula y rubros',
        description: `Documento de ${data.student.fullName} - ${data.course.label}`,
        type: 'Matriculas',
        totalRecords: data.rubros.length,
        status: 'completado',
      })

      const refreshedReports = await fetchReports(searchQuery)
      setGeneratedReports(refreshedReports)

      setSuccessMessage('Documento PDF generado y descargado correctamente.')
      setShowForm(false)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <div className="content-stack">
      <section className="metrics-grid metrics-grid-compact" aria-label="Resumen de reportes">
        {[
          { ...reportMetrics[0], value: counts.totalReports.toLocaleString(), trend: `${counts.reportsThisWeek.toLocaleString()} esta semana` },
          { ...reportMetrics[1], value: counts.totalExportedRecords.toLocaleString() },
          { ...reportMetrics[2], value: counts.reportsThisWeek.toLocaleString(), trend: 'Datos reales del sistema' },
        ].map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="students-grid">
        <SectionCard className="students-panel">
          <div className="section-heading students-panel-heading">
            <div>
              <p className="section-kicker">Centro de reportes</p>
              <h3>{showForm ? 'Generar nuevo reporte' : 'Consulta y exportacion'}</h3>
            </div>

            {!showForm && (
              <div className="students-toolbar">
                <div className="search-field module-search-field">
                  <span className="module-search-leading" aria-hidden="true">
                    <Search size={18} />
                  </span>

                  <input
                    type="text"
                    placeholder="Buscar por tipo, fecha o usuario"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Buscar reporte"
                  />

                  <button type="button" className="module-search-action" aria-label="Buscar reporte">
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

                <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
                  Generar reporte
                </button>
              </div>
            )}
          </div>

          {showForm ? (
            <form className="student-form" onSubmit={(event) => event.preventDefault()}>
              <div className="student-form-grid">
                <label className="form-field form-field-full">
                  <span>Tipo de reporte</span>
                  <select
                    value={reportForm.tipoReporte}
                    onChange={(event) => setReportForm((prev) => ({ ...prev, tipoReporte: event.target.value }))}
                  >
                    <option value="comprobante_matricula">Comprobante de matricula y rubros</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>Matrícula del estudiante</span>
                  <select
                    value={reportForm.enrollmentId}
                    onChange={(event) => setReportForm((prev) => ({ ...prev, enrollmentId: event.target.value }))}
                  >
                    <option value="">Seleccione una matrícula</option>
                    {enrollmentsOptions.map((enrollment) => (
                      <option key={enrollment.id} value={enrollment.id}>
                        {enrollment.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Formato de exportacion</span>
                  <select
                    value={reportForm.formato}
                    onChange={(event) => setReportForm((prev) => ({ ...prev, formato: event.target.value }))}
                  >
                    <option value="pdf">PDF</option>
                  </select>
                </label>
              </div>

              {errorMessage && <p className="form-error">{errorMessage}</p>}
              {successMessage && <p style={{ color: '#1f7a4d', marginBottom: '0.8rem', fontWeight: 600 }}>{successMessage}</p>}

              <div className="student-form-actions">
                <button type="button" className="primary-button" onClick={handleGenerateReport}>
                  Generar reporte
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setErrorMessage('')
                    setSuccessMessage('')
                    setShowForm(false)
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : isLoading ? (
            <p>Cargando reportes...</p>
          ) : errorMessage ? (
            <p>{errorMessage}</p>
          ) : (
            <ReportsTable reports={generatedReports} />
          )}
        </SectionCard>

        <div className="students-side-stack">
          <SectionCard className="students-highlight-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Almacenamiento</p>
                <h3>Historial de reportes</h3>
              </div>
            </div>

            <div className="highlight-list">
              <div className="highlight-item">
                <span>Total de reportes generados</span>
                <strong>{counts.totalReports} {counts.totalReports === 1 ? 'reporte' : 'reportes'}</strong>
              </div>
              <div className="highlight-item">
                <span>Reportes esta semana</span>
                <strong>{counts.reportsThisWeek} {counts.reportsThisWeek === 1 ? 'reporte' : 'reportes'}</strong>
              </div>
              <div className="highlight-item">
                <span>Registros exportados total</span>
                <strong>{counts.totalExportedRecords} {counts.totalExportedRecords === 1 ? 'registro' : 'registros'}</strong>
              </div>
              <div className="highlight-item">
                <span>Reportes de matrículas</span>
                <strong>{generatedReports.filter(r => r.type === 'comprobante_matricula').length} {generatedReports.filter(r => r.type === 'comprobante_matricula').length === 1 ? 'archivo' : 'archivos'}</strong>
              </div>
              <div className="highlight-item">
                <span>Último reporte generado</span>
                <strong>{generatedReports[0]?.name || 'Ninguno'}</strong>
              </div>
              <div className="highlight-item">
                <span>Generado por</span>
                <strong>{generatedReports[0]?.generatedBy || '—'}</strong>
              </div>
              <div className="highlight-item">
                <span>Fecha del último reporte</span>
                <strong>{generatedReports[0]?.date || '\u2014'}</strong>
              </div>
            </div>
          </SectionCard>


        </div>
      </section>
    </div>
  )
}

export default ReportesPage

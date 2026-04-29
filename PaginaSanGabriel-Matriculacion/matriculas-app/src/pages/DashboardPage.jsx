import { AlertCircle, BookOpen, School, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import DashboardChart from '../components/dashboard/DashboardChart'
import MetricCard from '../components/dashboard/MetricCard'
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel'
import SectionCard from '../components/ui/SectionCard'
import { fetchDashboardSummary } from '../services/api'

const quickActions = [
  {
    label: 'Registrar alumno',
    detail: 'Accede al modulo de alumnos para iniciar el flujo.',
    targetView: 'alumnos',
  },
  {
    label: 'Registrar representante',
    detail: 'Paso siguiente despues de completar la ficha del alumno.',
    targetView: 'representantes',
  },
  {
    label: 'Generar matricula',
    detail: 'Formaliza la asignacion academica del estudiante.',
    targetView: 'matricula',
  },
  {
    label: 'Registrar rubros',
    detail: 'Permite controlar pagos de inscripcion y otros valores.',
    targetView: 'rubros',
  },
  {
    label: 'Exportar reporte',
    detail: 'Consulta y exportacion administrativa del proceso.',
    targetView: 'reportes',
  },
]

function DashboardPage({ onNavigate }) {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    fetchDashboardSummary().then(setSummary).catch(() => {})
  }, [])

  const s = summary || {}
  const studentCounts = s.studentCounts || { total: 0 }
  const enrollmentCounts = s.enrollmentCounts || { total: 0, pendientes: 0, aprobadas: 0 }
  const totalCursos = s.totalCursos ?? 0
  const chartData = s.chartData || []
  const alerts = s.alerts || []
  const pendingItems = s.pendingItems || []

  const pctAprobadas = enrollmentCounts.total > 0
    ? Math.round((enrollmentCounts.aprobadas * 100) / enrollmentCounts.total)
    : 0
  const pctPendientes = enrollmentCounts.total > 0
    ? Math.round((enrollmentCounts.pendientes * 100) / enrollmentCounts.total)
    : 0

  const metricCards = [
    {
      title: 'Total de alumnos',
      value: studentCounts.total.toLocaleString(),
      description: 'Registro general activo',
      trend: '',
      icon: Users,
    },
    {
      title: 'Total matriculados',
      value: enrollmentCounts.aprobadas.toLocaleString(),
      description: 'Proceso completado',
      trend: `${pctAprobadas}% del total`,
      icon: School,
    },
    {
      title: 'Total pendientes',
      value: enrollmentCounts.pendientes.toLocaleString(),
      description: 'Falta documentacion o pago',
      trend: `${pctPendientes}% por revisar`,
      icon: AlertCircle,
    },
    {
      title: 'Total por curso',
      value: totalCursos.toLocaleString(),
      description: 'Cursos habilitados',
      trend: '',
      icon: BookOpen,
    },
  ]

  return (
    <div className="content-stack">
      <section className="metrics-grid" aria-label="Metricas principales">
        {metricCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="dashboard-main-grid">
        <DashboardChart data={chartData} />
        <AlertsPanel alerts={alerts} />
      </section>

      <section className="dashboard-secondary-grid">
        <QuickActionsPanel actions={quickActions} onNavigate={onNavigate} />

        <SectionCard className="pending-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Seguimiento reciente</p>
              <h3>Casos que requieren atencion</h3>
            </div>
          </div>

          <div className="pending-list">
            {pendingItems.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No hay casos pendientes.</p>
            ) : (
              pendingItems.map((item, idx) => (
                <div key={idx} className="pending-item">
                  <div>
                    <strong>{item.student}</strong>
                    <p>{item.note}</p>
                  </div>
                  <span className="pending-badge">{item.status}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  )
}

export default DashboardPage
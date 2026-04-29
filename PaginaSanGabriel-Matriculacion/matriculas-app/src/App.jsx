import { useEffect, useState } from 'react'
import AppLayout from './app/AppLayout'
import AlumnosPage from './pages/AlumnosPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import MatriculaPage from './pages/MatriculaPage'
import RepresentantesPage from './pages/RepresentantesPage'
import ReportesPage from './pages/ReportesPage'
import RubrosPage from './pages/RubrosPage'
import { supabase } from './services/supabaseClient'

// Menu lateral estatico de maqueta. Mas adelante puede venir desde rutas reales.
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', available: true },
  { id: 'alumnos', label: 'Alumnos', available: true },
  { id: 'representantes', label: 'Representantes', available: true },
  { id: 'matricula', label: 'Matricula', available: true },
  { id: 'rubros', label: 'Rubros / Colecturia', available: true },
  { id: 'reportes', label: 'Reportes', available: true },
]

function App() {
  // Estado local simple para alternar entre las vistas ya disponibles.
  const [activeView, setActiveView] = useState('dashboard')
  const [session, setSession] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !isMounted) {
        setIsCheckingSession(false)
        return
      }

      setSession(data.session)
      setIsCheckingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Configuracion central del header reutilizable por pagina.
  const pageHeaders = {
    dashboard: {
      kicker: 'Dashboard administrativo',
      title: 'Panel general de matriculacion',
      description:
        'Visualiza el estado de alumnos, matriculas pendientes, rubros y alertas desde un solo lugar.',
      statusLabel: 'Estado del sistema',
      statusValue: 'Operativo',
      statusMeta: 'Ultima actualizacion: hoy, 08:45',
    },
    alumnos: {
      kicker: 'Modulo de alumnos',
      title: 'Registro, busqueda y ficha estudiantil',
      description:
        'Gestiona el alumno como entidad principal del flujo de matriculacion antes de pasar a representantes y matricula.',
      statusLabel: 'Estado del modulo',
      statusValue: 'En seguimiento',
      statusMeta: 'Listo para registro y consulta',
    },
    representantes: {
      kicker: 'Modulo de representantes',
      title: 'Datos del representante',
      description:
        'Maqueta visual para registrar la informacion del padre, madre o tutor responsable del estudiante.',
      statusLabel: 'Estado del modulo',
      statusValue: 'Disponible',
      statusMeta: 'Formulario visual listo',
    },
    matricula: {
      kicker: 'Modulo de matricula',
      title: 'Formalizacion academica del estudiante',
      description:
        'Consolida el alumno y su representante, define curso, paralelo, jornada y estado final del proceso de matriculacion.',
      statusLabel: 'Estado del modulo',
      statusValue: 'Operativo',
      statusMeta: 'Registro y consulta habilitados',
    },
    rubros: {
      kicker: 'Modulo de rubros y colecturia',
      title: 'Control de cobros, pagos y saldos',
      description:
        'Administra la emision de rubros, el registro de pagos y el seguimiento de cartera pendiente por alumno y curso.',
      statusLabel: 'Estado del modulo',
      statusValue: 'Disponible',
      statusMeta: 'Cobros y colecturia operativos',
    },
    reportes: {
      kicker: 'Centro de reportes',
      title: 'Generacion, exportacion y archivo',
      description:
        'Consulta, genera y exporta reportes en multiples formatos. Filtra por rango de fechas, curso, estado y campos personalizados.',
      statusLabel: 'Estado del modulo',
      statusValue: 'Operativo',
      statusMeta: 'Exportacion en 5 formatos disponibles',
    },
  }

  const handleNavigate = (viewId) => {
    const target = sidebarItems.find((item) => item.id === viewId)

    if (target?.available) {
      setActiveView(viewId)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setActiveView('dashboard')
  }

  if (isCheckingSession) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h2>Validando sesion...</h2>
          <p className="auth-help">Espere un momento.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  let currentPage = <DashboardPage onNavigate={handleNavigate} />

  if (activeView === 'alumnos') {
    currentPage = <AlumnosPage />
  }

  if (activeView === 'representantes') {
    currentPage = <RepresentantesPage />
  }

  if (activeView === 'matricula') {
    currentPage = <MatriculaPage />
  }

  if (activeView === 'rubros') {
    currentPage = <RubrosPage />
  }

  if (activeView === 'reportes') {
    currentPage = <ReportesPage />
  }

  return (
    <AppLayout
      sidebarItems={sidebarItems}
      activeView={activeView}
      onNavigate={handleNavigate}
      header={pageHeaders[activeView]}
      userEmail={session.user?.email || ''}
      onLogout={handleLogout}
    >
      {currentPage}
    </AppLayout>
  )
}

export default App
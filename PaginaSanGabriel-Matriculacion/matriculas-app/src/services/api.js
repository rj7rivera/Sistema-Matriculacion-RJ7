import { supabase } from './supabaseClient'

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const formatDate = (value) => {
  if (!value) {
    return 'Sin fecha'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const statusToTone = {
  activo: 'is-success',
  aprobada: 'is-success',
  pagado: 'is-success',
  completado: 'is-success',
  pendiente: 'is-warning',
  en_proceso: 'is-warning',
  vencido: 'is-danger',
  inactivo: 'is-neutral',
  anulada: 'is-neutral',
  error: 'is-neutral',
  egresado: 'is-neutral',
}

const statusToLabel = {
  activo: 'Activo',
  aprobada: 'Aprobada',
  pagado: 'Pagado',
  completado: 'Completado',
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  vencido: 'Vencido',
  inactivo: 'Inactivo',
  anulada: 'Anulada',
  error: 'Error',
  egresado: 'Egresado',
}

const getTone = (status) => statusToTone[status] || 'is-neutral'
const getLabel = (status) => statusToLabel[status] || status || 'Sin estado'

const withSearch = (items, search, extractor) => {
  const needle = normalizeText(search.trim())
  if (!needle) {
    return items
  }

  return items.filter((item) => normalizeText(extractor(item)).includes(needle))
}

const unwrapSingle = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null
  }

  return value || null
}

const handleSupabaseError = (error, fallbackMessage = 'Error consultando Supabase') => {
  if (!error) {
    return
  }

  if (error.code === 'PGRST116') {
    throw new Error('No se encontraron datos para esta consulta.')
  }

  throw new Error(error.message || fallbackMessage)
}

const syncOverdueRubros = async () => {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('rubros')
    .update({ estado: 'vencido' })
    .eq('estado', 'pendiente')
    .lt('fecha_limite', today)
    .is('fecha_pago', null)

  handleSupabaseError(error, 'No se pudo actualizar rubros vencidos.')
}

export async function fetchStudents(search = '') {
  const [{ data: studentsData, error: studentsError }, { data: enrollmentData, error: enrollmentError }] =
    await Promise.all([
      supabase
        .from('alumnos')
        .select('id, nombres, apellidos, cedula, fecha_nacimiento, genero, telefono, email, direccion, religion, escuela_procedencia, vive_con_padre, vive_con_madre, estado, created_at, representante:representantes(nombres, apellidos)')
        .order('created_at', { ascending: false }),
      supabase
        .from('matriculas')
        .select('alumno_id, estado, created_at, curso:cursos(nombre, paralelo)')
        .order('created_at', { ascending: false }),
    ])

  handleSupabaseError(studentsError)
  handleSupabaseError(enrollmentError)

  const latestEnrollmentByStudent = new Map()
  for (const row of enrollmentData || []) {
    if (!latestEnrollmentByStudent.has(row.alumno_id)) {
      latestEnrollmentByStudent.set(row.alumno_id, row)
    }
  }

  const mapped = (studentsData || []).map((student) => {
    const representative = unwrapSingle(student.representante)
    const enrollment = latestEnrollmentByStudent.get(student.id)
    const course = unwrapSingle(enrollment?.curso)

    return {
      id: student.id,
      firstName: student.nombres,
      lastName: student.apellidos,
      name: `${student.nombres} ${student.apellidos}`.trim(),
      representative: representative
        ? `${representative.nombres || ''} ${representative.apellidos || ''}`.trim()
        : 'Sin representante',
      identification: student.cedula,
      fechaNacimiento: student.fecha_nacimiento || '',
      genero: student.genero || '',
      telefono: student.telefono || '',
      email: student.email || '',
      direccion: student.direccion || '',
      religion: student.religion || '',
      escuelaProcedencia: student.escuela_procedencia || '',
      vivePadre: student.vive_con_padre || '',
      viveMadre: student.vive_con_madre || '',
      course: course ? `${course.nombre} ${course.paralelo}`.trim() : 'Sin curso',
      status: getLabel(student.estado),
      statusTone: getTone(student.estado),
    }
  })

  return withSearch(
    mapped,
    search,
    (item) => `${item.name} ${item.identification} ${item.course} ${item.representative} ${item.status}`,
  )
}

export async function createStudent(data) {
  const payload = {
    nombres: data.firstName,
    apellidos: data.lastName,
    cedula: data.identification,
    fecha_nacimiento: data.fechaNacimiento || null,
    genero: data.genero || null,
    telefono: data.telefono || null,
    email: data.email || null,
    direccion: data.direccion || null,
    religion: data.religion || null,
    escuela_procedencia: data.escuelaProcedencia || null,
    vive_con_padre: data.vivePadre || null,
    vive_con_madre: data.viveMadre || null,
    estado: 'activo',
  }

  const { data: created, error } = await supabase.from('alumnos').insert(payload).select('id').single()
  if (error?.code === '23505') throw new Error('Ya existe un alumno registrado con esa cédula.')
  handleSupabaseError(error, 'No se pudo crear el alumno.')
  return created
}

export async function updateStudent(id, data) {
  const payload = {
    nombres: data.firstName,
    apellidos: data.lastName,
    cedula: data.identification,
    fecha_nacimiento: data.fechaNacimiento || null,
    genero: data.genero || null,
    telefono: data.telefono || null,
    email: data.email || null,
    direccion: data.direccion || null,
    religion: data.religion || null,
    escuela_procedencia: data.escuelaProcedencia || null,
    vive_con_padre: data.vivePadre || null,
    vive_con_madre: data.viveMadre || null,
  }

  const { data: updated, error } = await supabase.from('alumnos').update(payload).eq('id', id).select('id').single()
  if (error?.code === '23505') throw new Error('Ya existe otro alumno registrado con esa cédula.')
  handleSupabaseError(error, 'No se pudo actualizar el alumno.')
  return updated
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('alumnos').delete().eq('id', id)
  if (error?.code === '23503') {
    throw new Error('No se puede eliminar el alumno porque tiene matrículas o rubros asociados.')
  }

  handleSupabaseError(error, 'No se pudo eliminar el alumno.')
}

export async function fetchRepresentatives(search = '') {
  const { data, error } = await supabase
    .from('representantes')
    .select('id, nombres, apellidos, cedula, telefono, email, direccion, parentesco, estado, alumnos(id, nombres, apellidos, matriculas(created_at, curso:cursos(nombre, paralelo)))')
    .order('created_at', { ascending: false })

  handleSupabaseError(error)

  const mapped = (data || []).map((representative) => {
    const students = representative.alumnos || []
    const firstStudent = students[0]
    const firstEnrollment = firstStudent?.matriculas?.[0]
    const course = unwrapSingle(firstEnrollment?.curso)

    return {
      id: representative.id,
      firstName: representative.nombres,
      lastName: representative.apellidos,
      name: `${representative.nombres} ${representative.apellidos}`.trim(),
      identification: representative.cedula,
      telefono: representative.telefono || '',
      email: representative.email || '',
      direccion: representative.direccion || '',
      parentesco: representative.parentesco || '',
      relatedStudent: firstStudent
        ? `${firstStudent.nombres || ''} ${firstStudent.apellidos || ''}`.trim()
        : 'Sin alumno asignado',
      relatedStudentId: firstStudent?.id || null,
      course: course ? `${course.nombre} ${course.paralelo}`.trim() : 'Sin curso',
      status: getLabel(representative.estado),
      statusTone: getTone(representative.estado),
    }
  })

  return withSearch(
    mapped,
    search,
    (item) => `${item.name} ${item.identification} ${item.relatedStudent} ${item.course} ${item.status}`,
  )
}

export async function fetchEnrollments(search = '') {
  const { data, error } = await supabase
    .from('matriculas')
    .select(
      'id, alumno_id, curso_id, periodo_id, fecha_matricula, estado, alumno:alumnos(nombres, apellidos, representante:representantes(nombres, apellidos)), curso:cursos(nombre, paralelo)',
    )
    .order('created_at', { ascending: false })

  handleSupabaseError(error)

  const mapped = (data || []).map((enrollment) => {
    const student = unwrapSingle(enrollment.alumno)
    const representative = unwrapSingle(student?.representante)
    const course = unwrapSingle(enrollment.curso)

    return {
      id: enrollment.id,
      alumnoId: enrollment.alumno_id,
      cursoId: enrollment.curso_id,
      periodoId: enrollment.periodo_id,
      estadoRaw: enrollment.estado,
      fechaMatriculaRaw: enrollment.fecha_matricula,
      studentName: student ? `${student.nombres || ''} ${student.apellidos || ''}`.trim() : 'Alumno no encontrado',
      representativeName: representative
        ? `${representative.nombres || ''} ${representative.apellidos || ''}`.trim()
        : 'Sin representante',
      course: course ? `${course.nombre} ${course.paralelo}`.trim() : 'Sin curso',
      date: formatDate(enrollment.fecha_matricula),
      status: getLabel(enrollment.estado),
      statusTone: getTone(enrollment.estado),
    }
  })

  return withSearch(
    mapped,
    search,
    (item) => `${item.studentName} ${item.representativeName} ${item.course} ${item.date} ${item.status}`,
  )
}

export async function fetchRubros(search = '') {
  await syncOverdueRubros()

  const { data, error } = await supabase
    .from('rubros')
    .select(
      'id, matricula_id, alumno_id, tipo_rubro_id, periodo_id, numero_recibo, monto, fecha_limite, fecha_pago, estado, observaciones, tipo_rubro:tipo_rubros(nombre), alumno:alumnos(nombres, apellidos), matricula:matriculas(curso:cursos(nombre, paralelo))',
    )
    .order('created_at', { ascending: false })

  handleSupabaseError(error)

  const mapped = (data || []).map((rubro) => {
    const student = unwrapSingle(rubro.alumno)
    const tipoRubro = unwrapSingle(rubro.tipo_rubro)
    const enrollment = unwrapSingle(rubro.matricula)
    const course = unwrapSingle(enrollment?.curso)

    return {
      id: rubro.id,
      matriculaId: rubro.matricula_id,
      alumnoId: rubro.alumno_id,
      tipoRubroId: rubro.tipo_rubro_id,
      periodoId: rubro.periodo_id,
      estadoRaw: rubro.estado,
      montoRaw: String(rubro.monto || 0),
      fechaLimiteRaw: rubro.fecha_limite,
      fechaPagoRaw: rubro.fecha_pago,
      observacionesRaw: rubro.observaciones || '',
      studentName: student ? `${student.nombres || ''} ${student.apellidos || ''}`.trim() : 'Alumno no encontrado',
      course: course ? `${course.nombre} ${course.paralelo}`.trim() : 'Sin curso',
      item: tipoRubro?.nombre || 'Rubro',
      amount: Number(rubro.monto || 0).toFixed(2),
      dueDate: formatDate(rubro.fecha_limite),
      status: getLabel(rubro.estado),
      statusTone: getTone(rubro.estado),
      receiptNumber: rubro.numero_recibo,
    }
  })

  return withSearch(
    mapped,
    search,
    (item) => `${item.studentName} ${item.course} ${item.item} ${item.status} ${item.receiptNumber}`,
  )
}

export async function fetchReports(search = '') {
  const { data, error } = await supabase
    .from('reportes')
    .select('id, nombre, descripcion, tipo, generado_por, total_registros, estado, created_at')
    .order('created_at', { ascending: false })

  handleSupabaseError(error)

  const mapped = (data || []).map((report) => ({
    id: report.id,
    name: report.nombre,
    description: report.descripcion || report.tipo,
    generatedBy: report.generado_por,
    date: formatDate(report.created_at),
    records: String(report.total_registros ?? 0),
    status: getLabel(report.estado),
    statusTone: getTone(report.estado),
  }))

  return withSearch(
    mapped,
    search,
    (item) => `${item.name} ${item.description} ${item.generatedBy} ${item.date} ${item.status}`,
  )
}

export async function fetchReportCounts() {
  const { data, error } = await supabase
    .from('reportes')
    .select('id, total_registros, created_at')

  handleSupabaseError(error)

  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const totalReports = (data || []).length
  const totalExportedRecords = (data || []).reduce(
    (sum, item) => sum + Number(item.total_registros || 0),
    0,
  )
  const reportsThisWeek = (data || []).filter((item) => {
    if (!item.created_at) return false
    const created = new Date(item.created_at)
    return created >= startOfWeek
  }).length

  return {
    totalReports,
    totalExportedRecords,
    reportsThisWeek,
  }
}

export async function createReportRecord({
  name,
  description,
  type = 'Matriculas',
  totalRecords = 0,
  status = 'completado',
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const payload = {
    nombre: name,
    descripcion: description || null,
    tipo: type,
    generado_por: user?.email || 'Usuario autenticado',
    total_registros: Number(totalRecords || 0),
    estado: status,
  }

  const { data, error } = await supabase.from('reportes').insert(payload).select('id').single()
  handleSupabaseError(error, 'No se pudo registrar el reporte generado.')
  return data
}

export async function fetchEnrollmentDocumentData(enrollmentId) {
  const { data, error } = await supabase
    .from('matriculas')
    .select(
      'id, fecha_matricula, estado, observaciones, alumno:alumnos(id, nombres, apellidos, cedula, fecha_nacimiento, genero, telefono, email, direccion, religion, escuela_procedencia, representante:representantes(nombres, apellidos, cedula, parentesco, telefono, email, direccion)), curso:cursos(nombre, paralelo, nivel:niveles(nombre)), periodo:periodos_lectivos(nombre, fecha_inicio, fecha_fin), rubros(id, numero_recibo, monto, fecha_limite, fecha_pago, estado, observaciones, tipo_rubro:tipo_rubros(nombre))',
    )
    .eq('id', enrollmentId)
    .single()

  handleSupabaseError(error, 'No se pudo cargar la informacion de la matricula para el reporte.')

  const alumno = unwrapSingle(data?.alumno)
  const representante = unwrapSingle(alumno?.representante)
  const curso = unwrapSingle(data?.curso)
  const nivel = unwrapSingle(curso?.nivel)
  const periodo = unwrapSingle(data?.periodo)
  const rubros = (data?.rubros || []).map((rubro) => {
    const tipoRubro = unwrapSingle(rubro?.tipo_rubro)
    return {
      id: rubro.id,
      receiptNumber: rubro.numero_recibo,
      amount: Number(rubro.monto || 0),
      dueDate: rubro.fecha_limite,
      paymentDate: rubro.fecha_pago,
      statusRaw: rubro.estado,
      statusLabel: getLabel(rubro.estado),
      item: tipoRubro?.nombre || 'Rubro',
      observations: rubro.observaciones || '',
    }
  })

  const totalAmount = rubros.reduce((sum, item) => sum + item.amount, 0)
  const totalPending = rubros
    .filter((item) => item.statusRaw !== 'pagado')
    .reduce((sum, item) => sum + item.amount, 0)

  return {
    enrollment: {
      id: data.id,
      dateRaw: data.fecha_matricula,
      date: formatDate(data.fecha_matricula),
      statusRaw: data.estado,
      status: getLabel(data.estado),
      observations: data.observaciones || '',
    },
    student: {
      fullName: `${alumno?.nombres || ''} ${alumno?.apellidos || ''}`.trim(),
      firstName: alumno?.nombres || '',
      lastName: alumno?.apellidos || '',
      identification: alumno?.cedula || '',
      birthDate: formatDate(alumno?.fecha_nacimiento),
      gender: alumno?.genero || '',
      phone: alumno?.telefono || '',
      email: alumno?.email || '',
      address: alumno?.direccion || '',
      religion: alumno?.religion || '',
      schoolOrigin: alumno?.escuela_procedencia || '',
    },
    representative: {
      fullName: representante
        ? `${representante.nombres || ''} ${representante.apellidos || ''}`.trim()
        : 'Sin representante asignado',
      identification: representante?.cedula || '',
      relationship: representante?.parentesco || '',
      phone: representante?.telefono || '',
      email: representante?.email || '',
      address: representante?.direccion || '',
    },
    course: {
      level: nivel?.nombre || '',
      name: curso?.nombre || '',
      parallel: curso?.paralelo || '',
      label: curso ? `${curso.nombre || ''} ${curso.paralelo || ''}`.trim() : 'Sin curso',
    },
    period: {
      name: periodo?.nombre || '',
      startDate: formatDate(periodo?.fecha_inicio),
      endDate: formatDate(periodo?.fecha_fin),
    },
    rubros,
    totals: {
      totalAmount,
      totalPending,
    },
  }
}

// ============================================================
// CONTEOS PARA TARJETAS DE MÉTRICAS
// ============================================================

export async function fetchStudentCounts() {
  const [{ count: total }, { count: conRep }, { count: sinRep }] = await Promise.all([
    supabase.from('alumnos').select('*', { count: 'exact', head: true }),
    supabase.from('alumnos').select('*', { count: 'exact', head: true }).not('representante_id', 'is', null),
    supabase.from('alumnos').select('*', { count: 'exact', head: true }).is('representante_id', null),
  ])
  return {
    total: total ?? 0,
    conRepresentante: conRep ?? 0,
    sinRepresentante: sinRep ?? 0,
  }
}

export async function fetchRepresentativeCounts() {
  const [{ count: total }, { count: conTelefono }, { count: sinDatos }] = await Promise.all([
    supabase.from('representantes').select('*', { count: 'exact', head: true }),
    supabase.from('representantes').select('*', { count: 'exact', head: true }).not('telefono', 'is', null),
    supabase.from('representantes').select('*', { count: 'exact', head: true }).is('telefono', null),
  ])
  return {
    total: total ?? 0,
    conTelefono: conTelefono ?? 0,
    sinDatos: sinDatos ?? 0,
  }
}

export async function fetchEnrollmentCounts() {
  const [{ count: total }, { count: pendientes }, { count: aprobadas }] = await Promise.all([
    supabase.from('matriculas').select('*', { count: 'exact', head: true }),
    supabase.from('matriculas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('matriculas').select('*', { count: 'exact', head: true }).eq('estado', 'aprobada'),
  ])
  return {
    total: total ?? 0,
    pendientes: pendientes ?? 0,
    aprobadas: aprobadas ?? 0,
  }
}

export async function fetchRubroCounts() {
  await syncOverdueRubros()

  const [{ count: total }, { count: pagados }, { count: pendientes }] = await Promise.all([
    supabase.from('rubros').select('*', { count: 'exact', head: true }),
    supabase.from('rubros').select('*', { count: 'exact', head: true }).eq('estado', 'pagado'),
    supabase.from('rubros').select('*', { count: 'exact', head: true }).in('estado', ['pendiente', 'vencido']),
  ])
  return {
    total: total ?? 0,
    pagados: pagados ?? 0,
    pendientes: pendientes ?? 0,
  }
}

// ============================================================
// HELPERS PARA SELECTS (listas de opciones desde Supabase)
// ============================================================

export async function fetchCourses() {
  const { data, error } = await supabase
    .from('cursos')
    .select('id, nombre, paralelo')
    .order('nombre')

  handleSupabaseError(error)
  return (data || []).map((c) => ({
    id: c.id,
    label: `${c.nombre} - Paralelo ${c.paralelo}`,
  }))
}

export async function fetchPeriods() {
  const { data, error } = await supabase
    .from('periodos_lectivos')
    .select('id, nombre, activo')
    .order('nombre', { ascending: false })

  handleSupabaseError(error)
  return data || []
}

export async function fetchStudentsSimple() {
  const { data, error } = await supabase
    .from('alumnos')
    .select('id, nombres, apellidos')
    .eq('estado', 'activo')
    .order('apellidos')

  handleSupabaseError(error)
  return (data || []).map((s) => ({
    id: s.id,
    label: `${s.apellidos} ${s.nombres}`.trim(),
  }))
}

export async function fetchTipoRubros() {
  const { data, error } = await supabase
    .from('tipo_rubros')
    .select('id, nombre')
    .eq('activo', true)

  handleSupabaseError(error)
  return data || []
}

export async function fetchEnrollmentsSimple() {
  const { data, error } = await supabase
    .from('matriculas')
    .select('id, alumno_id, periodo_id, alumno:alumnos(nombres, apellidos), curso:cursos(nombre, paralelo)')
    .order('created_at', { ascending: false })

  handleSupabaseError(error)
  return (data || []).map((e) => {
    const student = unwrapSingle(e.alumno)
    const course = unwrapSingle(e.curso)
    return {
      id: e.id,
      alumnoId: e.alumno_id,
      periodoId: e.periodo_id,
      label: `${student ? `${student.apellidos} ${student.nombres}`.trim() : 'Sin alumno'} — ${course ? `${course.nombre} ${course.paralelo}` : 'Sin curso'}`,
    }
  })
}

// ============================================================
// RESUMEN PARA DASHBOARD
// ============================================================

export async function fetchDashboardSummary() {
  const [studentCounts, enrollmentCounts, rubroCounts, coursesData, enrollmentsByCourseRaw, pendingRubrosRaw, pendingEnrollmentsRaw] =
    await Promise.all([
      fetchStudentCounts(),
      fetchEnrollmentCounts(),
      fetchRubroCounts(),
      supabase.from('cursos').select('id, nombre, paralelo').order('nombre'),
      supabase
        .from('matriculas')
        .select('curso:cursos(nombre, paralelo)')
        .eq('estado', 'aprobada'),
      supabase
        .from('rubros')
        .select('id, monto, estado, alumno:alumnos(nombres, apellidos), tipo_rubro:tipo_rubros(nombre), matricula:matriculas(curso:cursos(nombre, paralelo))')
        .in('estado', ['pendiente', 'vencido'])
        .order('fecha_limite', { ascending: true })
        .limit(3),
      supabase
        .from('matriculas')
        .select('id, alumno:alumnos(nombres, apellidos), curso:cursos(nombre, paralelo), estado')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(3),
    ])

  const totalCursos = (coursesData.data || []).length

  // Agrupar matrículas aprobadas por curso para el gráfico
  const courseCountMap = {}
  for (const row of enrollmentsByCourseRaw.data || []) {
    const course = unwrapSingle(row.curso)
    const label = course ? `${course.nombre} ${course.paralelo}`.trim() : 'Sin curso'
    courseCountMap[label] = (courseCountMap[label] || 0) + 1
  }
  const chartData = Object.entries(courseCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }))

  // Alertas dinámicas
  const alerts = []
  if (rubroCounts.pendientes > 0) {
    alerts.push({ title: 'Pagos pendientes', detail: `${rubroCounts.pendientes} rubros con pago pendiente o vencido.`, tone: 'warning' })
  }
  if (enrollmentCounts.pendientes > 0) {
    alerts.push({ title: 'Matrículas pendientes', detail: `${enrollmentCounts.pendientes} matrículas sin aprobar.`, tone: 'danger' })
  }
  if (studentCounts.sinRepresentante > 0) {
    alerts.push({ title: 'Alumnos sin representante', detail: `${studentCounts.sinRepresentante} alumnos no tienen representante asignado.`, tone: 'neutral' })
  }
  if (alerts.length === 0) {
    alerts.push({ title: 'Todo en orden', detail: 'No hay alertas activas en este momento.', tone: 'neutral' })
  }

  // Casos pendientes recientes (rubros vencidos/pendientes primero, luego matrículas pendientes)
  const pendingItems = []
  for (const rubro of pendingRubrosRaw.data || []) {
    const alumno = unwrapSingle(rubro.alumno)
    const tipoRubro = unwrapSingle(rubro.tipo_rubro)
    const matricula = unwrapSingle(rubro.matricula)
    const curso = matricula ? unwrapSingle(matricula.curso) : null
    const studentName = alumno ? `${alumno.nombres} ${alumno.apellidos}`.trim() : 'Sin alumno'
    const cursoLabel = curso ? `${curso.nombre} ${curso.paralelo}`.trim() : ''
    pendingItems.push({
      student: studentName,
      status: rubro.estado === 'vencido' ? 'Pago vencido' : 'Pago pendiente',
      note: `${tipoRubro?.nombre || 'Rubro'} — $${Number(rubro.monto || 0).toFixed(2)}${cursoLabel ? ` — ${cursoLabel}` : ''}`,
    })
  }
  for (const mat of pendingEnrollmentsRaw.data || []) {
    if (pendingItems.length >= 3) break
    const alumno = unwrapSingle(mat.alumno)
    const curso = unwrapSingle(mat.curso)
    pendingItems.push({
      student: alumno ? `${alumno.nombres} ${alumno.apellidos}`.trim() : 'Sin alumno',
      status: 'Matrícula pendiente',
      note: curso ? `${curso.nombre} ${curso.paralelo}`.trim() : 'Sin curso asignado',
    })
  }

  return {
    studentCounts,
    enrollmentCounts,
    rubroCounts,
    totalCursos,
    chartData,
    alerts,
    pendingItems,
  }
}

// ============================================================
// REPRESENTANTES — CREAR / ACTUALIZAR / ELIMINAR
// ============================================================

export async function createRepresentative(data) {
  const payload = {
    nombres: data.firstName,
    apellidos: data.lastName,
    cedula: data.cedula,
    parentesco: data.parentesco,
    telefono: data.telefono || null,
    email: data.email || null,
    direccion: data.direccion || null,
    estado: 'activo',
  }

  const { data: created, error } = await supabase.from('representantes').insert(payload).select('id').single()
  if (error?.code === '23505') throw new Error('Ya existe un representante registrado con esa cédula.')
  handleSupabaseError(error, 'No se pudo crear el representante.')
  return created
}

export async function updateRepresentative(id, data) {
  const payload = {
    nombres: data.firstName,
    apellidos: data.lastName,
    cedula: data.cedula,
    parentesco: data.parentesco,
    telefono: data.telefono || null,
    email: data.email || null,
    direccion: data.direccion || null,
  }

  const { data: updated, error } = await supabase.from('representantes').update(payload).eq('id', id).select('id').single()
  if (error?.code === '23505') throw new Error('Ya existe otro representante registrado con esa cédula.')
  handleSupabaseError(error, 'No se pudo actualizar el representante.')
  return updated
}

export async function deleteRepresentative(id) {
  const { error } = await supabase.from('representantes').delete().eq('id', id)
  if (error?.code === '23503') {
    throw new Error('No se puede eliminar el representante porque tiene alumnos asociados.')
  }

  handleSupabaseError(error, 'No se pudo eliminar el representante.')
}

export async function linkStudentToRepresentative(studentId, representativeId) {
  const { error } = await supabase
    .from('alumnos')
    .update({ representante_id: representativeId })
    .eq('id', studentId)

  handleSupabaseError(error, 'No se pudo vincular el alumno al representante.')
}

// ============================================================
// MATRÍCULAS — CREAR / ACTUALIZAR / ELIMINAR
// ============================================================

export async function createEnrollment(data) {
  const payload = {
    alumno_id: data.alumnoId,
    curso_id: data.cursoId,
    periodo_id: data.periodoId,
    fecha_matricula: data.fechaMatricula || new Date().toISOString().split('T')[0],
    estado: data.estado || 'pendiente',
    observaciones: data.observaciones || null,
  }

  const { data: created, error } = await supabase.from('matriculas').insert(payload).select('id').single()
  handleSupabaseError(error, 'No se pudo crear la matrícula.')
  return created
}

export async function updateEnrollment(id, data) {
  const payload = {
    curso_id: data.cursoId,
    estado: data.estado,
    observaciones: data.observaciones || null,
  }

  const { data: updated, error } = await supabase.from('matriculas').update(payload).eq('id', id).select('id').single()
  handleSupabaseError(error, 'No se pudo actualizar la matrícula.')
  return updated
}

export async function deleteEnrollment(id) {
  const { error } = await supabase.from('matriculas').delete().eq('id', id)
  if (error?.code === '23503') {
    throw new Error('No se puede eliminar la matrícula porque tiene rubros asociados.')
  }

  handleSupabaseError(error, 'No se pudo eliminar la matrícula.')
}

// ============================================================
// RUBROS — CREAR / ACTUALIZAR / ELIMINAR
// ============================================================

export async function createRubro(data) {
  const year = new Date().getFullYear()
  const seq = String(Date.now()).slice(-5)
  const payload = {
    matricula_id: data.matriculaId,
    alumno_id: data.alumnoId,
    tipo_rubro_id: data.tipoRubroId,
    periodo_id: data.periodoId,
    numero_recibo: `REC-${year}-${seq}`,
    monto: parseFloat(data.monto),
    fecha_limite: data.fechaLimite,
    estado: data.estado || 'pendiente',
    observaciones: data.observaciones || null,
  }

  const { data: created, error } = await supabase.from('rubros').insert(payload).select('id').single()
  handleSupabaseError(error, 'No se pudo crear el rubro.')
  return created
}

export async function updateRubro(id, data) {
  const payload = {
    tipo_rubro_id: data.tipoRubroId,
    monto: parseFloat(data.monto),
    fecha_limite: data.fechaLimite,
    estado: data.estado,
    observaciones: data.observaciones || null,
  }

  const { data: updated, error } = await supabase.from('rubros').update(payload).eq('id', id).select('id').single()
  handleSupabaseError(error, 'No se pudo actualizar el rubro.')
  return updated
}

export async function deleteRubro(id) {
  const { error } = await supabase.from('rubros').delete().eq('id', id)
  handleSupabaseError(error, 'No se pudo eliminar el rubro.')
}

export async function markRubroAsPaid(id) {
  const today = new Date().toISOString().split('T')[0]
  const { data: updated, error } = await supabase
    .from('rubros')
    .update({ estado: 'pagado', fecha_pago: today })
    .eq('id', id)
    .select('id')
    .single()

  handleSupabaseError(error, 'No se pudo registrar el pago del rubro.')
  return updated
}

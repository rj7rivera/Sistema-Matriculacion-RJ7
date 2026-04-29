-- ============================================================
-- SCHEMA DE BASE DE DATOS - UNIDAD EDUCATIVA SAN GABRIEL
-- Sistema de Matriculación
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Habilitar extension para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. PERIODOS LECTIVOS
-- ============================================================
CREATE TABLE periodos_lectivos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        VARCHAR(20)  NOT NULL UNIQUE,          -- ej. "2025-2026"
  fecha_inicio  DATE         NOT NULL,
  fecha_fin     DATE         NOT NULL,
  activo        BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT chk_periodo_fechas CHECK (fecha_fin > fecha_inicio)
);

-- Solo puede existir un periodo activo a la vez
CREATE UNIQUE INDEX idx_periodo_activo ON periodos_lectivos (activo)
  WHERE activo = true;


-- ============================================================
-- 2. NIVELES EDUCATIVOS
-- ============================================================
CREATE TABLE niveles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  VARCHAR(60) NOT NULL UNIQUE   -- ej. "Educación Básica", "Bachillerato General Unificado"
);

INSERT INTO niveles (nombre) VALUES
  ('Educación General Básica Elemental'),
  ('Educación General Básica Media'),
  ('Educación General Básica Superior'),
  ('Bachillerato General Unificado');


-- ============================================================
-- 3. CURSOS
-- ============================================================
CREATE TABLE cursos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel_id         UUID        NOT NULL REFERENCES niveles(id) ON DELETE RESTRICT,
  nombre           VARCHAR(60) NOT NULL,    -- ej. "Noveno", "Primero BGU"
  paralelo         CHAR(1)     NOT NULL,    -- "A", "B", "C"
  capacidad_maxima SMALLINT    NOT NULL DEFAULT 35,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_curso_paralelo UNIQUE (nombre, paralelo)
);

CREATE INDEX idx_cursos_nivel ON cursos(nivel_id);


-- ============================================================
-- 4. REPRESENTANTES
-- ============================================================
CREATE TABLE representantes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres     VARCHAR(80)  NOT NULL,
  apellidos   VARCHAR(80)  NOT NULL,
  cedula      VARCHAR(13)  NOT NULL UNIQUE,
  parentesco  VARCHAR(20)  NOT NULL CHECK (parentesco IN ('Padre','Madre','Tutor','Abuelo','Abuela','Hermano','Hermana','Otro')),
  telefono    VARCHAR(15),
  email       VARCHAR(120),
  direccion   TEXT,
  estado      VARCHAR(10)  NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_representantes_cedula ON representantes(cedula);
CREATE INDEX idx_representantes_estado ON representantes(estado);


-- ============================================================
-- 5. ALUMNOS
-- ============================================================
CREATE TABLE alumnos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres           VARCHAR(80)  NOT NULL,
  apellidos         VARCHAR(80)  NOT NULL,
  cedula            VARCHAR(13)  NOT NULL UNIQUE,
  fecha_nacimiento  DATE,
  genero            CHAR(1)      CHECK (genero IN ('M','F')),
  representante_id  UUID         REFERENCES representantes(id) ON DELETE SET NULL,
  estado            VARCHAR(10)  NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','egresado')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_alumnos_cedula           ON alumnos(cedula);
CREATE INDEX idx_alumnos_representante    ON alumnos(representante_id);
CREATE INDEX idx_alumnos_estado           ON alumnos(estado);
CREATE INDEX idx_alumnos_nombres_apellidos ON alumnos(apellidos, nombres);


-- ============================================================
-- 6. MATRICULAS
-- ============================================================
CREATE TABLE matriculas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id       UUID        NOT NULL REFERENCES alumnos(id)           ON DELETE RESTRICT,
  curso_id        UUID        NOT NULL REFERENCES cursos(id)            ON DELETE RESTRICT,
  periodo_id      UUID        NOT NULL REFERENCES periodos_lectivos(id) ON DELETE RESTRICT,
  fecha_matricula DATE        NOT NULL DEFAULT CURRENT_DATE,
  estado          VARCHAR(10) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('aprobada','pendiente','anulada')),
  observaciones   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un alumno solo puede tener una matrícula por periodo
  CONSTRAINT uq_matricula_alumno_periodo UNIQUE (alumno_id, periodo_id)
);

CREATE INDEX idx_matriculas_alumno  ON matriculas(alumno_id);
CREATE INDEX idx_matriculas_curso   ON matriculas(curso_id);
CREATE INDEX idx_matriculas_periodo ON matriculas(periodo_id);
CREATE INDEX idx_matriculas_estado  ON matriculas(estado);


-- ============================================================
-- 7. TIPO DE RUBROS (catálogo)
-- ============================================================
CREATE TABLE tipo_rubros (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(60) NOT NULL UNIQUE,  -- ej. "Matrícula", "Pensión", "Transporte"
  descripcion TEXT,
  activo      BOOLEAN     NOT NULL DEFAULT true
);

INSERT INTO tipo_rubros (nombre, descripcion) VALUES
  ('Matrícula',    'Costo de inscripción del periodo lectivo'),
  ('Pensión',      'Pago mensual de pensión'),
  ('Transporte',   'Servicio de transporte escolar'),
  ('Laboratorio',  'Uso de laboratorio de ciencias o computación'),
  ('Material',     'Materiales didácticos y útiles escolares'),
  ('Otros',        'Cargos adicionales o extraordinarios');


-- ============================================================
-- 8. RUBROS (cobros y pagos)
-- ============================================================
CREATE TABLE rubros (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id   UUID          NOT NULL REFERENCES matriculas(id)       ON DELETE RESTRICT,
  alumno_id      UUID          NOT NULL REFERENCES alumnos(id)          ON DELETE RESTRICT,
  tipo_rubro_id  UUID          NOT NULL REFERENCES tipo_rubros(id)      ON DELETE RESTRICT,
  periodo_id     UUID          NOT NULL REFERENCES periodos_lectivos(id) ON DELETE RESTRICT,
  numero_recibo  VARCHAR(20)   NOT NULL UNIQUE,    -- ej. "REC-2026-00814"
  monto          NUMERIC(8,2)  NOT NULL CHECK (monto > 0),
  fecha_limite   DATE          NOT NULL,
  fecha_pago     DATE,
  estado         VARCHAR(10)   NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pagado','pendiente','vencido')),
  observaciones  TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_rubros_matricula  ON rubros(matricula_id);
CREATE INDEX idx_rubros_alumno     ON rubros(alumno_id);
CREATE INDEX idx_rubros_tipo       ON rubros(tipo_rubro_id);
CREATE INDEX idx_rubros_periodo    ON rubros(periodo_id);
CREATE INDEX idx_rubros_estado     ON rubros(estado);
CREATE INDEX idx_rubros_recibo     ON rubros(numero_recibo);


-- ============================================================
-- 9. REPORTES
-- ============================================================
CREATE TABLE reportes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           VARCHAR(120) NOT NULL,
  descripcion      TEXT,
  tipo             VARCHAR(40)  NOT NULL,           -- ej. "Alumnos", "Matrículas", "Cobros"
  generado_por     TEXT         NOT NULL,           -- nombre del usuario o auth.uid()
  total_registros  INTEGER      NOT NULL DEFAULT 0,
  archivo_url      TEXT,                            -- URL al archivo generado (si aplica)
  estado           VARCHAR(15)  NOT NULL DEFAULT 'completado' CHECK (estado IN ('completado','en_proceso','error')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_reportes_tipo      ON reportes(tipo);
CREATE INDEX idx_reportes_estado    ON reportes(estado);
CREATE INDEX idx_reportes_creado_at ON reportes(created_at DESC);


-- ============================================================
-- TRIGGERS: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_representantes_updated_at
  BEFORE UPDATE ON representantes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_alumnos_updated_at
  BEFORE UPDATE ON alumnos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_matriculas_updated_at
  BEFORE UPDATE ON matriculas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rubros_updated_at
  BEFORE UPDATE ON rubros
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Habilitar en todas las tablas para proteger los datos.
-- Ajustar las políticas según los roles de tu aplicación.
-- ============================================================
ALTER TABLE periodos_lectivos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE representantes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_rubros         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubros              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes            ENABLE ROW LEVEL SECURITY;

-- Política temporal: permite acceso total a usuarios autenticados.
-- IMPORTANTE: reemplazar con políticas por rol antes de producción.
CREATE POLICY "acceso_autenticados" ON periodos_lectivos  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON niveles             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON cursos              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON representantes      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON alumnos             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON matriculas          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON tipo_rubros         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON rubros              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceso_autenticados" ON reportes            FOR ALL TO authenticated USING (true) WITH CHECK (true);

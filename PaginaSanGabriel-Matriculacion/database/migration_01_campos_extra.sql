-- ============================================================
-- MIGRACIÓN 01 — Campos extra en la tabla alumnos
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Agregar columnas de datos personales del alumno que faltaban
ALTER TABLE alumnos
  ADD COLUMN IF NOT EXISTS telefono         VARCHAR(15),
  ADD COLUMN IF NOT EXISTS email            VARCHAR(120),
  ADD COLUMN IF NOT EXISTS direccion        TEXT,
  ADD COLUMN IF NOT EXISTS religion         VARCHAR(60),
  ADD COLUMN IF NOT EXISTS escuela_procedencia TEXT,
  ADD COLUMN IF NOT EXISTS vive_con_padre   VARCHAR(2),   -- 'Si' / 'No'
  ADD COLUMN IF NOT EXISTS vive_con_madre   VARCHAR(2);   -- 'Si' / 'No'


-- ============================================================
-- PERIODO LECTIVO ACTUAL
-- Si la tabla periodos_lectivos está vacía, insertar el periodo
-- 2025-2026 como activo para que aparezca en el módulo de Matrículas.
-- Ajusta las fechas según el calendario real de la institución.
-- ============================================================

INSERT INTO periodos_lectivos (nombre, fecha_inicio, fecha_fin, activo)
VALUES ('2025-2026', '2025-05-01', '2026-02-28', true)
ON CONFLICT (nombre) DO NOTHING;

-- Para agregar el periodo siguiente como inactivo:
-- INSERT INTO periodos_lectivos (nombre, fecha_inicio, fecha_fin, activo)
-- VALUES ('2026-2027', '2026-05-01', '2027-02-28', false)
-- ON CONFLICT (nombre) DO NOTHING;

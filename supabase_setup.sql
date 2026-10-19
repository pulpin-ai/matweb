-- =====================================================================
--  MatWeb - Correcciones en Supabase
--  Ejecuta TODO esto en: Supabase -> SQL Editor -> New query -> Run
-- =====================================================================

-- 1) Arregla el error 42501 (RLS sin política de INSERT) en respuestas_encuestas
--    Opción A (rápida, igual que hiciste en evaluaciones_cursos):
alter table public.respuestas_encuestas disable row level security;

--    Opción B (recomendada, si quieres dejar RLS activo):
--    alter table public.respuestas_encuestas enable row level security;
--    create policy "anon insert respuestas" on public.respuestas_encuestas
--      for insert to anon with check (true);
--    create policy "anon select respuestas" on public.respuestas_encuestas
--      for select to anon using (true);


-- 2) Asegura que la tabla cursos (usada por la FK de respuestas_encuestas)
--    tenga el catálogo. on conflict evita duplicados si ya existe.
insert into public.cursos (codigo, curso) values
  ('EG101', 'COMPRENSIÓN Y ARGUMENTACIÓN'),
  ('EG102', 'PENSAMIENTO RACIONAL Y ÉTICA'),
  ('EG103', 'MATEMÁTICA BÁSICA'),
  ('EG104', 'TALLER DE INNOVACIÓN Y EMPRENDIMIENTO'),
  ('EG105', 'ECOLOGÍA Y DESARROLLO SOSTENIBLE'),
  ('EG108', 'QUÍMICA GENERAL'),
  ('EG111', 'CALCULO DIFERENCIAL'),
  ('EG112', 'FÍSICA I'),
  ('EG114', 'ESTRATEGIAS DE APRENDIZAJE'),
  ('EG119', 'SEGURIDAD Y DEFENSA NACIONAL'),
  ('EG106', 'PRODUCCIÓN DE TEXTOS ACADÉMICOS'),
  ('EG110', 'ESTADÍSTICA'),
  ('EG115', 'DESARROLLO PERSONAL'),
  ('EG116', 'ACTIVIDADES FÍSICAS Y DEPORTES PARA LA SALUD'),
  ('EG117', 'TALLER DE ARTE Y CREATIVIDAD'),
  ('EG118', 'IDENTIDAD Y DIVERSIDAD CULTURAL'),
  ('EG120', 'GEOHISTORIA REGIONAL'),
  ('EG121', 'EQUIDAD DE GÉNERO'),
  ('MAT201', 'LÓGICA MATEMÁTICA'),
  ('SIS202', 'TECNOLOGÍA DE PROCESAMIENTO DE INFORMACIÓN'),
  ('FIS203', 'LABORATORIO DE FÍSICA I'),
  ('MAT204', 'GEOMETRÍA ANALÍTICA'),
  ('MAT205', 'ÁLGEBRA I'),
  ('MAT206', 'CALCULO INTEGRAL'),
  ('FIS207', 'FÍSICA II'),
  ('FIS208', 'LABORATORIO DE FÍSICA II'),
  ('MAT209', 'ÁLGEBRA II'),
  ('MAT210', 'CALCULO VECTORIAL'),
  ('FIS211', 'FÍSICA III'),
  ('FIS212', 'LABORATORIO DE FÍSICA III'),
  ('HUM213', 'INGLÉS BÁSICO'),
  ('HUM214', 'INGLÉS TÉCNICO'),
  ('MAT215', 'ANÁLISIS VECTORIAL'),
  ('MAT216', 'ÁLGEBRA LINEAL I'),
  ('EST217', 'CÁLCULO DE PROBABILIDADES'),
  ('SIS218', 'LENGUAJE DE PROGRAMACIÓN'),
  ('MAT219', 'ECUACIONES DIFERENCIALES ORDINARIAS I'),
  ('MAT220', 'ECUACIONES DIFERENCIALES PARCIALES'),
  ('MAT221', 'ANÁLISIS COMPLEJO I'),
  ('MAT222', 'ANÁLISIS REAL I'),
  ('MAT223', 'ANÁLISIS COMPLEJO II'),
  ('MAT224', 'MÉTODOS NUMÉRICOS I'),
  ('MAT225', 'TOPOLOGÍA I'),
  ('HUM226', 'METODOLOGÍA DE LA INVESTIGACIÓN'),
  ('MAT227', 'GEOMETRÍA DIFERENCIAL I'),
  ('MAT228', 'SEMINARIO DE TESIS'),
  ('MAT229', 'ANÁLISIS FUNCIONAL'),
  ('ADM230', 'GESTIÓN DE PROYECTOS'),
  ('EST301', 'ESTADÍSTICA INFERENCIAL'),
  ('MAT302', 'ÁLGEBRA LINEAL II'),
  ('MAT303', 'OPTIMIZACIÓN LINEAL'),
  ('MAT304', 'ECUACIONES DIFERENCIALES ORDINARIAS II'),
  ('MAT305', 'OPTIMIZACIÓN NO LINEAL'),
  ('MAT306', 'ANÁLISIS REAL II'),
  ('MAT307', 'TOPOLOGÍA II'),
  ('MAT308', 'MÉTODOS NUMÉRICOS II'),
  ('MAT309', 'TEORÍA DE LA MEDIDA E INTEGRACIÓN'),
  ('MAT310', 'DIDÁCTICA DE LA MATEMÁTICA I'),
  ('MAT311', 'VARIEDADES DIFERENCIALES'),
  ('MAT312', 'ÁLGEBRA LINEAL APLICADA'),
  ('MAT313', 'TÓPICOS DE ECUACIONES DIFERENCIALES PARCIALES'),
  ('MAT314', 'GEOMETRÍA DIFERENCIAL II'),
  ('MAT315', 'PRÁCTICAS PRE PROFESIONALES'),
  ('MAT316', 'TRABAJO DE INVESTIGACIÓN'),
  ('MAT317', 'DIDÁCTICA DE LA MATEMÁTICA II'),
  ('MAT318', 'TÓPICOS DE ÁLGEBRA'),
  ('MAT319', 'INTRODUCCIÓN A LOS ELEMENTOS FINITOS'),
  ('MAT320', 'TÓPICOS DE ANÁLISIS FUNCIONAL')
on conflict (codigo) do nothing;


-- 3) Verificación (opcional, para confirmar)
select count(*) as cursos_registrados from public.cursos;

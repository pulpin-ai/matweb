# Mapa del Proyecto — MatWeb (Evaluación Curricular)

Documentación técnica de módulos, funciones y componentes del proyecto.

---

## 1. Estructura de archivos

```
matweb/
├── index.html                      # HTML raíz; monta #root y carga /src/main.jsx
├── vite.config.js                  # Config de Vite (React + React Compiler vía Babel)
├── package.json                    # Dependencias y scripts (dev/build/lint/preview)
├── supabase_setup.sql              # SQL para Supabase (fix RLS + poblar tabla cursos)
├── flujo.md                        # Documentación del flujo de usuario
├── maping.md                       # Este archivo
├── backend.md                      # Doc antigua (app estática previa; desactualizada)
├── borrador.html                   # Borrador antiguo (no usado por el build)
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.jsx                    # Punto de entrada React
    ├── App.jsx                     # Componente raíz: login, estado, flujo
    ├── supabaseClient.js           # Cliente Supabase (usa variables de entorno)
    ├── form/
    │   ├── form.jsx                # Componente EncuestaCurso (tabla de 6 preguntas)
    │   └── preguntas.js            # Texto de las 6 preguntas de percepción
    ├── components/
    │   ├── MenuOpciones.jsx        # Menú de 2 opciones (Encuesta / Fichas)
    │   └── FichasLlenado.jsx       # Lista de enlaces a Sheets/PDF
    ├── utils/
    │   └── validarDocente.js       # Utilidad NO usada actualmente (huérfana)
    ├── assets/
    │   ├── excel.svg               # Ícono Google Sheets
    │   └── pdf.png                 # Ícono PDF
    └── data/
        ├── form.csv                # Asignaciones docente ↔ curso por semestre
        ├── cursos.csv              # Catálogo codigo → nombre de curso
        └── Carga_Académica.csv     # Fichas: enlaces Sheets/PDF por docente
```

---

## 2. Punto de entrada

**`index.html`**
- Define `<div id="root">` y `<title>Encuesta de Percepción</title>`.
- Carga `<script type="module" src="/src/main.jsx">`.

**`src/main.jsx`**
- Importa `React`, `ReactDOM/client` y `App`.
- `ReactDOM.createRoot(document.getElementById('root')).render(<App />)` dentro de `<React.StrictMode>`.

---

## 3. `src/App.jsx` — Componente raíz

Concentra el estado, el parseo de datos y la navegación entre vistas.

### 3.1 Utilidades a nivel de módulo

| Función | Firma | Descripción |
|---------|-------|-------------|
| `normalizar` | `(s = '') => string` | Minúsculas, sin tildes (NFD) y sin espacios repetidos. Se usa para comparar nombres. |
| `leerCSV` | `(texto, columnasEsperadas, nombreArchivo) => string[][]` | Parsea con PapaParse, quita BOM y descarta filas con menos columnas de las esperadas (con `console.warn`). |
| `parsearFormCSV` | `(texto) => Obj[]` | `form.csv` → `{ SEMESTRE, CICLO, codigo, CURSO, DOCENTE }[]`. Filtra sin `DOCENTE`. |
| `parsearCursosCSV` | `(texto) => Record<string,string>` | `cursos.csv` → mapa `{ codigo: curso }`. |
| `parsearCargaCSV` | `(texto) => Obj[]` | `Carga_Académica.csv` → `{ SEMESTRE, CICLO, CURSO, DOCENTE, LINK, PDF }[]`. |
| `claveCurso` | `(c) => string` | Clave única de una asignación: `` `${c.codigo}-${c.SEMESTRE}` ``. |

### 3.2 Datos parseados (constantes de módulo)

- `todasLasAsignaciones` = `parsearFormCSV(csvFormRaw)`.
- `catalogoCursos` = `parsearCursosCSV(csvCursosRaw)`.
- `todasLasFichas` = `parsearCargaCSV(csvCargaRaw)`.

### 3.3 Estado y refs

| Nombre | Tipo | Uso |
|--------|------|-----|
| `nombreDocente` | `string` | Texto del input de login. |
| `docenteActivo` | `string` | Nombre oficial del docente logueado. |
| `iniciado` | `bool` | `false` = login; `true` = dentro del sistema. |
| `vista` | `'menu' \| 'encuesta' \| 'fichas'` | Sección visible tras el login. |
| `cursosPendientes` | `Obj[]` | Asignaciones del docente sin evaluar. |
| `guardando` | `bool` | Deshabilita el botón mientras se guarda. |
| `ipUsuario` | `string` | IP pública (telemetría). |
| `datosEncuestasRef` | `useRef({})` | Respuestas por curso, indexadas por `claveCurso`. Lo llenan los hijos. |
| `guardandoRef` | `useRef(bool)` | Evita doble envío (los `setState` son asíncronos). |

### 3.4 Funciones internas

| Función | Descripción |
|---------|-------------|
| `reiniciarSesion()` | Limpia todo (`iniciado=false`, `vista='menu'`, nombre, docente, pendientes, ref) y vuelve al login. |
| `manejarIniciar(e)` | Login: normaliza, busca coincidencias, resuelve a un docente, consulta Supabase y calcula `cursosPendientes`; entra al menú. |
| `manejarGuardarEncuestas()` | Valida completitud (6 preguntas), arma los registros y hace `upsert` en `respuestas_encuestas`; maneja éxito/error. |

### 3.5 Render (ramas)

1. `!iniciado` → **Login** (form con `#nombreDocente`).
2. `vista === 'menu'` → `<MenuOpciones>`.
3. `vista === 'fichas'` → `<FichasLlenado fichas={fichasDocente}>`.
4. `vista === 'encuesta'` → header + lista de `<EncuestaCurso>` + botón guardar.

`fichasDocente` se calcula filtrando `todasLasFichas` por `DOCENTE === docenteActivo`.

---

## 4. `src/form/form.jsx` — Componente `EncuestaCurso`

Tabla de percepción de **un curso**.

- **Props**: `codigo`, `curso`, `docente`, `ciclo`, `semestre`, `tipoEstudio`, `onChangeRespuestas`.
- **Hooks**: `useId()` (prefijo único para el `name` de los radios), `useState({})` (`respuestas`).
- **`manejarSeleccion(preguntaIndex, valor)`**:
  1. Crea `nuevas = { ...respuestas, [preguntaIndex]: Number(valor) }`.
  2. `setRespuestas(nuevas)`.
  3. Calcula `promedio` (media de las respuestas marcadas).
  4. Llama `onChangeRespuestas?.(nuevas, promedio)` → **notifica al padre**.
- **Render**: `<table>` con una fila por pregunta y 5 columnas de opción (radios 1–5).
  - `name={`${uid}-pregunta-${index}`}` → **grupo de radios único por curso** (evita que dos cursos con el mismo código se pisen).
  - `checked={respuestas[index] === opcion}` (controlado por React).

## 5. `src/form/preguntas.js`

- Exporta `preguntasPercepcion`: array con el texto de las **6 preguntas** de percepción.
- Se comparte entre `form.jsx` (para renderizar) y `App.jsx` (para validar completitud).

---

## 6. `src/components/`

### `MenuOpciones.jsx`
- **Props**: `nombreDocente`, `alSeleccionarOpcion(opcion)`, `alCerrarSesion`.
- Render: cabecera "Bienvenido(a) {nombre}" y 2 tarjetas:
  - **Encuesta** → `alSeleccionarOpcion('encuesta')`.
  - **Fichas de Llenado** → `alSeleccionarOpcion('fichas')`.
- Botón "← Salir / Cambiar de docente" → `alCerrarSesion`.

### `FichasLlenado.jsx`
- **Props**: `fichas` (array), `docente`, `alVolver`.
- Importa `excel.svg` y `pdf.png` de `../assets/`.
- Render: por cada ficha (Semestre, Ciclo, Curso) muestra:
  - Enlace a **Google Sheets** (`ficha.LINK`) o "Sin Sheets".
  - Enlace a **PDF** (`ficha.PDF`) o "Sin PDF".
  - Enlaces con `target="_blank"` y `rel="noopener noreferrer"`.
- Botón "← Volver al Menú" → `alVolver`.
- Si `fichas.length === 0` → mensaje de que no hay fichas.

---

## 7. `src/utils/validarDocente.js`

- Exporta `validarYObtenerCursos(nombreBusqueda, todosLosCursos)`.
- **No se usa** en el proyecto actual (la lógica equivalente está inline en `App.manejarIniciar`). Candidato a eliminar.

---

## 8. `src/supabaseClient.js`

```js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- Credenciales en `.env.local` (variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

---

## 9. Datos (`src/data/`)

| Archivo | Columnas | Contenido aprox. |
|---------|----------|------------------|
| `form.csv` | `SEMESTRE,CICLO,codigo,CURSO,DOCENTE` | ~372 registros; ~144 docentes con nombre (hay filas con `DOCENTE` vacío que se descartan). |
| `cursos.csv` | `codigo,curso` | ~68 cursos. |
| `Carga_Académica.csv` | `SEMESTRE,CICLO,CURSO,DOCENTE,LINK,PDF` | ~372 registros; mismos docentes que `form.csv`. |

- Se importan con sufijo `?raw` (texto) y se parsean con `PapaParse`.

---

## 10. Supabase (backend)

Proyecto: `https://yzxsxqdagpjqvnkbjnok.supabase.co` (key tipo `sb_publishable_...`).

### Tablas usadas por la app

| Objeto | Uso | Columnas destacadas |
|--------|-----|---------------------|
| `respuestas_encuestas` | `SELECT` (login) y `upsert` (guardar) | `docente`, `codigo_curso`, `semestre`, `ciclo`, `puntaje_promedio`, `respuestas` (jsonb), `user_agent`, `ip_registro`. Restricción única: `(docente, codigo_curso, semestre)`. FK: `codigo_curso → cursos(codigo)`. |
| `cursos` | Requerida por la FK (no la consulta la app) | `codigo` (PK), `curso`. |

### Vista (para informes)

```sql
create or replace view promedios_por_curso as
select r.codigo_curso,
       c.curso,
       avg(r.puntaje_promedio)::numeric(3,2) as puntaje_promedio,
       count(*) as total_evaluaciones
from respuestas_encuestas r
left join cursos c on c.codigo = r.codigo_curso
group by r.codigo_curso, c.curso;
```

### `supabase_setup.sql`
- Desactiva RLS en `respuestas_encuestas` (o políticas de `insert`/`select`).
- Inserta el catálogo de `cursos` con `on conflict (codigo) do nothing`.

---

## 11. Flujo de datos resumido

```
CSV (raw) ──PapaParse──► App (constantes)
                             │
   login ─ normalizar ─ búsqueda en form.csv
                             │
                             ▼
              Supabase SELECT respuestas_encuestas
                             │
                 cursosPendientes (estado)
                             │
   EncuestaCurso ─ onChangeRespuestas ─► datosEncuestasRef
                             │
        manejarGuardarEncuestas (valida 6 preguntas)
                             │
              Supabase UPSERT respuestas_encuestas
```

---

## 12. Configuración y build

- **`vite.config.js`**: `react()` + `babel({ presets: [reactCompilerPreset()] })` (React Compiler habilitado).
- **`package.json`** — scripts:
  - `dev`: `vite`
  - `build`: `vite build`
  - `preview`: `vite preview`
  - `lint`: `oxlint`
- **Dependencias clave**: `react`, `react-dom`, `@supabase/supabase-js`, `papaparse`.

---

## 13. Archivos no usados / legacy

- `src/utils/validarDocente.js` — utilidad huérfana.
- `backend.md` — documentación de una versión anterior (app estática con `script.js`/`syllabus.html`); ya no refleja el código actual.
- `borrador.html` — borrador antiguo, no forma parte del build de Vite.

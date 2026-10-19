# Flujo de Usuario — MatWeb (Evaluación Curricular)

Aplicación web (Vite + React 19) para que un **docente** se identifique por su nombre y, luego del login, acceda a un **menú con 2 opciones**: llenar la **Encuesta de Percepción** o revisar sus **Fichas de Llenado** (enlaces a Google Sheets y PDF).

---

## Diagrama general

```
                    ┌──────────────────────┐
                    │   Carga inicial       │
                    │  (App monta, parsea   │
                    │   CSVs, obtiene IP)   │
                    └───────────┬──────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  PANTALLA DE LOGIN    │
                    │  "Nombre del Docente" │
                    └───────────┬──────────┘
                                │  escribe nombre + "Validar e Ingresar"
                                ▼
              ┌───────────────────────────────────┐
              │  Validación del docente           │
              │  1. Busca coincidencias (CSV)     │
              │  2. Resuelve a UN docente         │
              │  3. Consulta Supabase (ya hechas) │
              │  4. Calcula cursos pendientes     │
              └───────────────┬───────────────────┘
                              │ OK (aunque no haya pendientes)
                              ▼
              ┌───────────────────────────────────┐
              │   MENÚ  (MenuOpciones)            │
              │  ┌──────────┐   ┌──────────────┐  │
              │  │ ENCUESTA │   │ FICHAS DE    │  │
              │  │          │   │ LLENADO      │  │
              │  └────┬─────┘   └──────┬───────┘  │
              │       │                │          │
              │       └── Salir / Cambiar docente │
              └───────┼────────────────┼──────────┘
                      │                │
        Opción A ─────┘                └───── Opción B
        (Encuesta)                            (Fichas)
```

---

## Paso 0 — Carga inicial

Al abrir la página:

1. `src/main.jsx` monta `<App />` dentro de `#root` (React StrictMode).
2. `App.jsx` **parsea los 3 CSV** una sola vez al importar los módulos:
   - `form.csv` → asignaciones (docente ↔ curso por semestre).
   - `cursos.csv` → catálogo `codigo → nombre`.
   - `Carga_Académica.csv` → fichas (Sheets/PDF por docente).
3. Un `useEffect` obtiene la **IP pública** (`api.ipify.org`) para telemetría; si falla, usa `"Desconocida"`.
4. Se muestra la **pantalla de login**.

---

## Paso 1 — Login

El usuario escribe su nombre y pulsa **"Validar e Ingresar"** (`manejarIniciar`):

1. **Normaliza** el texto: mayúsculas/minúsculas, quita tildes y espacios repetidos (`normalizar`).
2. Busca **coincidencias parciales** en `form.csv` (`DOCENTE` que incluya el texto).
   - Si no hay ninguna → alerta `No se encontraron cursos asignados a "..."`.
3. **Resuelve a un solo docente**:
   - Si hay un único nombre → ese.
   - Si hay varios → exige coincidencia exacta; si no, alerta `Hay varios docentes... Escriba su nombre completo`.
4. Consulta **Supabase** (`respuestas_encuestas`) para saber qué cursos de ese docente ya fueron evaluados.
5. Calcula los **cursos pendientes** = asignaciones del docente − cursos ya evaluados.
6. **Entra al sistema** y muestra el **MENÚ**.
   - Si no hay pendientes, muestra un aviso pero **igual deja entrar** (para que el docente pueda ver sus Fichas).

> Si falla la consulta a Supabase, se muestra el detalle del error (código/mensaje/`hint`) y no se avanza.

---

## Paso 2 — Menú (2 opciones)

Componente `MenuOpciones`. Muestra "Bienvenido(a) {docente}" y dos tarjetas:

| Opción | Qué hace | Vista resultante |
|--------|----------|------------------|
| **📝 Encuesta** | Realizar la evaluación por curso | `vista = 'encuesta'` |
| **📁 Fichas de Llenado** | Ver Sheets y PDF asignados | `vista = 'fichas'` |

Abajo: botón **"← Salir / Cambiar de docente"** → vuelve al login (`reiniciarSesion`).

---

## Opción A — Encuesta de Percepción

1. Se listan los **cursos pendientes** (`cursosPendientes`), cada uno como un `<EncuestaCurso>`.
2. Por cada curso, se marcan **6 preguntas** (escala 1–5, en radios).
   - Solo puede haber **una** marca por pregunta.
   - Cada curso es un grupo de radios **independiente** (aunque repita código en otro semestre).
3. Al marcar, el hijo **notifica al padre** (`onChangeRespuestas`) con las respuestas y el **promedio**.
4. Pulsar **"Guardar y Finalizar Encuestas"**:
   - **Valida** que las 6 preguntas de **todos** los cursos estén marcadas. Si falta alguna → alerta con la lista de incompletas.
   - Inserta en Supabase con `upsert` (`respuestas_encuestas`, `onConflict: docente,codigo_curso,semestre`).
   - Si OK → alerta de éxito y **reinicia la sesión** (vuelve al login).
   - Si falla → muestra el detalle del error y **conserva las respuestas en pantalla**.
5. Botones de navegación: `← Volver al menú` y `Salir`.

---

## Opción B — Fichas de Llenado

Componente `FichasLlenado`.

1. Se filtran las fichas del docente activo desde `Carga_Académica.csv` (`DOCENTE === docenteActivo`).
2. Se lista cada asignatura con:
   - Semestre y ciclo.
   - Nombre del curso.
   - Ícono **Google Sheets** (si `LINK`) o texto "Sin Sheets".
   - Ícono **PDF** (si `PDF`) o texto "Sin PDF".
3. Cada ícono **abre el enlace en una pestaña nueva** (`target="_blank"` + `rel="noopener noreferrer"`).
4. Botón **"← Volver al Menú"** → regresa al menú.

---

## Salir / cambiar de docente

Desde el menú y desde la encuesta, `Salir` / `Salir / Cambiar de docente` llama a `reiniciarSesion`, que limpia el estado y regresa a la pantalla de login.

---

## Estados de la UI

El componente `App` gobierna la pantalla con 2 estados:

- `iniciado` (booleano): `false` = pantalla de login; `true` = dentro del sistema.
- `vista` (`'menu' | 'encuesta' | 'fichas'`): qué sección se muestra una vez logueado.

| `iniciado` | `vista` | Pantalla |
|:---------:|:-------:|----------|
| `false` | — | Login |
| `true` | `'menu'` | Menú de 2 opciones |
| `true` | `'encuesta'` | Encuesta de Percepción |
| `true` | `'fichas'` | Fichas de Llenado |

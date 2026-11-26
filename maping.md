# Mapa del proyecto MatWeb

## Archivos principales

- `src/App.jsx`: valida el docente usando ambos CSV; filtra encuestas a `2025-II` y controla menú, encuestas y fichas.
- `src/components/EncuestasDocente.jsx`: presenta asignaciones y estado de respuestas.
- `src/components/FichasLlenado.jsx`: presenta enlaces a Sheets y PDFs.
- `src/utils/encuestasApi.js`: consulta el Apps Script por JSONP, normaliza el resultado y mantiene una caché de sesión de dos minutos.
- `src/utils/encuestas.js`: normalización de texto, claves curso/semestre, orden y creación de enlaces de formularios.
- `src/data/form.csv`: asignaciones y enlaces de encuestas; la app solo carga el semestre `2025-II`.
- `src/data/Carga_Académica.csv`: asignaciones y enlaces de las fichas de llenado.
- `apps-script/Code.gs`: consulta las pestañas del archivo de Drive y responde coincidencias con curso, semestre y docente.

## Flujo de encuestas

El navegador envía `docente` y `callback` a la URL configurada en `VITE_SHEET_SCRIPT_URL`. Apps Script busca en el Spreadsheet identificado en `Code.gs`, omite `Hoja 1` y devuelve las respuestas como JSONP. MatWeb convierte los pares curso/semestre en claves para marcar las asignaciones completadas.

La búsqueda espera los encabezados **Nombres y Apellidos** y **Semestre académico** en la primera fila de cada pestaña. El nombre de la pestaña se usa como curso.

## Dependencias

La app usa React, React Router, PapaParse, Vite y Oxlint. La verificación de respuestas usa Google Sheets mediante Apps Script; no requiere un cliente de base de datos.

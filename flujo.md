# Flujo de MatWeb

MatWeb permite que un docente consulte sus formularios de satisfacción y sus fichas de llenado.

## Fuentes de datos

- `src/data/form.csv` contiene las asignaciones y enlaces de encuesta; la app filtra el semestre `2025-II`.
- `src/data/Carga_Académica.csv` contiene las fichas y sus enlaces de Sheets y PDF.
- El archivo de Google Sheets con ID `1JXqGujLtq6P9FitJZXTkAnj4XM1NCnrvtVP1ki2S1ro` permite verificar las respuestas registradas.
- `apps-script/Code.gs` expone una búsqueda de las pestañas de Sheets como una aplicación web de Apps Script. La app consume ese endpoint por JSONP.

## Ingreso y consulta

1. La pantalla de inicio valida el nombre del docente usando los nombres de `form.csv` y `Carga_Académica.csv`, ignorando mayúsculas, tildes y espacios repetidos, y conservando la `ñ`.
2. Si la búsqueda coincide con más de un docente, se muestran opciones para elegir el nombre correcto.
3. El menú ofrece **Encuesta de satisfacción** y **Fichas de llenado**.
4. El apartado de encuestas carga solamente filas del semestre `2025-II` desde `form.csv`.
5. Al abrir encuestas, MatWeb consulta Apps Script con el nombre del docente. El script busca en todas las pestañas menos `Hoja 1` y devuelve curso, semestre y nombre registrado.
6. MatWeb compara curso y semestre con las asignaciones de `2025-II` para mostrar el estado de cada encuesta. El botón **Actualizar estado** vuelve a consultar la hoja.
7. En fichas, MatWeb muestra las asignaciones y enlaces de Sheets y PDF de `Carga_Académica.csv`.

## Configuración del endpoint

La app lee `VITE_SHEET_SCRIPT_URL`. Configura esa variable en `.env.local` durante el desarrollo y en el hosting antes de compilar. Instrucciones de publicación en [`apps-script/README.md`](./apps-script/README.md).

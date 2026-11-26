# Consulta de encuestas en Google Sheets

Este Apps Script consulta el archivo de Drive configurado en `Code.gs`. Busca el nombre del docente en las pestañas que tengan las columnas **Nombres y Apellidos** y **Semestre académico**, y devuelve las coincidencias para que MatWeb marque los cursos completados.

## Publicar el Apps Script

1. Abre o crea un proyecto en [Google Apps Script](https://script.google.com/).
2. Reemplaza el contenido de `Code.gs` con [`Code.gs`](./Code.gs) y guarda.
3. Implementa → **Nueva implementación** → **Aplicación web**.
4. Configura **Ejecutar como: Yo** y concede acceso de lectura al archivo de Sheets a esa cuenta.
5. En **Quién tiene acceso**, selecciona **Cualquier persona**. MatWeb no inicia sesión en Google; si el endpoint exige una cuenta, Google lo redirige a `accounts.google.com` y la consulta JSONP falla.
6. Implementa y copia la URL publicada que termina en `/exec`.

El script usa el ID `1JXqGujLtq6P9FitJZXTkAnj4XM1NCnrvtVP1ki2S1ro` y omite la pestaña `Hoja 1`. Si cambias de archivo, actualiza `ID_SPREADSHEET` en `Code.gs`.

## Conectar MatWeb

En `.env.local`, asigna la URL publicada:

```env
VITE_SHEET_SCRIPT_URL=https://script.google.com/macros/s/ID_DE_IMPLEMENTACION/exec
```

En producción, configura la misma variable en el hosting y vuelve a compilar. Si cambias el código del Apps Script, actualiza la implementación para que la URL publicada use la versión nueva.

## Comprobar la respuesta

Puedes ejecutar `probar()` desde el editor de Apps Script. También puedes abrir el endpoint con una búsqueda:

```text
https://script.google.com/macros/s/ID_DE_IMPLEMENTACION/exec?callback=prueba&docente=otazu
```

La respuesta JSONP tendrá esta forma:

```js
prueba({
  ok: true,
  total: 1,
  respuestas: [
    {
      curso: "Nombre de pestaña",
      semestre: "2025-II",
      docente: "ADELAIDA OTAZU CONZA",
      nombreRegistrado: "ADELAIDA OTAZU CONZA"
    }
  ]
})
```

Cada pestaña debe tener los encabezados en la primera fila y las respuestas desde la segunda. La búsqueda no distingue mayúsculas ni tildes, conserva la `ñ`, y acepta coincidencias parciales.

## Solución de problemas

### La app muestra "No se pudo consultar la hoja de Google"

Abre la URL publicada en el navegador. Si ves una página de Google con:

```text
No se encontró la función de la secuencia de comandos: doGet
```

significa que la **versión desplegada** no contiene `doGet`, aunque el código esté guardado en el editor. Esto ocurre cuando la implementación se creó antes de pegar `Code.gs` o cuando se editó el código sin publicar una versión nueva. Solución:

1. En Apps Script, confirma que el archivo `Code.gs` esté guardado y contenga `function doGet(e)`.
2. **Implementar → Gestionar implementaciones**.
3. Pulsa el lápiz (editar) de la implementación existente.
4. En **Versión**, elige **Nueva versión** y pulsa **Implementar**.
5. Mantén **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**.
6. Recarga la URL `/exec` y verifica que devuelva `prueba({...})`, no HTML.

Si en lugar de eso la URL redirige a `accounts.google.com`, el acceso sigue restringido. Si devuelve `{"ok":false,"error":"..."}`, el problema es el archivo de Sheets o sus permisos, no la publicación.

### La app en producción sigue fallando

`.env.local` solo aplica al servidor de desarrollo. Para producción hay que compilar de nuevo con la URL correcta:

```bash
npm run build
```

y volver a publicar la carpeta `dist`.


## Datos que usa MatWeb

La hoja es la fuente para verificar qué cursos ya tienen respuesta. `src/data/form.csv` proporciona las asignaciones de encuestas de `2025-II`; `src/data/Carga_Académica.csv` proporciona las fichas y sus enlaces de Sheets y PDF.

# Validador de encuestas (Apps Script)

Conecta la app con las respuestas reales de los 64 formularios de Google.

## 1. Pegar el código

Abre el proyecto:

<https://script.google.com/home/projects/176m5VtRiNRgyKzOOFNqddAfF42GHqINE73gIAhxFtxQ1fkTHTitK69OL/edit>

Reemplaza el contenido de `Code.gs` por el archivo [`Code.gs`](./Code.gs) de esta carpeta y guarda.

## 2. Implementar como Web App

1. **Implementar** → **Nueva implementación**.
2. Tipo: **Aplicación web**.
3. **Ejecutar como:** *Yo*.
4. **Quién tiene acceso:** *Cualquier persona*.
5. **Implementar** y autorizar los permisos de Drive/Forms.

Copia la URL que termina en `/exec`.

## 3. Configurar la app

En `.env.local`:

```env
VITE_ENCUESTAS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
```

Reinicia `npm run dev`. En producción, configura la variable en el hosting y vuelve a compilar.

## 4. Probar

Abre en el navegador:

```
https://script.google.com/macros/s/XXXX/exec?callback=test&docente=YENINA%20APAZA%20OCHOA
```

Debe responder algo como:

```js
test({ ok: true, total: 3, respuestas: [ ... ] })
```

Si devuelve `{ ok: false, error: ... }`, revisa los permisos del script sobre los formularios.

## Si no te deja autorizar o implementar

- **El proyecto lo creó otra cuenta y solo tienes acceso de lectura.** En ese caso no puedes implementar ni autorizar. Crea un proyecto nuevo en tu propia cuenta: <https://script.google.com> → **Nuevo proyecto**, pega `Code.gs` y despliega desde ahí. No hace falta usar el proyecto original.
- **La cuenta que ejecuta el script no tiene permiso de edición sobre los formularios.** El script necesita poder abrir los 64 formularios. Si son de otra cuenta, pide que te los compartan con permiso de **edición**.
- **Aparece “Acceso bloqueado” o “Esta app no está verificada”.** Si es tu propio script, entra en **Configuración avanzada** → **Ir a … (no seguro)**. Si es una cuenta institucional, el administrador puede tener bloqueados los permisos de Drive/Forms.
- **El botón “Implementar” está en gris.** Casi siempre significa que no tienes permiso de edición sobre el proyecto.
- Desactiva bloqueadores de ventanas emergentes y prueba en una ventana de incógnito con una sola sesión de Google iniciada.

## Notas

- El script solo ve los formularios a los que la cuenta que lo ejecuta tiene acceso de **edición**. Si algún formulario es de otra cuenta, compártelo con permiso de edición o agrega su id de edición en `IDS_FORMULARIOS`.
- Los ids de `IDS_FORMULARIOS` son los de `/forms/d/<ID>/edit`, **no** los `/d/e/.../viewform` que aparecen en `form.csv`.
- El título del formulario debe empezar con `Encuesta de satisfacción para docentes` y terminar con `· <CURSO>`.
- Las respuestas se cachean 5 minutos. La app usa `?force=1` al pulsar **Actualizar estado**.
- La primera consulta puede tardar 30–60 segundos; después usa el caché.
- El script filtra por `docente` para no enviar todas las respuestas al navegador. La URL `/exec` no debería publicarse fuera de la institución.

/**
 * MatWeb - Validador de encuestas respondidas
 * -------------------------------------------
 * Web App de Apps Script que consulta las respuestas de los formularios de
 * Google y devuelve qué curso/semestre respondió cada docente.
 *
 * Instalación:
 *   1. Pegar este archivo en el proyecto de Apps Script (Code.gs).
 *   2. Implementar -> Nueva implementación -> Aplicación web.
 *   3. Ejecutar como: Yo.
 *      Quién tiene acceso: Cualquier persona.
 *   4. Copiar la URL /exec y ponerla en .env.local como
 *      VITE_ENCUESTAS_SCRIPT_URL.
 *
 * La app llama:
 *   .../exec?callback=cb123&docente=NOMBRE%20DEL%20DOCENTE
 * y recibe:
 *   cb123({ ok: true, respuestas: [{ curso, semestre, docente, timestamp }] })
 */

// Prefijo del título de los formularios que se van a revisar.
const PREFIJO_FORMULARIO = 'Encuesta de satisfacción para docentes';

// Títulos exactos de las preguntas dentro del formulario.
const CAMPO_NOMBRE = 'Nombres y Apellidos';
const CAMPO_SEMESTRE = 'Semestre académico';

// Caché del script (segundos). La app puede saltarla con ?force=1.
const CACHE_SEGUNDOS = 300;
const VERSION_CACHE = 'v1';

// Opcional: si Drive no encuentra los formularios, pega aquí los ids de
// EDICIÓN (los de /forms/d/<ID>/edit, NO los /d/e/.../viewform).
const IDS_FORMULARIOS = [
    // '1AbC...',
];

/**
 * Endpoint del Web App.
 */
function doGet(e) {
    const parametros = (e && e.parameter) || {};
    const callback = sanitizarCallback(parametros.callback);

    try {
        const respuestas = obtenerRespuestas({
            docente: parametros.docente || '',
            forzar: parametros.force === '1'
        });

        return responder(
            {
                ok: true,
                generado: new Date().toISOString(),
                total: respuestas.length,
                respuestas
            },
            callback
        );
    } catch (error) {
        return responder(
            {
                ok: false,
                error: String(error && error.message ? error.message : error)
            },
            callback
        );
    }
}

/**
 * Recorre los formularios y arma la lista de respuestas.
 */
function obtenerRespuestas({ docente, forzar }) {
    const docenteNormalizado = normalizar(docente);
    const cache = CacheService.getScriptCache();
    const claveCache = `${VERSION_CACHE}:${docenteNormalizado || 'todos'}`;

    if (!forzar) {
        const guardado = cache.get(claveCache);
        if (guardado) return JSON.parse(guardado);
    }

    const filas = [];
    const formularios = listarFormularios();

    for (const formulario of formularios) {
        let titulo = '';

        try {
            titulo = formulario.getTitle() || '';
        } catch (error) {
            continue;
        }

        if (titulo.indexOf(PREFIJO_FORMULARIO) !== 0) continue;

        // Título: "Encuesta ... · Comprensión y Argumentación"
        const curso = titulo.split('·').pop().trim();
        if (!curso) continue;

        let respuestas = [];
        try {
            respuestas = formulario.getResponses();
        } catch (error) {
            continue;
        }

        for (const respuesta of respuestas) {
            const valores = {};

            for (const item of respuesta.getItemResponses()) {
                valores[item.getItem().getTitle()] = item.getResponse();
            }

            const nombre = String(valores[CAMPO_NOMBRE] || '').trim();

            if (
                docenteNormalizado &&
                normalizar(nombre) !== docenteNormalizado
            ) {
                continue;
            }

            filas.push({
                curso,
                semestre: String(valores[CAMPO_SEMESTRE] || '').trim(),
                docente: nombre,
                timestamp: respuesta.getTimestamp().toISOString()
            });
        }
    }

    try {
        cache.put(claveCache, JSON.stringify(filas), CACHE_SEGUNDOS);
    } catch (error) {
        // El caché es opcional; si supera el límite de tamaño se ignora.
    }

    return filas;
}

/**
 * Devuelve los formularios de Google a los que el script tiene acceso.
 */
function listarFormularios() {
    if (IDS_FORMULARIOS.length > 0) {
        return IDS_FORMULARIOS.map(function (id) {
            return FormApp.openById(id);
        });
    }

    const vistos = {};
    const archivos = [];

    const agregar = function (iterador) {
        while (iterador.hasNext()) {
            const archivo = iterador.next();
            if (archivo.isTrashed()) continue;

            const id = archivo.getId();
            if (vistos[id]) continue;
            vistos[id] = true;
            archivos.push(archivo);
        }
    };

    agregar(DriveApp.getFilesByType(MimeType.GOOGLE_FORMS));

    try {
        agregar(
            DriveApp.searchFiles(
                "mimeType = 'application/vnd.google-apps.form'"
            )
        );
    } catch (error) {
        // Algunos dominios restringen searchFiles; basta con lo anterior.
    }

    const formularios = [];

    for (const archivo of archivos) {
        try {
            formularios.push(FormApp.openById(archivo.getId()));
        } catch (error) {
            // Sin permiso de edición sobre ese formulario: se omite.
        }
    }

    return formularios;
}

function responder(payload, callback) {
    const json = JSON.stringify(payload);

    if (callback) {
        return ContentService.createTextOutput(`${callback}(${json})`)
            .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(json)
        .setMimeType(ContentService.MimeType.JSON);
}

function sanitizarCallback(callback) {
    return String(callback || '').replace(/[^\w.$]/g, '');
}

function normalizar(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/**
 * Prueba rápida desde el editor de Apps Script.
 * Ejecutar -> ver registros.
 */
function probar() {
    const respuestas = obtenerRespuestas({ docente: '', forzar: true });
    Logger.log('Total de respuestas: ' + respuestas.length);
    Logger.log(JSON.stringify(respuestas.slice(0, 5), null, 2));
}

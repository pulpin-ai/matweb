// Cliente JSONP para el Web App de Apps Script que valida las encuestas.
//
// Apps Script no envía cabeceras CORS, por eso no se puede usar fetch desde el
// navegador. Un <script> normal sí puede cargar la respuesta y ejecutar el
// callback que el script envuelve alrededor del JSON.

import { claveCurso, idFormulario, normalizar } from './encuestas.js';

const URL_SCRIPT = String(import.meta.env.VITE_ENCUESTAS_SCRIPT_URL || '').trim();
const CACHE_KEY = 'matweb:encuestas-completadas';
const CACHE_TTL_MS = 2 * 60 * 1000;
const TIMEOUT_MS = 60000;

export const encuestasConfiguradas = Boolean(URL_SCRIPT);

/**
 * Devuelve un Set con las claves `curso|semestre` que el docente ya respondió.
 * Si no hay URL configurada devuelve null (la app muestra todo como pendiente).
 */
export async function consultarEncuestasCompletadas({
    docente,
    force = false,
    mapaFormularios
} = {}) {
    if (!URL_SCRIPT) return null;

    if (!force) {
        const cache = leerCache(docente);
        if (cache) return cache;
    }

    const payload = await jsonp(URL_SCRIPT, { docente, force });
    const claves = normalizarRespuesta(payload, docente, mapaFormularios);

    guardarCache(docente, claves);
    return claves;
}

function jsonp(url, { docente, force }) {
    return new Promise((resolve, reject) => {
        const callback = `__matwebEncuestas_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;
        const script = document.createElement('script');
        let temporizador = null;

        const limpiar = () => {
            if (temporizador) clearTimeout(temporizador);
            delete window[callback];
            script.remove();
        };

        window[callback] = (respuesta) => {
            limpiar();

            if (respuesta && respuesta.ok === false) {
                reject(
                    new Error(
                        respuesta.error ||
                            'El servicio de encuestas devolvió un error.'
                    )
                );
                return;
            }

            resolve(respuesta);
        };

        script.onerror = () => {
            limpiar();
            reject(new Error('No se pudo contactar el servicio de encuestas.'));
        };

        temporizador = setTimeout(() => {
            limpiar();
            reject(
                new Error(
                    'El servicio de encuestas tardó demasiado en responder.'
                )
            );
        }, TIMEOUT_MS);

        const params = new URLSearchParams({ callback });
        if (docente) params.set('docente', docente);
        if (force) params.set('force', '1');

        script.src = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
        script.async = true;
        document.body.appendChild(script);
    });
}

function normalizarRespuesta(payload, docente, mapaFormularios) {
    const lista = Array.isArray(payload)
        ? payload
        : payload?.respuestas || payload?.data || payload?.claves || [];

    const docenteNormalizado = normalizar(docente);
    const claves = new Set();

    for (const item of lista) {
        // El script también puede devolver ["curso|semestre", ...].
        if (typeof item === 'string') {
            const [curso, semestre] = item.split('|');
            if (curso && semestre) claves.add(claveCurso(curso, semestre));
            continue;
        }

        if (!item || typeof item !== 'object') continue;

        let curso =
            item.curso ||
            item.CURSO ||
            item.formTitulo ||
            item.titulo ||
            '';

        if (!curso) {
            const idCrudo =
                item.formId || item.idFormulario || item.form || '';
            const id = idFormulario(idCrudo) || idCrudo;
            if (id && mapaFormularios) {
                curso = mapaFormularios.get(id) || '';
            }
        }

        if (curso.includes('·')) {
            curso = curso.split('·').pop().trim();
        }

        const semestre =
            item.semestre ||
            item.SEMESTRE ||
            item.semestreAcademico ||
            '';

        const nombre =
            item.docente ||
            item.DOCENTE ||
            item.nombre ||
            item.nombres ||
            '';

        // Si el script no filtró por docente, se filtra aquí.
        if (
            docenteNormalizado &&
            nombre &&
            normalizar(nombre) !== docenteNormalizado
        ) {
            continue;
        }

        if (!curso || !semestre) continue;

        claves.add(claveCurso(curso, semestre));
    }

    return claves;
}

function leerCache(docente) {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);
        if (data.docente !== normalizar(docente)) return null;
        if (Date.now() - data.ts > CACHE_TTL_MS) return null;

        return new Set(data.claves || []);
    } catch {
        return null;
    }
}

function guardarCache(docente, claves) {
    try {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
                docente: normalizar(docente),
                ts: Date.now(),
                claves: [...claves]
            })
        );
    } catch {
        // sessionStorage puede no estar disponible; no es crítico.
    }
}

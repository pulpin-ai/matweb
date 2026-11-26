// Cliente JSONP para el Web App de Apps Script que consulta la hoja de Drive.
// Apps Script no envía cabeceras CORS; el navegador puede cargar este endpoint
// como script y ejecutar la respuesta JSONP.

import { claveCurso, normalizar } from './encuestas.js';

const URL_SCRIPT = String(import.meta.env.VITE_SHEET_SCRIPT_URL || '').trim();
const CACHE_KEY = 'matweb:sheet-encuestas-completadas';
const CACHE_TTL_MS = 2 * 60 * 1000;
const TIMEOUT_MS = 60000;

export const encuestasConfiguradas = Boolean(URL_SCRIPT);

/** Devuelve las claves `curso|semestre` encontradas para el docente en Drive. */
export async function consultarEncuestasCompletadas({
    docente,
    force = false
} = {}) {
    if (!URL_SCRIPT) return null;

    if (!force) {
        const cache = leerCache(docente);
        if (cache) return cache;
    }

    const payload = await jsonp(URL_SCRIPT, { docente, force });
    const claves = normalizarRespuesta(payload);

    guardarCache(docente, claves);
    return claves;
}

function jsonp(url, { docente, force }) {
    return new Promise((resolve, reject) => {
        const callback = `__matwebSheet_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;
        const script = document.createElement('script');
        let temporizador = null;
        let finalizado = false;

        const limpiar = () => {
            if (temporizador) clearTimeout(temporizador);
            delete window[callback];
            script.remove();
        };

        const fallar = (mensaje) => {
            if (finalizado) return;
            finalizado = true;
            limpiar();
            reject(new Error(mensaje));
        };

        window[callback] = (respuesta) => {
            if (finalizado) return;
            finalizado = true;
            limpiar();

            if (respuesta && respuesta.ok === false) {
                reject(
                    new Error(
                        respuesta.error || 'La hoja de Google devolvió un error.'
                    )
                );
                return;
            }

            resolve(respuesta);
        };

        script.onerror = () => {
            fallar(
                'No se pudo cargar el Apps Script. Verifica que su aplicación web permita acceso a cualquier persona.'
            );
        };

        // Si el script carga pero nunca ejecuta el callback, la respuesta no
        // era JSONP (por ejemplo, la página de error de Google porque la
        // implementación publicada no tiene doGet). Evita esperar el timeout.
        script.onload = () => {
            fallar(
                'El endpoint de Apps Script respondió, pero no devolvió JSONP. ' +
                    'Revisa que la implementación publicada incluya la función doGet ' +
                    'y que su acceso sea "Cualquier persona".'
            );
        };

        temporizador = setTimeout(() => {
            fallar('La hoja de Google tardó demasiado en responder.');
        }, TIMEOUT_MS);

        const params = new URLSearchParams({ callback, docente });
        if (force) params.set('force', '1');

        script.src = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
        script.async = true;
        document.body.appendChild(script);
    });
}

function normalizarRespuesta(payload) {
    const lista = Array.isArray(payload)
        ? payload
        : payload?.respuestas || payload?.data || payload?.claves || [];
    const claves = new Set();

    for (const item of lista) {
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
        if (curso.includes('·')) curso = curso.split('·').pop().trim();

        const semestre =
            item.semestre ||
            item.SEMESTRE ||
            item.semestreAcademico ||
            '';

        if (curso && semestre) claves.add(claveCurso(curso, semestre));
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

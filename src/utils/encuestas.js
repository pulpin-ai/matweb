// Utilidades compartidas por la vista de encuestas y el cliente de Apps Script.

// entry.* del campo "Nombres y Apellidos" del Google Form. Es el mismo en los
// 64 formularios, así que se puede prefijar desde la URL.
export const ENTRY_NOMBRE = '1260702358';

// Quita tildes, normaliza mayúsculas y espacios, y conserva la ñ.
export const normalizar = (s = '') =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/n\u0303/g, 'ñ')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

// Clave única de una asignación dentro de un docente: curso + semestre.
export const claveCurso = (curso, semestre) =>
    `${normalizar(curso)}|${String(semestre || '').trim()}`;

// Ordena asignaciones del semestre más reciente al más antiguo y por ciclo ascendente.
export const ordenarPorPeriodo = (a, b) => {
    const semA = String(a?.SEMESTRE || '');
    const semB = String(b?.SEMESTRE || '');
    if (semA !== semB) {
        return semB.localeCompare(semA);
    }

    return String(a?.CICLO || '').localeCompare(String(b?.CICLO || ''), 'es', {
        numeric: true
    });
};

// Extrae el id publicado de una URL /forms/d/e/<id>/viewform.
export const idFormulario = (url = '') => {
    const match = String(url).match(/\/d\/e\/([^/?#]+)/);
    return match ? match[1] : '';
};

// Agrega el nombre del docente al enlace de prellenado del Google Form.
export const construirEnlaceEncuesta = (curso, nombreDocente) => {
    if (!curso?.ENCUESTA) return '';

    try {
        const url = new URL(curso.ENCUESTA);
        url.searchParams.set(`entry.${ENTRY_NOMBRE}`, String(nombreDocente || '').trim());
        return url.toString();
    } catch {
        return curso.ENCUESTA;
    }
};

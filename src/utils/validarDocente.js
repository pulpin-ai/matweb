/**
 * Valida si un nombre de docente existe en la lista de cursos.
 * @param {string} nombreBusqueda 
 * @param {Array} todosLosCursos 
 * @returns {Array} Cursos coincidentes o arreglo vacío
 */
export const validarYObtenerCursos = (nombreBusqueda, todosLosCursos) => {
    const busqueda = nombreBusqueda.trim().toLowerCase();

    if (!busqueda) {
        return [];
    }

    return todosLosCursos.filter(c =>
        c.DOCENTE && c.DOCENTE.toLowerCase().includes(busqueda)
    );
};
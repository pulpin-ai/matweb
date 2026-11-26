function buscarEnTodasLasPestanias() {

  const NOMBRE_A_BUSCAR = 'Buscar nombre'; // <-- Escribe aquí el nombre o apellido a buscar


  // 1. Configuración
  const ID_SPREADSHEET = '1JXqGujLtq6P9FitJZXTkAnj4XM1NCnrvtVP1ki2S1ro';
  const PESTANIA_EXCLUIDA = 'Hoja 1';

  const ss = SpreadsheetApp.openById(ID_SPREADSHEET);
  const hojas = ss.getSheets();

  // Función auxiliar para quitar tildes pero conservar la "ñ"
  const normalizar = (texto) => {
    return texto.toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/n\u0303/g, 'ñ')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const terminoBusqueda = normalizar(NOMBRE_A_BUSCAR);
  const resultados = [];

  // 2. Recorrer las pestañas excluyendo "Hoja 1"
  hojas.forEach(hoja => {
    const nombreCurso = hoja.getName();

    // Excluir "Hoja 1" (ignorando mayúsculas/minúsculas o espacios extra)
    if (nombreCurso.trim().toLowerCase() === PESTANIA_EXCLUIDA.toLowerCase()) {
      return;
    }

    const datos = hoja.getDataRange().getValues();
    if (datos.length < 2) return;

    // Ubicar columnas en esta pestaña (fila 1 = índice 0)
    const encabezados = datos[0].map(h => normalizar(h));
    const colNombres = encabezados.findIndex(h => h.includes('nombres y apellidos'));
    const colSemestre = encabezados.findIndex(h => h.includes('semestre academico'));

    // Verificar que existan ambas columnas antes de leer filas
    if (colNombres === -1 || colSemestre === -1) return;

    // 3. Revisar las filas de respuestas de esta pestaña
    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      const valorNombres = normalizar(fila[colNombres] || '');

      if (valorNombres.includes(terminoBusqueda)) {
        resultados.push({
          curso: nombreCurso,
          semestre: fila[colSemestre],
          nombreRegistrado: fila[colNombres]
        });
      }
    }
  });

  // 4. Mostrar resultados en la consola
  Logger.log(`=== RESULTADOS PARA: "${NOMBRE_A_BUSCAR}" (${resultados.length} encontrados) ===`);

  if (resultados.length === 0) {
    Logger.log('No se encontraron registros que coincidan en ninguna pestaña.');
  } else {
    resultados.forEach((res, idx) => {
      Logger.log(`${idx + 1}. Curso: ${res.curso} | Semestre: ${res.semestre} | (Registrado como: ${res.nombreRegistrado})`);
    });
  }
}

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import MenuOpciones from './components/MenuOpciones.jsx';
import FichasLlenado from './components/FichasLlenado.jsx';
import EncuestasDocente from './components/EncuestasDocente.jsx';
import Layout from './components/Layout.jsx';
import Login from './components/login.jsx';
import {
    consultarEncuestasCompletadas,
    encuestasConfiguradas
} from './utils/encuestasApi.js';
import { normalizar } from './utils/encuestas.js';
import './styles/variables.css';

// Importación RAW de los CSVs
import csvFormRaw from './data/form.csv?raw';
import csvCargaRaw from './data/Carga_Académica.csv?raw';

const SEMESTRE_ENCUESTAS = '2025-II';

// ---------- Utilidades ----------

// Lee un CSV respetando comillas y comas internas. Devuelve filas sin el encabezado.
const leerCSV = (texto, columnasEsperadas, nombreArchivo) => {
    const limpio = texto.replace(/^\uFEFF/, '');
    const { data } = Papa.parse(limpio, { skipEmptyLines: true });

    return data.slice(1).filter((fila, i) => {
        if (fila.length < columnasEsperadas) {
            console.warn(
                `${nombreArchivo}: la fila ${i + 2} tiene ${fila.length} columnas (se esperaban ${columnasEsperadas}). Se omite.`,
                fila
            );
            return false;
        }
        return true;
    });
};

// Encuestas: form.csv (SEMESTRE, CICLO, CURSO, DOCENTE, LINK, PDF, ENCUESTA).
const parsearFormCSV = (texto) =>
    leerCSV(texto, 7, 'form.csv')
        .map(([SEMESTRE, CICLO, CURSO, DOCENTE, LINK, PDF, ENCUESTA]) => ({
            SEMESTRE: SEMESTRE?.trim(),
            CICLO: CICLO?.trim(),
            CURSO: CURSO?.trim(),
            DOCENTE: DOCENTE?.trim(),
            LINK: LINK?.trim(),
            PDF: PDF?.trim(),
            ENCUESTA: ENCUESTA?.trim()
        }))
        .filter(
            (asignacion) =>
                asignacion.DOCENTE &&
                asignacion.SEMESTRE === SEMESTRE_ENCUESTAS
        );

// Fichas: Carga_Académica.csv (SEMESTRE, CICLO, CURSO, DOCENTE, LINK, PDF).
const parsearCargaCSV = (texto) =>
    leerCSV(texto, 6, 'Carga_Académica.csv')
        .map(([SEMESTRE, CICLO, CURSO, DOCENTE, LINK, PDF]) => ({
            SEMESTRE: SEMESTRE?.trim(),
            CICLO: CICLO?.trim(),
            CURSO: CURSO?.trim(),
            DOCENTE: DOCENTE?.trim(),
            LINK: LINK?.trim(),
            PDF: PDF?.trim()
        }))
        .filter((ficha) => ficha.DOCENTE);

// ---------- Índices precalculados ----------

// docenteNormalizado -> { nombre: <texto oficial del CSV> }
const construirIndiceDocentes = (registros) => {
    const indice = new Map();

    for (const registro of registros) {
        const clave = normalizar(registro.DOCENTE);
        if (!indice.has(clave)) {
            indice.set(clave, {
                nombre: registro.DOCENTE
            });
        }
    }

    return indice;
};

// docenteNormalizado -> [registros] (fichas de llenado)
const agruparPorDocente = (registros) => {
    const indice = new Map();

    for (const registro of registros) {
        const clave = normalizar(registro.DOCENTE);
        const lista = indice.get(clave);

        if (lista) lista.push(registro);
        else indice.set(clave, [registro]);
    }

    return indice;
};

const asignacionesEncuesta = parsearFormCSV(csvFormRaw);
const fichas = parsearCargaCSV(csvCargaRaw);
const indiceDocentes = construirIndiceDocentes([
    ...asignacionesEncuesta,
    ...fichas
]);
const indiceEncuestas = agruparPorDocente(asignacionesEncuesta);
const indiceFichas = agruparPorDocente(fichas);

// ---------- Componente ----------

function Contenido() {
    const [nombreDocente, setNombreDocente] = useState('');
    const [docenteActivo, setDocenteActivo] = useState('');
    const [iniciado, setIniciado] = useState(false);
    const [vista, setVista] = useState('menu'); // 'menu' | 'encuesta' | 'fichas'
    const [completadas, setCompletadas] = useState(() => new Set());
    const [estadoVerificacion, setEstadoVerificacion] = useState('idle');
    const [cargando, setCargando] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [sugerenciasDocente, setSugerenciasDocente] = useState([]);

    // Referencia fresca para el listener de historial (evita cierres obsoletos)
    const docenteRef = useRef(docenteActivo);
    // Identificador incremental para ignorar respuestas JSONP obsoletas
    const solicitudEncuestasRef = useRef(0);

    useEffect(() => {
        docenteRef.current = docenteActivo;
    }, [docenteActivo]);

    // Entrada inicial del historial: "login"
    useEffect(() => {
        window.history.replaceState({ pantalla: 'login' }, '');
    }, []);

    const reiniciarSesion = () => {
        solicitudEncuestasRef.current += 1;
        setIniciado(false);
        setVista('menu');
        setNombreDocente('');
        setDocenteActivo('');
        setCompletadas(new Set());
        setEstadoVerificacion('idle');
        setCargando(false);
        setLoginError('');
        setSugerenciasDocente([]);
        window.history.pushState({ pantalla: 'login' }, '');
    };

    const ingresarComoDocente = (entrada) => {
        solicitudEncuestasRef.current += 1;
        setLoginError('');
        setSugerenciasDocente([]);
        setCompletadas(new Set());
        setEstadoVerificacion('idle');
        setCargando(false);
        setDocenteActivo(entrada.nombre);
        setNombreDocente(entrada.nombre);
        setVista('menu');
        setIniciado(true);
        window.history.pushState({ pantalla: 'menu' }, '');
    };

    const manejarCambioNombre = (valor) => {
        setNombreDocente(valor);
        if (loginError) setLoginError('');
        if (sugerenciasDocente.length > 0) setSugerenciasDocente([]);
    };

    const manejarSeleccionSugerencia = (nombreExacto) => {
        const entrada = indiceDocentes.get(normalizar(nombreExacto));
        if (entrada) ingresarComoDocente(entrada);
    };

    // ---- Login: valida el nombre contra ambos CSV ----
    const manejarIniciar = (e) => {
        e.preventDefault();
        const busqueda = normalizar(nombreDocente);

        if (!busqueda) {
            setLoginError('Ingrese el nombre del docente.');
            setSugerenciasDocente([]);
            return;
        }

        // 1) Coincidencia exacta del nombre normalizado: O(1) sobre el índice.
        let entrada = indiceDocentes.get(busqueda);

        // 2) Fallback: búsqueda parcial solo sobre los nombres ÚNICOS.
        if (!entrada) {
            const coincidencias = [];
            for (const [clave, valor] of indiceDocentes) {
                if (clave.includes(busqueda)) coincidencias.push([clave, valor]);
            }

            if (coincidencias.length === 0) {
                setLoginError(
                    `No se encontraron cursos ni fichas para "${nombreDocente.trim()}".`
                );
                setSugerenciasDocente([]);
                return;
            }

            if (coincidencias.length === 1) {
                entrada = coincidencias[0][1];
            } else {
                const exacto = coincidencias.find(([clave]) => clave === busqueda);
                if (exacto) {
                    entrada = exacto[1];
                } else {
                    const nombres = coincidencias
                        .slice(0, 6)
                        .map(([, valor]) => valor.nombre);
                    setSugerenciasDocente(nombres);
                    setLoginError(
                        coincidencias.length > 6
                            ? 'Hay varios docentes con ese nombre. Escriba su nombre completo o seleccione uno:'
                            : 'Hay varios docentes con ese nombre. Seleccione el suyo:'
                    );
                    return;
                }
            }
        }

        ingresarComoDocente(entrada);
    };

    // ---- Al elegir "Encuesta": consulta el Apps Script ----
    const cargarEncuestas = async ({
        registrarHistorial = true,
        docente = docenteActivo,
        force = false
    } = {}) => {
        if (!docente) return;

        const solicitudId = ++solicitudEncuestasRef.current;

        if (registrarHistorial) {
            window.history.pushState({ pantalla: 'encuesta' }, '');
        }

        setVista('encuesta');
        setCargando(true);
        setEstadoVerificacion(encuestasConfiguradas ? 'cargando' : 'sin-configurar');

        try {
            const resultado = await consultarEncuestasCompletadas({
                docente,
                force
            });

            if (solicitudId !== solicitudEncuestasRef.current) return;

            if (resultado) {
                setCompletadas(resultado);
                setEstadoVerificacion('ok');
            } else {
                setCompletadas(new Set());
                setEstadoVerificacion('sin-configurar');
            }
        } catch (error) {
            if (solicitudId !== solicitudEncuestasRef.current) return;
            console.error('Error al consultar las encuestas:', error);
            setCompletadas(new Set());
            setEstadoVerificacion('error');
        } finally {
            if (solicitudId === solicitudEncuestasRef.current) {
                setCargando(false);
            }
        }
    };

    const manejarSeleccionOpcion = (opcion) => {
        if (opcion === 'encuesta') {
            cargarEncuestas();
        } else {
            setVista(opcion);
            window.history.pushState({ pantalla: opcion }, '');
        }
    };

    // ---- Botón atrás del navegador ----
    useEffect(() => {
        const alRetroceder = (evento) => {
            const destino = evento.state?.pantalla ?? 'login';

            // Si la sesión se cerró, atrás NO debe revivirla.
            if (destino !== 'login' && !docenteRef.current) {
                window.history.replaceState({ pantalla: 'login' }, '');
                setIniciado(false);
                setVista('menu');
                return;
            }

            if (destino === 'login') {
                setIniciado(false);
                setVista('menu');
                return;
            }

            setIniciado(true);

            if (destino === 'encuesta') {
                cargarEncuestas({
                    registrarHistorial: false,
                    docente: docenteRef.current
                });
                return;
            }

            setVista(destino === 'fichas' ? 'fichas' : 'menu');
        };

        window.addEventListener('popstate', alRetroceder);
        return () => window.removeEventListener('popstate', alRetroceder);
    }, []);

    // ---------- Vistas ----------

    if (!iniciado) {
        return (
            <Login
                nombreDocente={nombreDocente}
                alCambiarNombre={manejarCambioNombre}
                alEnviar={manejarIniciar}
                error={loginError}
                sugerencias={sugerenciasDocente}
                alSeleccionarSugerencia={manejarSeleccionSugerencia}
            />
        );
    }

    const encuestasDocente =
        indiceEncuestas.get(normalizar(docenteActivo)) ?? [];
    const fichasDocente =
        indiceFichas.get(normalizar(docenteActivo)) ?? [];

    if (vista === 'menu') {
        return (
            <MenuOpciones
                nombreDocente={docenteActivo}
                totalCursosEncuesta={encuestasDocente.length}
                totalFichas={fichasDocente.length}
                alSeleccionarOpcion={manejarSeleccionOpcion}
                alCerrarSesion={reiniciarSesion}
            />
        );
    }

    if (vista === 'fichas') {
        return (
            <FichasLlenado
                fichas={fichasDocente}
                docente={docenteActivo}
                alVolver={() => window.history.back()}
            />
        );
    }

    // vista === 'encuesta'
    return (
        <EncuestasDocente
            cursos={encuestasDocente}
            completadas={completadas}
            docente={docenteActivo}
            estado={estadoVerificacion}
            cargando={cargando}
            alVolver={() => window.history.back()}
            alActualizar={() =>
                cargarEncuestas({ force: true, registrarHistorial: false })
            }
        />
    );
}

// App = Layout (barra superior + pie) envolviendo el contenido
function App() {
    return (
        <Layout>
            <Contenido />
        </Layout>
    );
}

export default App;

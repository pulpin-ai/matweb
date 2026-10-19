import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse'; // npm install papaparse
import EncuestaCurso from './form/form.jsx';
import { preguntasPercepcion, nivelesSatisfaccion } from './form/preguntas.js';
import MenuOpciones from './components/MenuOpciones.jsx';
import FichasLlenado from './components/FichasLlenado.jsx';
import Layout from './components/Layout.jsx';
import Login from './components/login.jsx';
import { supabase } from './supabaseClient';
import './styles/variables.css';
import './styles/encuesta.css';

// 1. Importación RAW de los CSVs
import csvFormRaw from './data/form.csv?raw';
import csvCursosRaw from './data/cursos.csv?raw';
import csvCargaRaw from './data/Carga_Académica.csv?raw';

// ---------- Utilidades ----------

// Quita tildes, mayúsculas y espacios repetidos
const normalizar = (s = '') =>
    s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();

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

const parsearFormCSV = (texto) =>
    leerCSV(texto, 5, 'form.csv')
        .map(([SEMESTRE, CICLO, codigo, CURSO, DOCENTE]) => ({
            SEMESTRE: SEMESTRE?.trim(),
            CICLO: CICLO?.trim(),
            codigo: codigo?.trim(),
            CURSO: CURSO?.trim(),
            DOCENTE: DOCENTE?.trim(),
            // 🚀 AQUÍ PRE-CALCULAS LA NORMALIZACIÓN UNA SOLA VEZ AL ARRANCAR:
            docenteNormalizado: normalizar(DOCENTE || '')
        }))
        .filter(a => a.DOCENTE);

// cursos.csv (Catálogo general)
const parsearCursosCSV = (texto) => {
    const catalogo = {};
    leerCSV(texto, 2, 'cursos.csv').forEach(([codigo, curso]) => {
        if (codigo?.trim()) catalogo[codigo.trim()] = curso?.trim();
    });
    return catalogo;
};

// Carga_Académica.csv (fichas: enlaces a Sheets y PDF por docente)
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
        .filter(f => f.DOCENTE);

// ---------- Índices precalculados ----------
// Se construyen UNA sola vez al cargar el módulo para no recorrer ni
// normalizar todo el CSV en cada búsqueda (login / cursos pendientes).

// docenteNormalizado -> { nombre: <texto oficial del CSV>, cursos: [asignaciones] }
const construirIndiceDocentes = (asignaciones) => {
    const indice = new Map();
    for (const asignacion of asignaciones) {
        const clave = normalizar(asignacion.DOCENTE);
        const entrada = indice.get(clave);
        if (entrada) {
            entrada.cursos.push(asignacion);
        } else {
            indice.set(clave, { nombre: asignacion.DOCENTE, cursos: [asignacion] });
        }
    }
    return indice;
};

// docente (texto exacto del CSV) -> [registros]
const agruparPorDocente = (registros) => {
    const indice = new Map();
    for (const registro of registros) {
        const lista = indice.get(registro.DOCENTE);
        if (lista) lista.push(registro);
        else indice.set(registro.DOCENTE, [registro]);
    }
    return indice;
};

const catalogoCursos = parsearCursosCSV(csvCursosRaw);
const indiceDocentes = construirIndiceDocentes(parsearFormCSV(csvFormRaw));
const indiceFichas = agruparPorDocente(parsearCargaCSV(csvCargaRaw));

const claveCurso = (c) => `${c.codigo}-${c.SEMESTRE}`;

// ---------- Componente ----------

function Contenido() {
    const [nombreDocente, setNombreDocente] = useState('');
    const [docenteActivo, setDocenteActivo] = useState('');
    const [iniciado, setIniciado] = useState(false);
    const [vista, setVista] = useState('menu'); // 'menu' | 'encuesta' | 'fichas'
    const [cursosPendientes, setCursosPendientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [ipUsuario, setIpUsuario] = useState('');

    const datosEncuestasRef = useRef({});
    const guardandoRef = useRef(false); // evita doble envío (setState es asíncrono)

    // Referencias frescas para el listener de historial (evita cierres obsoletos)
    const docenteRef = useRef(docenteActivo);
    const cursosPendientesRef = useRef(cursosPendientes);

    useEffect(() => { docenteRef.current = docenteActivo; }, [docenteActivo]);
    useEffect(() => { cursosPendientesRef.current = cursosPendientes; }, [cursosPendientes]);

    // Entrada inicial del historial: "login"
    useEffect(() => {
        window.history.replaceState({ pantalla: 'login' }, '');
    }, []);

    // Capturar IP para la telemetría
    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setIpUsuario(data.ip))
            .catch(() => setIpUsuario('Desconocida'));
    }, []);

    const reiniciarSesion = () => {
        setIniciado(false);
        setVista('menu');
        setNombreDocente('');
        setDocenteActivo('');
        setCursosPendientes([]);
        datosEncuestasRef.current = {};
        window.history.pushState({ pantalla: 'login' }, '');
    };

    // ---- Login: solo valida contra el CSV. NO toca Supabase. ----
    const manejarIniciar = (e) => {
        e.preventDefault();
        const busqueda = normalizar(nombreDocente);

        if (!busqueda) {
            alert('Ingrese el nombre del docente.');
            return;
        }

        // 1) Coincidencia exacta del nombre normalizado: O(1) sobre el índice.
        let entrada = indiceDocentes.get(busqueda);

        // 2) Fallback: búsqueda parcial solo sobre los nombres ÚNICOS (~145),
        //    no sobre las 372 filas del CSV, y sin re-normalizar en cada paso.
        if (!entrada) {
            const coincidencias = [];
            for (const [clave, valor] of indiceDocentes) {
                if (clave.includes(busqueda)) coincidencias.push([clave, valor]);
            }

            if (coincidencias.length === 0) {
                alert(`No se encontraron cursos asignados a "${nombreDocente}".`);
                return;
            }

            if (coincidencias.length === 1) {
                entrada = coincidencias[0][1];
            } else {
                const exacto = coincidencias.find(([clave]) => clave === busqueda);
                if (exacto) {
                    entrada = exacto[1];
                } else {
                    alert('Hay varios docentes con ese nombre. Escriba su nombre completo.');
                    return;
                }
            }
        }

        datosEncuestasRef.current = {};
        setCursosPendientes([]);
        setDocenteActivo(entrada.nombre);
        setVista('menu');
        setIniciado(true); // → muestra el menú
        window.history.pushState({ pantalla: 'menu' }, '');
    };

    // ---- Al elegir "Encuesta": consulta Supabase y calcula pendientes ----
    const cargarPendientes = async ({ desdeHistorial = false, docente = docenteActivo } = {}) => {
        setCargando(true);
        try {
            const { data: evaluados, error } = await supabase
                .from('respuestas_encuestas')
                .select('codigo_curso, semestre')
                .eq('docente', docente);

            if (error) throw error;

            const clavesEvaluadas = new Set(
                evaluados.map(e => `${e.codigo_curso}-${e.semestre}`)
            );

            // O(k): recorremos solo los cursos de este docente, no las 372 filas.
            const cursosDocente = indiceDocentes.get(normalizar(docente))?.cursos ?? [];
            const pendientes = cursosDocente.filter(
                c => !clavesEvaluadas.has(claveCurso(c))
            );

            datosEncuestasRef.current = {}; // los formularios se montan en blanco
            setCursosPendientes(pendientes);
            setVista('encuesta');

            if (!desdeHistorial) {
                window.history.pushState({ pantalla: 'encuesta' }, '');
            }
        } catch (err) {
            console.error('Error al consultar Supabase:', err);
            alert(`Error al verificar registros en la base de datos: ${err.message || err.details || 'Error de conexión'}`);
            // Se queda en el menú; las Fichas siguen disponibles.
        } finally {
            setCargando(false);
        }
    };

    const manejarSeleccionOpcion = (opcion) => {
        if (opcion === 'encuesta') {
            cargarPendientes();
        } else {
            setVista(opcion);
            window.history.pushState({ pantalla: opcion }, '');
        }
    };

    // ---- Botón atrás del navegador: vuelve a la pantalla anterior ----
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

            // Al volver a "encuesta" (p. ej. con el botón adelante) recargamos
            // los pendientes si no están en memoria.
            if (destino === 'encuesta' && cursosPendientesRef.current.length === 0) {
                cargarPendientes({ desdeHistorial: true, docente: docenteRef.current });
                return;
            }

            setVista(destino === 'fichas' ? 'fichas' : 'menu');
        };

        window.addEventListener('popstate', alRetroceder);
        return () => window.removeEventListener('popstate', alRetroceder);
    }, []);

    const manejarGuardarEncuestas = async () => {
        if (guardandoRef.current) return;

        // Validar que TODAS las encuestas estén completas antes de insertar
        const incompletas = cursosPendientes.filter(item => {
            const info = datosEncuestasRef.current[claveCurso(item)];
            return (
                !info ||
                !info.respuestas ||
                Object.keys(info.respuestas).length < preguntasPercepcion.length ||
                !(info.promedio > 0)
            );
        });

        if (incompletas.length > 0) {
            const lista = incompletas
                .map(c => `• ${c.codigo} - ${catalogoCursos[c.codigo] || c.CURSO}`)
                .join('\n');
            alert(`Faltan encuestas por completar:\n\n${lista}`);
            return;
        }

        guardandoRef.current = true;
        setGuardando(true);

        try {
            const userAgent = navigator.userAgent;

            // La fecha/hora NO se envía: la genera la base de datos (DEFAULT now()).
            const registrosParaInsertar = cursosPendientes.map(item => {
                const info = datosEncuestasRef.current[claveCurso(item)];
                return {
                    docente: item.DOCENTE,
                    codigo_curso: item.codigo,
                    semestre: item.SEMESTRE,
                    ciclo: item.CICLO,
                    puntaje_promedio: info.promedio,
                    respuestas: info.respuestas,
                    user_agent: userAgent,
                    ip_registro: ipUsuario
                };
            });

            // Requiere UNIQUE (docente, codigo_curso, semestre) en la tabla.
            const { error } = await supabase
                .from('respuestas_encuestas')
                .upsert(registrosParaInsertar, {
                    onConflict: 'docente,codigo_curso,semestre',
                    ignoreDuplicates: true
                });

            if (error) throw error;

            alert('¡Encuestas registradas exitosamente!');
            reiniciarSesion();

        } catch (error) {
            console.error('Error al guardar:', error);

            const detalle = [
                error.code && `código ${error.code}`,
                error.message,
                error.hint
            ].filter(Boolean).join(' · ');

            alert(
                'Ocurrió un problema al guardar los resultados.\n\n' +
                (detalle || 'Error de conexión') +
                '\n\nSus respuestas siguen en pantalla; intente nuevamente.'
            );
        } finally {
            guardandoRef.current = false;
            setGuardando(false);
        }
    };

    // ---------- Vistas ----------

    if (!iniciado) {
        return (
            <Login
                nombreDocente={nombreDocente}
                alCambiarNombre={setNombreDocente}
                alEnviar={manejarIniciar}
            />
        );
    }

    if (vista === 'menu') {
        return (
            <>
                <MenuOpciones
                    nombreDocente={docenteActivo}
                    alSeleccionarOpcion={manejarSeleccionOpcion}
                    alCerrarSesion={reiniciarSesion}
                />
                {cargando && (
                    <p className="app-cargando">Cargando encuestas...</p>
                )}
            </>
        );
    }

    if (vista === 'fichas') {
        const fichasDocente = indiceFichas.get(docenteActivo) ?? [];
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
        <div className="encuesta-pagina">
            <header className="encuesta-pagina__cabecera">
                <div className="encuesta-pagina__encabezado">
                    <div className="encuesta-pagina__presentacion">
                        <h2 className="encuesta-pagina__titulo">Encuesta de Percepción Docente</h2>
                        <p className="encuesta-pagina__meta"><strong>Docente:</strong> {docenteActivo}</p>
                        <p className="encuesta-pagina__meta"><strong>Cursos pendientes por evaluar:</strong> {cursosPendientes.length}</p>
                    </div>

                    <ul className="escala" aria-label="Niveles de satisfacción">
                        {nivelesSatisfaccion.map((nivel) => (
                            <li className="escala__item" key={nivel.valor}>
                                <span className={`escala__valor escala__valor--${nivel.valor}`}>
                                    {nivel.valor}
                                </span>
                                <span className="escala__nombre">{nivel.nombre}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="encuesta-pagina__acciones">
                    <button type="button" className="btn btn--secundario" onClick={() => window.history.back()}>
                        ← Volver al menú
                    </button>
                    <button type="button" className="btn btn--peligro" onClick={reiniciarSesion}>
                        Salir
                    </button>
                </div>
            </header>

            {cursosPendientes.length === 0 ? (
                <p className="encuesta-pagina__vacio">Ya completaste todas tus encuestas. Puedes revisar tus <strong>Fichas de Llenado</strong> en el menú.</p>
            ) : (
                <>
                    {cursosPendientes.map((item) => (
                        <EncuestaCurso
                            key={claveCurso(item)}
                            codigo={item.codigo}
                            curso={catalogoCursos[item.codigo] || item.CURSO}
                            docente={item.DOCENTE}
                            ciclo={item.CICLO}
                            semestre={item.SEMESTRE}
                            onChangeRespuestas={(respuestas, promedio) => {
                                datosEncuestasRef.current[claveCurso(item)] = {
                                    respuestas,
                                    promedio
                                };
                            }}
                        />
                    ))}

                    <button
                        type="button"
                        className="btn btn--primario encuesta-pagina__guardar"
                        onClick={manejarGuardarEncuestas}
                        disabled={guardando}
                    >
                        {guardando ? 'Registrando en base de datos...' : 'Guardar y Finalizar Encuestas'}
                    </button>
                </>
            )}
        </div>
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

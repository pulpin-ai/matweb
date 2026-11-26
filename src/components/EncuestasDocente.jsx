import React, { useState, useEffect, useRef } from 'react';
import '../styles/variables.css';
import '../styles/fichas.css';
import '../styles/encuestas.css';
import {
    claveCurso,
    construirEnlaceEncuesta,
    ordenarPorPeriodo
} from '../utils/encuestas.js';

function IconoFlechaExterna() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="encuesta-icono"
            aria-hidden="true"
        >
            <path d="M7 17L17 7" />
            <path d="M8 7h9v9" />
        </svg>
    );
}

function EncuestasDocente({
    cursos,
    completadas,
    docente,
    estado,
    cargando,
    alVolver,
    alActualizar
}) {
    const [filtro, setFiltro] = useState('todas'); // 'todas' | 'pendientes' | 'completadas'
    const esperandoRetornoRef = useRef(false);

    useEffect(() => {
        const alRecuperarFoco = () => {
            if (!esperandoRetornoRef.current || cargando) return;
            esperandoRetornoRef.current = false;
            alActualizar();
        };

        window.addEventListener('focus', alRecuperarFoco);
        return () => window.removeEventListener('focus', alRecuperarFoco);
    }, [alActualizar, cargando]);

    const cursosOrdenados = [...cursos].sort(ordenarPorPeriodo);
    const total = cursos.length;

    const estaCompletada = (curso) =>
        estado === 'ok' &&
        completadas.has(claveCurso(curso.CURSO, curso.SEMESTRE));

    const totalCompletadas =
        estado === 'ok'
            ? cursos.filter((curso) => estaCompletada(curso)).length
            : 0;

    const totalPendientes =
        estado === 'ok' ? total - totalCompletadas : null;

    const porcentaje =
        estado === 'ok' && total > 0
            ? Math.round((totalCompletadas / total) * 100)
            : 0;

    const cursosFiltrados =
        estado !== 'ok' || filtro === 'todas'
            ? cursosOrdenados
            : cursosOrdenados.filter((curso) =>
                  filtro === 'completadas'
                      ? estaCompletada(curso)
                      : !estaCompletada(curso)
              );

    return (
        <div className="fichas encuestas">
            <header className="fichas__cabecera">
                <div className="fichas__encabezado-info">
                    <h2 className="fichas__titulo">Encuesta de satisfacción</h2>

                    <p className="fichas__descripcion">
                        Responda el formulario de Google de cada curso
                    </p>
                </div>

                <div className="fichas__resumen">
                    <p className="fichas__meta">
                        <strong>Docente:</strong> {docente}
                    </p>

                    <p className="fichas__meta encuestas__conteo">
                        <strong>Cursos:</strong> {total}

                        {estado === 'ok' && (
                            <>
                                {' · '}
                                <strong>Pendientes:</strong> {totalPendientes}
                                {' · '}
                                <strong>Completadas:</strong> {totalCompletadas}
                            </>
                        )}
                    </p>
                </div>

                <div className="encuestas__acciones">
                    <button
                        type="button"
                        className="fichas__volver"
                        onClick={alActualizar}
                        disabled={cargando}
                    >
                        {cargando ? 'Actualizando...' : 'Actualizar estado'}
                    </button>

                    <button
                        type="button"
                        className="fichas__volver"
                        onClick={alVolver}
                    >
                        <span aria-hidden="true">←</span>
                        Volver al menú
                    </button>
                </div>
            </header>

            {estado === 'ok' && total > 0 && (
                <section
                    className="encuestas__barra-estado"
                    aria-label="Progreso y filtros de encuestas"
                >
                    <div className="encuestas__progreso">
                        <div className="encuestas__progreso-texto">
                            <span>Progreso</span>
                            <span className="encuestas__progreso-cifra">
                                {totalCompletadas} de {total} ({porcentaje}%)
                            </span>
                        </div>
                        <div
                            className="encuestas__progreso-pista"
                            role="progressbar"
                            aria-valuenow={porcentaje}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            <div
                                className="encuestas__progreso-relleno"
                                style={{ width: `${porcentaje}%` }}
                            />
                        </div>
                    </div>

                    <div className="encuestas__filtros" role="group" aria-label="Filtrar cursos">
                        {[
                            { id: 'todas', etiqueta: `Todas (${total})` },
                            { id: 'pendientes', etiqueta: `Pendientes (${totalPendientes})` },
                            { id: 'completadas', etiqueta: `Completadas (${totalCompletadas})` }
                        ].map((opcion) => (
                            <button
                                key={opcion.id}
                                type="button"
                                className={`encuestas__filtro ${
                                    filtro === opcion.id
                                        ? 'encuestas__filtro--activo'
                                        : ''
                                }`}
                                onClick={() => setFiltro(opcion.id)}
                                aria-pressed={filtro === opcion.id}
                            >
                                {opcion.etiqueta}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {estado === 'ok' && total > 0 && totalPendientes === 0 && (
                <p className="encuestas__aviso encuestas__aviso--exito">
                    Todas las encuestas asignadas fueron completadas.
                </p>
            )}

            {estado === 'error' && (
                <p className="encuestas__aviso">
                    No se pudo consultar la hoja de Google. Verifique que la
                    implementación publicada del Apps Script incluya la función{' '}
                    <strong>doGet</strong>, que se haya desplegado una versión
                    nueva y que el acceso sea{' '}
                    <strong>Cualquier persona</strong>. Puede responder los
                    formularios igualmente; al terminar use{' '}
                    <strong>Actualizar estado</strong> para volver a consultar.
                </p>
            )}

            {estado === 'sin-configurar' && (
                <p className="encuestas__aviso">
                    La conexión con la hoja de Google no está configurada. Los
                    enlaces a los formularios funcionan igualmente.
                </p>
            )}

            {cursosOrdenados.length === 0 ? (
                <p className="fichas__vacio">
                    No se encontraron cursos registrados para este docente.
                </p>
            ) : cursosFiltrados.length === 0 ? (
                <p className="fichas__vacio">
                    No hay cursos en esta categoría.
                </p>
            ) : (
                <div className="fichas__lista">
                    {cursosFiltrados.map((curso, index) => {
                        const completada = estaCompletada(curso);
                        const enlace = construirEnlaceEncuesta(curso, docente);

                        return (
                            <article
                                className={`ficha ${
                                    completada ? 'ficha--completada' : ''
                                }`}
                                key={`${curso.CURSO}-${curso.SEMESTRE}-${index}`}
                            >
                                <div className="ficha__info">
                                    <div className="ficha__periodo">
                                        <span>{curso.SEMESTRE}</span>
                                        <span className="ficha__separador">
                                            /
                                        </span>
                                        <span>Ciclo {curso.CICLO}</span>
                                    </div>

                                    <h3 className="ficha__curso">
                                        {curso.CURSO}
                                    </h3>
                                </div>

                                <div className="ficha__acciones encuestas__acciones-ficha">
                                    {estado === 'ok' ? (
                                        <span
                                            className={`encuesta-badge ${
                                                completada
                                                    ? 'encuesta-badge--ok'
                                                    : 'encuesta-badge--pendiente'
                                            }`}
                                        >
                                            <span
                                                className="encuesta-badge__punto"
                                                aria-hidden="true"
                                            />
                                            {completada
                                                ? 'Completada'
                                                : 'Pendiente'}
                                        </span>
                                    ) : estado === 'cargando' ? (
                                        <span className="encuesta-badge encuesta-badge--sin-verificar">
                                            Verificando...
                                        </span>
                                    ) : (
                                        <span className="encuesta-badge encuesta-badge--sin-verificar">
                                            Sin verificar
                                        </span>
                                    )}

                                    {!completada &&
                                        (enlace ? (
                                            <a
                                                className="ficha__enlace encuesta-enlace"
                                                href={enlace}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={`Abrir la encuesta de ${curso.CURSO}`}
                                                onClick={() => {
                                                    esperandoRetornoRef.current = true;
                                                }}
                                            >
                                                Responder encuesta
                                                <IconoFlechaExterna />
                                            </a>
                                        ) : (
                                            <span className="ficha__sin">
                                                Sin enlace
                                            </span>
                                        ))}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default EncuestasDocente;

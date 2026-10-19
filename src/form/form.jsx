
import React, { useId, useState } from 'react';
import { preguntasPercepcion, nivelesSatisfaccion } from './preguntas.js';
import './EncuestaCurso.css';

const opcionesEscala = nivelesSatisfaccion.map((nivel) => nivel.valor);

function EncuestaCurso({
    codigo,
    curso,
    docente,
    ciclo,
    semestre,
    tipoEstudio,
    onChangeRespuestas
}) {
    const uid = useId();
    const [respuestas, setRespuestas] = useState({});

    const manejarSeleccion = (preguntaIndex, valor) => {
        const nuevas = {
            ...respuestas,
            [preguntaIndex]: Number(valor)
        };

        setRespuestas(nuevas);

        const valores = Object.values(nuevas);
        const promedio = valores.length
            ? valores.reduce((a, b) => a + b, 0) / valores.length
            : 0;

        onChangeRespuestas?.(nuevas, promedio);
    };

    return (
        <section className="encuesta-curso">
            <header className="encuesta-curso__header">
                <span className="encuesta-curso__codigo">
                    {codigo}
                </span>

                <h3 className="encuesta-curso__titulo">
                    {curso}
                </h3>
            </header>

            <div className="encuesta-curso__informacion">
                <p>
                    <strong>Docente:</strong> {docente}
                </p>

                <p>
                    <strong>Ciclo / Semestre:</strong>{' '}
                    {ciclo} ({semestre})
                </p>

                {tipoEstudio && (
                    <p>
                        <strong>Tipo de estudio:</strong>{' '}
                        {tipoEstudio}
                    </p>
                )}
            </div>

            <div className="encuesta-curso__instruccion">
                Seleccione una opción del 1 al 5 para cada pregunta,
                según su percepción del curso.
            </div>

            <div className="encuesta-curso__tabla-contenedor">
                <table className="encuesta-curso__tabla">
                    <thead>
                        <tr>
                            <th className="col-numero">N.º</th>
                            <th className="col-pregunta">
                                Cursos / Preguntas de percepción
                            </th>

                            {opcionesEscala.map((opcion, index) => (
                                <th
                                    key={opcion}
                                    className={`col-opcion opcion-${opcion}`}
                                >
                                    <span className="opcion__nombre">
                                        {nivelesSatisfaccion[index].corto}
                                    </span>
                                    <span className="opcion__valor">
                                        {opcion}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {preguntasPercepcion.map((pregunta, index) => (
                            <tr key={index}>
                                <td className="celda-numero">
                                    {index + 1}
                                </td>

                                <td className="celda-pregunta">
                                    {pregunta}
                                </td>

                                {opcionesEscala.map((opcion) => (
                                    <td
                                        key={opcion}
                                        className={`celda-opcion opcion-${opcion}`}
                                    >
                                        <label
                                            className="opcion-radio"
                                            title={`Seleccionar ${opcion}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`${uid}-pregunta-${index}`}
                                                value={opcion}
                                                checked={
                                                    respuestas[index] === opcion
                                                }
                                                onChange={() =>
                                                    manejarSeleccion(
                                                        index,
                                                        opcion
                                                    )
                                                }
                                                aria-label={`Pregunta ${index + 1}: opción ${opcion}`}
                                            />

                                            <span className="opcion-radio__indicador" />
                                        </label>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="encuesta-curso__progreso">
                <span>
                    Preguntas respondidas: {Object.keys(respuestas).length}
                    {' de '}
                    {preguntasPercepcion.length}
                </span>

                <div
                    className="encuesta-curso__barra"
                    role="progressbar"
                    aria-label="Progreso de la encuesta"
                    aria-valuemin={0}
                    aria-valuemax={preguntasPercepcion.length}
                    aria-valuenow={Object.keys(respuestas).length}
                >
                    <div
                        className="encuesta-curso__barra-valor"
                        style={{
                            width: `${preguntasPercepcion.length
                                    ? (Object.keys(respuestas).length /
                                        preguntasPercepcion.length) * 100
                                    : 0
                                }%`
                        }}
                    />
                </div>
            </footer>
        </section>
    );
}

export default EncuestaCurso;

import React from 'react';
import '../styles/variables.css';
import '../styles/fichas.css';

import excelIcon from '../assets/excel.svg';
import pdfIcon from '../assets/pdf.png';

function FichasLlenado({ fichas, docente, alVolver }) {
    return (
        <div className="fichas">
            <header className="fichas__cabecera">
                <div className="fichas__encabezado-info">
                    <h2 className="fichas__titulo">
                        Fichas de llenado
                    </h2>

                    <p className="fichas__descripcion">
                        Carga académica
                    </p>
                </div>

                <div className="fichas__resumen">
                    <p className="fichas__meta">
                        <strong>Docente:</strong> {docente}
                    </p>

                    <p className="fichas__meta">
                        <strong>Asignaturas:</strong> {fichas.length}
                    </p>
                </div>

                <button
                    type="button"
                    className="fichas__volver"
                    onClick={alVolver}
                >
                    <span aria-hidden="true">←</span>
                    Volver al menú
                </button>
            </header>

            {fichas.length === 0 ? (
                <p className="fichas__vacio">
                    No se encontraron fichas de llenado
                    registradas para este docente.
                </p>
            ) : (
                <div className="fichas__lista">
                    {fichas.map((ficha, index) => (
                        <article
                            className="ficha"
                            key={`${ficha.CURSO} -${ficha.SEMESTRE} -${index} `}
                        >
                            <div className="ficha__info">
                                <div className="ficha__periodo">
                                    <span>{ficha.SEMESTRE}</span>
                                    <span className="ficha__separador">
                                        /
                                    </span>
                                    <span>
                                        Ciclo {ficha.CICLO}
                                    </span>
                                </div>

                                <h3 className="ficha__curso">
                                    {ficha.CURSO}
                                </h3>
                            </div>

                            <div className="ficha__acciones">
                                {ficha.LINK ? (
                                    <a
                                        href={ficha.LINK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Abrir Google Sheets"
                                        aria-label={`Abrir hoja de cálculo de ${ficha.CURSO} `}
                                        className="ficha__enlace"
                                    >
                                        <img
                                            src={excelIcon}
                                            alt=""
                                            className="ficha__icono"
                                        />
                                        <span>Excel</span>
                                    </a>
                                ) : (
                                    <span className="ficha__sin">
                                        Sin Excel
                                    </span>
                                )}

                                {ficha.PDF ? (
                                    <a
                                        href={ficha.PDF}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Abrir archivo PDF"
                                        aria-label={`Abrir PDF de ${ficha.CURSO} `}
                                        className="ficha__enlace"
                                    >
                                        <img
                                            src={pdfIcon}
                                            alt=""
                                            className="ficha__icono"
                                        />
                                        <span>PDF</span>
                                    </a>
                                ) : (
                                    <span className="ficha__sin">
                                        Sin PDF
                                    </span>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FichasLlenado;
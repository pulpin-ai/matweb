import React from 'react';
import '../styles/variables.css';
import '../styles/menu.css';

function IconoEncuesta() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
        </svg>
    );
}

function IconoFichas() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            <path d="M8 13h8" />
            <path d="M8 16h5" />
        </svg>
    );
}

function MenuOpciones({
    nombreDocente,
    totalCursos = 0,
    alSeleccionarOpcion,
    alCerrarSesion
}) {
    const etiquetaCursos =
        totalCursos === 1 ? '1 curso asignado' : `${totalCursos} cursos asignados`;

    const opciones = [
        {
            id: 'encuesta',
            icono: <IconoEncuesta />,
            titulo: 'Encuesta de satisfacción',
            meta: etiquetaCursos,
            descripcion: 'Responder el formulario de Google de cada curso asignado'
        },
        {
            id: 'fichas',
            icono: <IconoFichas />,
            titulo: 'Fichas de llenado',
            meta: etiquetaCursos,
            descripcion: 'Acceder a las hojas de cálculo y documentos PDF por curso'
        }
    ];

    return (
        <div className="menu">
            <header className="menu__cabecera">
                <p className="menu__saludo">Portal docente</p>
                <h2 className="menu__docente">{nombreDocente}</h2>
                <p className="menu__ayuda">
                    Seleccione el módulo al que desea ingresar
                </p>
            </header>

            <div className="menu__opciones">
                {opciones.map((opcion) => (
                    <button
                        key={opcion.id}
                        type="button"
                        className="menu__opcion"
                        onClick={() => alSeleccionarOpcion(opcion.id)}
                    >
                        <div className="menu__opcion-cabecera">
                            <span className="menu__opcion-icono" aria-hidden="true">
                                {opcion.icono}
                            </span>
                            <span className="menu__opcion-meta">{opcion.meta}</span>
                        </div>
                        <span className="menu__opcion-titulo">{opcion.titulo}</span>
                        <span className="menu__opcion-desc">{opcion.descripcion}</span>
                    </button>
                ))}
            </div>

            <button
                type="button"
                className="menu__salir"
                onClick={alCerrarSesion}
            >
                ← Cambiar de docente
            </button>
        </div>
    );
}

export default MenuOpciones;

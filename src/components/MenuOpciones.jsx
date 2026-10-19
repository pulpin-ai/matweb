
import React from 'react';
import '../styles/variables.css';
import '../styles/menu.css';

function MenuOpciones({
    nombreDocente,
    alSeleccionarOpcion,
    alCerrarSesion
}) {
    const opciones = [
        {
            id: 'encuesta',
            icono: '📝',
            titulo: 'Encuesta',
            descripcion: 'Realizar evaluación docente por curso'
        },
        {
            id: 'fichas',
            icono: '📁',
            titulo: 'Fichas de Llenado',
            descripcion: 'Acceder a archivos Sheets y PDF asignados'
        }
    ];

    return (
        <div className="menu">
            <header className="menu__cabecera">
                <p className="menu__saludo">Bienvenido(a)</p>
                <h2 className="menu__docente">{nombreDocente}</h2>
                <p className="menu__ayuda">
                    Seleccione el módulo al que desea ingresar:
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
                        <span className="menu__opcion-icono" aria-hidden="true">
                            {opcion.icono}
                        </span>
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
                ← Salir / Cambiar de docente
            </button>
        </div>
    );
}

export default MenuOpciones;

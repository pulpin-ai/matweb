import React from 'react';
import '../styles/variables.css';
import '../styles/login.css';

// Logo de la carrera (PNG). Usa el mismo del header; cámbialo si tienes otro.
import logoCarrera from '../assets/logo_fismat.png';

function Login({
    nombreDocente,
    alCambiarNombre,
    alEnviar,
    titulo = 'Evaluación curricular 2021 - 2025'
}) {
    return (
        <div className="login">
            <div className="login__glow"></div>

            <div className="login__card">
                {/* ---------- Panel izquierdo: login ---------- */}
                <section className="login__panel login__panel--form">
                    <div className="login__header">
                        <div className="login__icon">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="login__title">{titulo}</h2>
                    </div>

                    <div className="login__instrucciones">
                        <p className="login__instrucciones-titulo">Indicaciones</p>
                        <ol>
                            <li>Escriba su nombre completo.</li>
                            <li>Si el sistema indica que hay varios docentes con ese nombre, escríbalo completo.</li>
                            <li>Presione <strong>Validar e Ingresar</strong> para acceder a sus módulos.</li>
                        </ol>
                    </div>

                    <form onSubmit={alEnviar}>
                        <div className="login__field">
                            <label className="login__label" htmlFor="nombre-docente">
                                Nombre del Docente
                            </label>
                            <input
                                id="nombre-docente"
                                className="login__input"
                                type="text"
                                value={nombreDocente}
                                onChange={(e) => alCambiarNombre(e.target.value)}
                                placeholder="Ej. YENINA APAZA OCHOA"
                                autoComplete="off"
                                required
                            />
                        </div>

                        <button type="submit" className="login__button">
                            Validar e Ingresar
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </form>
                </section>

                {/* ---------- Panel derecho: logo ---------- */}
                <aside className="login__panel login__panel--logo">
                    <img src={logoCarrera} alt="Logo de la carrera" className="login__logo" />
                </aside>
            </div>
        </div>
    );
}

export default Login;
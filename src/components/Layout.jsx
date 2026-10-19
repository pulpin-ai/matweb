import React, { useState, useEffect } from 'react';
import '../styles/variables.css';
import '../styles/layout.css';

// Coloca tu logo en src/assets/logo_fismat.png
import logoFismat from '../assets/logo_fismat.png';

// Iconos del botón de tema
function IconoSol() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    );
}

function IconoLuna() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

function obtenerTemaInicial() {
    if (typeof window === 'undefined') return 'oscuro';
    const guardado = window.localStorage.getItem('tema');
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    const prefiereClaro = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefiereClaro ? 'claro' : 'oscuro';
}

function Layout({
    children,
    titulo = 'Física Matemática',
    subtitulo = 'MATEMÁTICA',
    institucion = 'UNA-PUNO',
    githubUrl = 'https://github.com/',
    correoAyuda = 'correo@gmail.com'
}) {
    const [tema, setTema] = useState(obtenerTemaInicial);

    useEffect(() => {
        document.documentElement.dataset.tema = tema;
        window.localStorage.setItem('tema', tema);
    }, [tema]);

    const alternarTema = () => {
        setTema((actual) => (actual === 'claro' ? 'oscuro' : 'claro'));
    };

    const esClaro = tema === 'claro';

    return (
        <div className="layout">
            {/* ---------- Barra superior ---------- */}
            <header className="layout-header">
                <div className="layout-header__brand">
                    <img src={logoFismat} alt="Logo FISMAT" className="layout-header__logo" />
                    <div className="layout-header__titles">
                        <span className="layout-header__title">{titulo}</span>
                        <span className="layout-header__subtitle">{subtitulo}</span>
                    </div>
                </div>

                <div className="layout-header__acciones">
                    <span className="layout-header__institucion">{institucion}</span>

                    <button
                        type="button"
                        className="layout-header__tema"
                        onClick={alternarTema}
                        title={esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                        aria-label={esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                        aria-pressed={esClaro}
                    >
                        {esClaro ? <IconoLuna /> : <IconoSol />}
                    </button>

                    <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="GitHub"
                        className="layout-header__github"
                    >
                        <svg viewBox="0 0 16 16" width="28" height="28" fill="currentColor" aria-hidden="true">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                        </svg>
                    </a>
                </div>
            </header>

            {/* ---------- Cuerpo ---------- */}
            <main className="layout-body">{children}</main>

            {/* ---------- Pie de página ---------- */}
            <footer className="layout-footer">
                <div className="layout-footer__help">
                    <strong>¿Necesitas ayuda?</strong>
                    <span>{correoAyuda}</span>
                    <a href={`mailto:${correoAyuda}`} className="layout-footer__btn">
                        Enviar correo
                    </a>
                </div>

                <div className="layout-footer__bottom">
                    <a href={`mailto:${correoAyuda}`} className="layout-footer__link">AYUDA</a>
                    <span>© {new Date().getFullYear()} {institucion}. Todos los derechos reservados.</span>
                </div>
            </footer>
        </div>
    );
}

export default Layout;

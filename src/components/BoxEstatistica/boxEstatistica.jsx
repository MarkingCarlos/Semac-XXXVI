import { useRef } from 'preact/hooks';
import './boxEstatistica.css';
import logoYoutube from "../../assets/logo-youtube.svg";
import logoLinkedin from "../../assets/logo-linkedin.svg";
import logoInstagram from "../../assets/logo-instagram.svg";


export function BoxEstatistica({
    plataforma,
    stats = [],
    indice = 0,
    href,
}) {

    let color = "black";
    let logo = "";
    let corMancha = "black";
    let glowColor = "transparent";

    if (plataforma === "YouTube") {
        color = "var(--vermelhoDiretoria)";
        corMancha = "var(--vermelhoAux2Diretoria)";
        glowColor = "var(--vermelhoAux2Diretoria)";
        logo = logoYoutube;
    } else if (plataforma === "LinkedIn") {
        color = "var(--azulConteudo)";
        corMancha = "var(--azulAuxConteudo)";
        glowColor = "var(--azulAuxConteudo)";
        logo = logoLinkedin;
    } else if (plataforma === "Instagram") {
        color = "var(--rosaMarketing)";
        corMancha = "var(--rosaAuxMarketing)";
        glowColor = "var(--rosaAuxMarketing)";
        logo = logoInstagram;
    }

    const wrapperRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!wrapperRef.current) return;
        const retanguloWrapper = wrapperRef.current.getBoundingClientRect();
        wrapperRef.current.style.setProperty('--mouse-x', `${e.clientX - retanguloWrapper.left}px`);
        wrapperRef.current.style.setProperty('--mouse-y', `${e.clientY - retanguloWrapper.top}px`);
    };

    return (
        <div
            className="boxWrapper"
            ref={wrapperRef}
            onMouseMove={handleMouseMove}
            style={{ '--glow-color': glowColor }}
        >
            <a href={href} target="_blank" rel="noopener noreferrer" className="linkBox">
                <div
                    className="box"
                    style={{ backgroundColor: color, animationDelay: `${indice * 0.15}s` }}
                >
                    <div className="mancha" style={{ backgroundColor: corMancha }} />

                    <div className="header">
                        <img src={logo} alt={plataforma} className="logoIcon" />
                        <h3 className="titulo">{plataforma}</h3>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {stats.map(({ label, valor }) => (
                            <div key={label} className="linha">
                                <span>{label}:</span>
                                <span>{valor}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </a>
        </div>
    );
}

import { useState, useEffect, useRef } from 'preact/hooks';
import './boxEstatistica.css';
import logoYoutube from "../../assets/logo-youtube.svg";
import logoLinkedin from "../../assets/logo-linkedin.svg";
import logoInstagram from "../../assets/logo-instagram.svg";

function useCountUp(target, duration = 1400) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const num = parseInt(target);
        if (isNaN(num)) { setDisplay(target); return; }

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();

            const steps = Math.min(num, 80);
            const stepValue = num / steps;
            const stepTime = duration / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += stepValue;
                if (current >= num) {
                    setDisplay(num);
                    clearInterval(timer);
                } else {
                    setDisplay(Math.floor(current));
                }
            }, stepTime);
        }, { threshold: 0.4 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return [display, ref];
}

export function BoxEstatistica({
    plataforma,
    seguidores,
    visitas,
    alcance,
    indice = 0,
}) {

    let color = "black";
    let logo = "";
    let corMancha = "black";

    if (plataforma === "YouTube") {
        color = "var(--vermelhoDiretoria)";
        corMancha = "var(--vermelhoAux2Diretoria)";
        logo = logoYoutube;
    } else if (plataforma === "LinkedIn") {
        color = "var(--azulConteudo)";
        corMancha = "var(--azulAuxConteudo)";
        logo = logoLinkedin;
    } else if (plataforma === "Instagram") {
        color = "var(--rosaMarketing)";
        corMancha = "var(--rosaAuxMarketing)";
        logo = logoInstagram;
    }

    const [segCount, refSeg] = useCountUp(seguidores);
    const [visCount, refVis] = useCountUp(visitas);
    const [alcCount, refAlc] = useCountUp(alcance);

    return (
        <div
            className="box"
            style={{ backgroundColor: color, animationDelay: `${indice * 0.15}s` }}
            ref={refAlc}
        >
            <div className="mancha" style={{ backgroundColor: corMancha }} />

            <div className="header">
                <img src={logo} alt={plataforma} className="logo" />
                <h3 className="titulo">{plataforma}</h3>
            </div>

            <div className="linha" ref={refSeg}>
                <span>Seguidores:</span>
                <span>{segCount}</span>
            </div>

            <div className="linha" ref={refVis}>
                <span>Visitas:</span>
                <span>{visCount}</span>
            </div>

            <div className="linha">
                <span>Alcance:</span>
                <span>{alcCount}</span>
            </div>
        </div>
    );
}

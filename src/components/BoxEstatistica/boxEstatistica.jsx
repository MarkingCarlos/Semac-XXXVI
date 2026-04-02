import './boxEstatistica.css';

import logoYoutube from "../../assets/logo-youtube.svg";
import logoLinkedin from "../../assets/logo-linkedin.svg";
import logoInstagram from "../../assets/logo-instagram.svg";

export function BoxEstatistica({ 
    plataforma, 
    seguidores, 
    visitas, 
    alcance,
}) {

    let color = "black";
    let logo = "";
    let corMancha = "black"

    if (plataforma === "YouTube") {
        color = "var(--vermelhoDiretoria)";
        corMancha = "var(--vermelhoAux2Diretoria)"
        logo = logoYoutube;
    }
    else if (plataforma === "LinkedIn") {
        color = "var(--azulConteudo)";
        corMancha = "var(--azulAuxConteudo)";
        logo = logoLinkedin;
    }
    else if (plataforma === "Instagram") {
        color = "var(--rosaMarketing)";
        corMancha = "var(--rosaAuxMarketing)";
        logo = logoInstagram;
    }

    return (
        <div className="box" style={{ backgroundColor: color }}>

            <div className="mancha" style={{ backgroundColor: corMancha }} />

            <div className="header">
                <img src={logo} alt={plataforma} className="logo" />
                <h3 className="titulo">{plataforma}</h3>
            </div>

            <div className="linha">
                <span>Seguidores:</span>
                <span>{seguidores}</span>
            </div>

            <div className="linha">
                <span>Visitas:</span>
                <span>{visitas}</span>
            </div>

            <div className="linha">
                <span>Alcance:</span>
                <span>{alcance}</span>
            </div>

        </div>
    );
}

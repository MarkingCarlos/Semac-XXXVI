import { useLocation } from 'wouter'
import { createPortal } from 'preact/compat'
import waveUpHome from '/src/assets/waveCima.svg'
import waveUpHomeMobile from '/src/assets/waveCimaMobile.svg'
import waveDownHomeMobile from '/src/assets/waveBaixoMobile.svg'
import waveDownHome from '/src/assets/waveBaixo.svg'
import logoSemac from '/src/assets/semacPolaridLongo.png'
import fotos from '/src/assets/fotosHome.png'
import './home.css'

const Home = () =>{
    const [, navigate] = useLocation()

    return (
        <div id="home" className="conteinerPaginaHome">
            <img src={fotos} className="imagemFotosHome" alt="fotos home" />

                <img src={logoSemac} className="imagemLogoHome" alt="LOGO SEMAC" />

            {/*/!* Portal para o body — o wrapper "position: sticky" da Home em*/}
            {/*    app.jsx cria um containing block, e o position: fixed do*/}
            {/*    botão ficaria preso a ele em vez de cobrir a viewport*/}
            {/*    inteira durante a rolagem (mesmo motivo do PainelLateral). *!/*/}
            {/*{createPortal(*/}
            {/*    <button*/}
            {/*        type="button"*/}
            {/*        className="botaoInscrevaSeHome"*/}
            {/*        onClick={() => navigate('/participantes')}*/}
            {/*    >*/}
            {/*        Inscreva-se*/}
            {/*    </button>,*/}
            {/*    document.body,*/}
            {/*)}*/}
            <img src={waveUpHome}       className="ondaCimaHome ondaCimaHomeDesktop" alt="WaveHome logo" />
            <img src={waveUpHomeMobile} className="ondaCimaHome ondaCimaHomeMobile"  alt="WaveHome logo" />
            <img src={waveDownHome}       className="ondaBaixoHome ondaBaixoHomeDesktop" alt="WaveHome logo" />
            <img src={waveDownHomeMobile} className="ondaBaixoHome ondaBaixoHomeMobile"  alt="WaveHome logo" />
        </div>
    )

}

export default Home;

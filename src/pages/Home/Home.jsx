import { useRef } from 'preact/hooks'
import { useLocation } from 'wouter'
import gsap from 'gsap'
import waveUpHome from '/src/assets/waveCima.svg'
import waveDownHome from '/src/assets/waveBaixo.svg'
import logoSemac from '/src/assets/Logo_SEMAC.png'
import fotos from '/src/assets/fotosHome.png'
import './home.css'

const Home = () =>{
    const containerRef = useRef(null)
    const [, navigate] = useLocation()

    function irParaInscricao() {
        gsap.to(containerRef.current, {
            x: '-100vw',
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => navigate('/inscricao')
        })
    }

    return (
        <div className="home-container" ref={containerRef}>
            <button className="botao-inscricao" onClick={irParaInscricao}>
                Inscreva-se
            </button>
            <button className="botao-entrar">Já possui uma conta?</button>

            <img src={fotos} className="fotos" alt="fotos home" />
            <img src={logoSemac} className="logoSemac" alt="LOGO SEMAC" />
            <img src={waveUpHome} className="WaveUpHome" alt="WaveHome logo" />
            <img src={waveDownHome} className="WaveDownHome" alt="WaveHome logo" />
        </div>
    )

}

export default Home;

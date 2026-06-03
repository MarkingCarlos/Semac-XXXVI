import { useLocation } from 'wouter'
import waveUpHome from '/src/assets/waveCima.svg'
import waveUpHomeMobile from '/src/assets/waveCimaMobile.svg'
import waveDownHome from '/src/assets/waveBaixo.svg'
import logoSemac from '/src/assets/semacPNG.png'
import fotos from '/src/assets/fotosHome.png'
import './home.css'

const Home = () =>{
    const [, navigate] = useLocation()

    return (
        <div className="home-container">
            <div className="divBotoes">
                <button className="btn" onClick={() => navigate('/inscricao')}>
                    Inscreva-se
                </button>
                <button className="btn" onClick={() => navigate('/inscricao')}>
                    Entrar
                </button>
            </div>

            <img src={fotos} className="fotos" alt="fotos home" />
            <div className="retanguloGlass" />
            <img src={logoSemac} className="logoSemac" alt="LOGO SEMAC" />
            <img src={waveUpHome}       className="WaveUpHome WaveUpHome-desktop" alt="WaveHome logo" />
            <img src={waveUpHomeMobile} className="WaveUpHome WaveUpHome-mobile"  alt="WaveHome logo" />
            <img src={waveDownHome} className="WaveDownHome" alt="WaveHome logo" />
        </div>
    )

}

export default Home;

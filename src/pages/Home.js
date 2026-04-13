import waveUpHome from '/src/assets/waveCima.svg'
import waveDownHome from '/src/assets/waveBaixo.svg'
import logoSemac from '/src/assets/Logo_SEMAC.png'
import fotos from '/src/assets/fotosHome.png'
import './home.css'

const Home = () =>{

    return (
        <div className="home-container">
            <img src={fotos} className="fotos" alt="fotos home" />
            <img src={logoSemac} className="logoSemac" alt="LOGO SEMAC" />
            <img src={waveUpHome} className="WaveUpHome" alt="WaveHome logo" />
            <img src={waveDownHome} className="WaveDownHome" alt="WaveHome logo" />
        </div>
    )

}

export default Home;

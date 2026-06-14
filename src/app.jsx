import Home from "./pages/Home/Home.jsx";
import './app.css'
import Sobre from "./pages/Sobre/sobre.jsx";
import FooterNovo from "./pages/Footer/FooterNovo.jsx";
import Doacao from "./pages/Doacao/doacao.jsx";
import SobreComissao from "./pages/SobreComissao/sobreComissao.jsx";
import CronogramaBreve from "./pages/cronogramaBreve/CronogramaBreve.jsx";
import PatrocinadoresCompacto from "./pages/PatrocinadoresCompacto/PatrocinadoresCompacto.jsx";
import { NavPontos } from "./components/NavPontos/navPontos.jsx";
import paperTexture from './assets/PAPER.png';


export function App() {

  return (
    <>
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `url(${paperTexture})`,
            backgroundSize: '120%',
            backgroundAttachment: 'fixed',
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            zIndex: 50,
        }} />
        <NavPontos />
        <div style={{position:'sticky'}}>
            <Home/>
        </div>
        <div>
            <Sobre/>
        </div>
        <div>
            <CronogramaBreve/>
        </div>
        <div>
            <PatrocinadoresCompacto/>
        </div>
        <div>
            <Doacao/>
        </div>
        <div>
            <SobreComissao/>
        </div>
        <FooterNovo/>
    </>
  )
}

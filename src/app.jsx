import Home from "./pages/Home/Home.jsx";
import './app.css'
import Sobre from "./pages/Sobre/sobre.jsx";
import FooterNovo from "./pages/Footer/FooterNovo.jsx";
import Doacao from "./pages/Doacao/doacao.jsx";
import SobreComissao from "./pages/SobreComissao/sobreComissao.jsx";
import CronogramaBreve from "./pages/cronogramaBreve/CronogramaBreve.jsx";
import PatrocinadoresCompacto from "./pages/PatrocinadoresCompacto/PatrocinadoresCompacto.jsx";
import Programacao from "./pages/Programacao/programacao.jsx"
import { NavPontos } from "./components/NavPontos/navPontos.jsx";
import paperTexture from './assets/PAPER.png';
import ContagemRegressiva from "./components/contagemRegressiva/contagemRegressiva.jsx";
import {PaginaContagem} from "./pages/page/PaginaContagem.jsx";
import Termo from "./pages/Termo/Termo.jsx";


export function App() {

  return (
    <>
        {/*<PaginaContagem/>*/}
        <div className="paperTextura"
             style={{
                 backgroundImage: `url(${paperTexture})`
             }}/>
         <NavPontos/>
        <div style={{position: 'sticky'}}>
            <Home/>
        </div>
        <div>
            <Sobre/>
        </div>
        <div>
            <CronogramaBreve/>
        </div>
        {/*<div>*/}
        {/*    <Programacao/>*/}
        {/*</div>*/}
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

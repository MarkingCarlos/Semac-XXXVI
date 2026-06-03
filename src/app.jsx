import Home from "./pages/Home/Home.jsx";
import './app.css'
import Sobre from "./pages/Sobre/sobre.jsx";
import FooterNovo from "./pages/FooterNovo/FooterNovo.jsx";
import Patrocinadores from "./pages/Patrocinadores/Patrocinadores.jsx";
import Cronograma from "./pages/Cronograma/Cronograma.jsx";
import Doacao from "./pages/Doacao/doacao.jsx";
import SobreComissao from "./pages/SobreComissao/sobreComissao.jsx";
import CronogramaBreve from "./pages/cronogramaBreve/CronogramaBreve.jsx";
import PatrocinadoresCompacto from "./pages/PatrocinadoresCompacto/PatrocinadoresCompacto.jsx";
import {EX_PATROCINADORES} from "./data/exPatrocinadores.js";
import PatrocinadoresAnteriores from "./pages/PatrocinadoresAnteriores/PatrocinadoresAnteriores.jsx";


export function App() {

  return (
    <>
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

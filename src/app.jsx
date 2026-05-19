import Home from "./pages/Home/Home.jsx";
import './app.css'
import Sobre from "./pages/Sobre/sobre.jsx";
import Footer from "./pages/Footer/footer.jsx";
import Patrocinadores from "./pages/Patrocinadores/Patrocinadores.jsx";
import Cronograma from "./pages/Cronograma/Cronograma.jsx";
import Doacao from "./pages/Doacao/doacao.jsx";
import SobreComissao from "./pages/SobreComissao/sobreComissao.jsx";


export function App() {

  return (
    <>
        <div style={{position:'sticky'}}>
            <Home/>
        </div>
        <div style={{ minHeight:'75vh'}}>
            <Sobre/>
        </div>
        <div>
            <Cronograma/>
        </div>
        <div style={{marginTop: '2.5rem'}}>
            <Patrocinadores/>
        </div>
        <div>
            <Doacao/>
        </div>
        <div style={{marginTop: '2.5rem'}}>
            <SobreComissao/>
        </div>
        <Footer/>
    </>
  )
}

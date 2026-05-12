import Home from "./pages/Home/Home.jsx";
import './app.css'
import Sobre from "./pages/Sobre/sobre.jsx";
import Footer from "./pages/Footer/footer.jsx";
import Patrocinadores from "./pages/Patrocinadores/Patrocinadores.jsx";
import Cronograma from "./pages/Cronograma/Cronograma.jsx";


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
        <Footer/>
    </>
  )
}

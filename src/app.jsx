import Home from "./pages/Home/Home.jsx";
import './app.css'
import Sobre from "./pages/Sobre/sobre.jsx";
import Footer from "./pages/Footer/footer.jsx";
import Patrocinadores from "./pages/Patrocinadores/Patrocinadores.jsx";

export function App() {

  return (
    <>
        <div className="section-sticky" style={{zIndex: 1}}>
            <Home/>
        </div>
        <div className="section-sticky" style={{zIndex: 2}}>
            <Sobre/>
        </div>
        <div className="section-sticky" style={{zIndex: 3}}>
            <Patrocinadores/>
        </div>
        <Footer/>
    </>
  )
}

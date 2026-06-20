import logo from '/Logo.svg'
import waveDown from '/WaveDown.svg'
import waveUp from '/waveup.svg'

import './page.css'
import ContagemRegressiva from "../../components/contagemRegressiva/contagemRegressiva.jsx";
import BtnContato from "../../components/BtnContato/btnContato.jsx";

export function PaginaContagem() {
  return (
    <>
      <div className="conteinerPagina">
      <div>
          <img src={waveDown} className="WaveDown" alt="WaveDown logo" />
          <img src={waveUp} className="WaveUp" alt="WaveDown logo" />
          <a href="https://www.linkedin.com/company/semacsjrp/posts/?feedView=all" target="_blank">
              <img src={logo} className="logo" alt="Vite logo"/>
          </a>
      </div>
           <div className="card">
                <ContagemRegressiva/>
           </div>
           <div style={{marginTop: "1em"}}>
                <BtnContato/>
           </div>
      </div>

    </>
  )
}

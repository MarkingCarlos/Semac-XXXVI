import { useState } from 'preact/hooks'
import logo from '/Logo.svg'
import waveDown from '/WaveDown.svg'
import waveUp from '/waveup.svg'
import ContagemRegressiva from "./components/contagemRegressiva/contagemRegressiva.jsx";
import BtnContato from "./components/BtnContato/btnContato.jsx";
import './app.css'

export function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
          <img src={waveDown} className="WaveDown" alt="WaveDown logo" />
          <img src={waveUp} className="WaveUp" alt="WaveDown logo" />
          <a href="https://www.linkedin.com/company/semacsjrp/posts/?feedView=all" target="_blank">
              <img src={logo} className="logo" alt="Vite logo"/>
          </a>
      </div>
      <div class="card">
        <ContagemRegressiva />
      </div>
      <div style={{marginTop: "5em"}}>
        <BtnContato/>
      </div>
    </>
  )
}

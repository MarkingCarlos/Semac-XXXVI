import { useState } from 'preact/hooks'
import logo from '/Logo.svg'
import waveDown from '/WaveDown.svg'
import waveUp from '/waveup.svg'
import ContagemRegressiva from "./components/contagemRegressiva/contagemRegressiva.jsx";
import BtnContato from "./components/BtnContato/btnContato.jsx";
// import ModalPalestra from "./components/ModalPalestra/modalPalestra.jsx";
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
      <div style={{marginTop: "3em"}}>
        <BtnContato/>
      </div>
      {/* <div style={{marginTop: "3em"}}>
        <ModalPalestra 
          palestra={{
            id: 1,
            imagem: '',
            titulo: 'Biociência e os novos modelos feitos com ia',
            palestrante: 'Guilherme Soares',
            descricao: 'Descricao Descricao Descricao Descricao Descricao Descricao'
          }}
          redes={{
            linkedin: {
              nome: '@Guilherme',
              link: ''
            },
            instagram: {
              nome: '@Soares',
              link: ''
            }
          }}
        />
        <ModalPalestra 
          palestra={{
            id: 2,
            imagem: '',
            titulo: '2 - Biociência e os novos modelos feitos com ia',
            palestrante: 'Guilherme Soares 2',
            descricao: 'Descricao Descricao Descricao Descricao Descricao Descricao'
          }}
          redes={{
            linkedin: {
              nome: '@Guilherme2',
              link: ''
            },
            instagram: {
              nome: '@Soares2',
              link: ''
            }
          }}
        />
      </div> */}
    </>
  )
}

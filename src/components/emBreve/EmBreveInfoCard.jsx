import BracketCorners from './BracketCorners.jsx';
import CountdownBreve from './CountdownBreve.jsx';
import TrilhasConfirmadas from './Trilhas.jsx';
import { STATS } from './tokens.js';
import './emBreveInfoCard.css';
import {useRef} from "preact/hooks";

/**
 * EmBreveInfoCard — card lateral (coluna direita) da página Em Breve.
 *
 * Exibe:
 *  - Data e countdown até o anúncio dos palestrantes
 *  - Trilhas temáticas confirmadas
 *  - Mini painel de estatísticas (palestras, dias, auditórios)
 *
 * Os dados são controlados por tokens.js (DATA_ANUNCIO, TRILHAS, STATS).
 */

export default function EmBreveInfoCard() {
    const wrapperRef = useRef(null);
    const handleMouseMove = (e) => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        wrapperRef.current.style.setProperty('--mouse-x', `${x}px`);
        wrapperRef.current.style.setProperty('--mouse-y', `${y}px`);
    };
  return (
      <div className="bordaBrilhante"
           ref={wrapperRef}
           onMouseMove={handleMouseMove}>
        <div className="cardInfo">
          <BracketCorners cor="#E79839" tamanho={18} recuo={10} />

          {/* Cabeçalho do card */}
          <p className="rotulo rotuloLaranja">Anúncio dos palestrantes</p>
          <p className="dataAnuncio">15 · JUL · 2026 · 09H</p>

          {/* Countdown regressivo */}
          <CountdownBreve tamanho="lg" />

          <div className="linhaDivisoria" />

          {/* Trilhas */}
           <div className="trilhas">
               <div className={"boxTrilhasTexto"}>
                   <p className="rotulo" style={{textAlign: 'left'}}>Temas confirmados:</p>
                   <TrilhasConfirmadas />
               </div>

              <div className="painelEstatisticas">
                {STATS.map(({ valor, label }) => (
                  <div key={label} className="itemEstatistica">
                    <span className="numeroEstatistica">{valor}</span>
                    <span className="rotulo rotuloMinusculo">{label}</span>
                  </div>
                ))}
              </div>

           </div>
        </div>

      </div>
  );
}

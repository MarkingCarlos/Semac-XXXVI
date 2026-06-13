import { TRILHAS } from './tokens.js';
import './trilhas.css';

function TrackBox({ label, cor, ativa = true }) {
  return (
    <span
      className="boxTrilha"
      style={{
        borderColor: ativa ? cor : 'rgba(252,248,245,0.14)',
        background:  ativa ? `${cor}1F` : 'transparent',
        color:       ativa ? cor : 'rgba(252,248,245,0.65)',
      }}
    >
      <span className="boxTrilhaPonto" style={{ background: cor }} />
      {label}
    </span>
  );
}

/**
 * TrilhasConfirmadas — lista de boxs das trilhas definidas em tokens.js.
 * Para adicionar ou remover trilhas, edite o array TRILHAS em tokens.js.
 */
export default function TrilhasConfirmadas() {
  return (
    <div className="containerBoxsTrilhas">
      {TRILHAS.map((trilha) => (
        <TrackBox key={trilha.label} label={trilha.label} cor={trilha.cor} ativa />
      ))}
    </div>
  );
}

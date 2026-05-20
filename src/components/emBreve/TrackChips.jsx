import { TRILHAS } from './tokens.js';
import './trackChips.css';

/**
 * TrackChip — chip individual de uma trilha confirmada.
 *
 * @param {string}  label — nome da trilha
 * @param {string}  cor   — cor hex da trilha
 * @param {boolean} ativa — exibe com fundo colorido quando true
 */
function TrackChip({ label, cor, ativa = true }) {
  return (
    <span
      className="eb-chip"
      style={{
        borderColor: ativa ? cor : 'rgba(252,248,245,0.14)',
        background:  ativa ? `${cor}1F` : 'transparent',
        color:       ativa ? cor : 'rgba(252,248,245,0.65)',
      }}
    >
      <span className="eb-chip-dot" style={{ background: cor }} />
      {label}
    </span>
  );
}

/**
 * TrilhasConfirmadas — lista de chips das trilhas definidas em tokens.js.
 * Para adicionar ou remover trilhas, edite o array TRILHAS em tokens.js.
 */
export default function TrilhasConfirmadas() {
  return (
    <div className="eb-chips-wrap">
      {TRILHAS.map((t) => (
        <TrackChip key={t.label} label={t.label} cor={t.cor} ativa />
      ))}
    </div>
  );
}

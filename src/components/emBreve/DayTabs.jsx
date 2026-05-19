import './dayTabs.css';

/* Rótulos exibidos conforme a variante (desktop usa nomes completos) */
const DIAS_DESKTOP = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const DIAS_MOBILE  = ['SEG',     'TER',   'QUA',    'QUI',    'SEX'];

/**
 * DayTabs — abas de seleção de dia com estado bloqueado (cronograma indisponível).
 *
 * Quando o cronograma for publicado, remova a classe `eb-tab--locked` e adicione
 * lógica de seleção (estado ativo) conforme necessário.
 *
 * @param {('desktop'|'mobile')} variante
 */
export default function DayTabs({ variante = 'desktop' }) {
  const dias = variante === 'desktop' ? DIAS_DESKTOP : DIAS_MOBILE;

  return (
    <nav
      className={`eb-tabs ${variante === 'mobile' ? 'eb-tabs--mobile' : 'eb-tabs--desktop'}`}
      aria-label="Dias do evento"
    >
      {dias.map((d) => (
        <div
          key={d}
          className={`eb-tab ${variante === 'mobile' ? 'eb-tab--mobile' : 'eb-tab--desktop'} eb-tab--locked`}
          aria-disabled="true"
        >
          {d}
        </div>
      ))}
    </nav>
  );
}

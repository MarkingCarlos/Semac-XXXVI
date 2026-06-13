import './dayTabs.css';

/* Rótulos exibidos conforme a variante (desktop usa nomes completos) */
const DIAS_DESKTOP = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const DIAS_MOBILE  = ['SEG',     'TER',   'QUA',    'QUI',    'SEX'];

/**
 * DayTabs — abas de seleção de dia com estado bloqueado (cronograma indisponível).
 *
 * Quando o cronograma for publicado, remova a classe `abaDiaBloqueada` e adicione
 * lógica de seleção (estado ativo) conforme necessário.
 *
 * @param {('desktop'|'mobile')} variante
 */
export default function DayTabs({ variante = 'desktop' }) {
  const dias = variante === 'desktop' ? DIAS_DESKTOP : DIAS_MOBILE;

  return (
    <nav
      className={variante === 'mobile' ? 'navAbasDiasMobile' : 'navAbasDiasDesktop'}
      aria-label="Dias do evento"
    >
      {dias.map((dia) => (
        <div
          key={dia}
          className={`${variante === 'mobile' ? 'abaDiaMobile' : 'abaDiaDesktop'} abaDiaBloqueada`}
          aria-disabled="true"
        >
          {dia}
        </div>
      ))}
    </nav>
  );
}

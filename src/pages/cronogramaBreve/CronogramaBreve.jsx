/**
 * CronogramaBreve — Versão A (Hero Editorial)
 *
 * Página exibida enquanto a grade completa de palestras não está disponível.
 * Apresenta: abas de dias bloqueadas, título tipográfico "EM BREVE",
 * countdown até o anúncio dos palestrantes e trilhas temáticas confirmadas.
 *
 * Componentes filhos:
 *  - EmBreveHeroText → coluna esquerda: título + descrição + botões
 *  - EmBreveInfoCard → coluna direita: countdown + trilhas + stats
 *
 * Dados editáveis: src/components/emBreve/tokens.js
 */

import EmBreveHeroText from '../../components/emBreve/EmBreveHeroText.jsx';
import EmBreveInfoCard from '../../components/emBreve/EmBreveInfoCard.jsx';
import './cronogramaBreve.css';

const CronogramaBreve = () => {
  return (
    <section className="paginaCronograma">

      <main className="conteudoPrincipal">
        <EmBreveHeroText />
        <EmBreveInfoCard />
          <div className="grupoDeAcoes">
              <button className="botao botaoPrimario">Avise-me ↗</button>
              <button className="botao botaoFantasma">@semac.ibilce</button>
          </div>
      </main>

    </section>
  );
};

export default CronogramaBreve;

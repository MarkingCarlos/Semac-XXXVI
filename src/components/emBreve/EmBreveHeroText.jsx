import './emBreveHeroText.css';

/**
 * EmBreveHeroText — coluna esquerda da página Em Breve (desktop).
 *
 * Contém: eyebrow, título tipográfico "EM BREVE", barra laranja,
 * parágrafo descritivo e botões de ação.
 *
 * Para ajustar o texto principal, edite os literais abaixo.
 * Para mudar as cores dos botões, edite emBreveHeroText.css.
 */
export default function EmBreveHeroText() {
  return (
    <div className="colunaTexto">
      <p className="textoSupratitulo">// Programação</p>

      <h1 className="tituloPrincipal">
        EM<br />
        <span className="tituloDestaque">BREVE</span>
      </h1>

      <div className="barraLaranja" />

      <p className="descricao">
        A grade completa de palestras está sendo finalizada com nossos convidados.{' '}
        <span className="descricaoEsmaecida">
          Volte em alguns dias para conferir quem sobe ao palco da XXXVI SEMAC.
        </span>
      </p>

      <div className="grupoDeAcoes">
        <button className="botao botaoPrimario">Avise-me ↗</button>
        <button className="botao botaoFantasma">@semac.ibilce</button>
      </div>
    </div>
  );
}

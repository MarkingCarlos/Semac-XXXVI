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
      <div className="colunaTexto" >
          <div className="subraTitulo">
              <span className="tracoHorizontal"/>
              <span className="styleSubraTitulo">Programação</span>
              <span className="tracoHorizontal"/>
          </div>
          <h1 className="tituloPrincipal">
              EM <span className="tituloDestaque">BREVE</span>
          </h1>

          <div>
              <p className="descricao">
                  A grade completa de palestras está sendo finalizada com nossos convidados.{' '}
              </p>
              <p className="descricao">
            <span className="descricaoEsmaecida">
                Volte em alguns dias para conferir quem sobe ao palco da SEMAC 2026.
            </span>
              </p>
          </div>

      </div>
  );
}

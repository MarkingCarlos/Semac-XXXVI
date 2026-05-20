/**
 * BracketCorners — decoração de colchetes angulares nos 4 cantos de um container.
 *
 * O container pai DEVE ter `position: relative` para os colchetes se posicionarem
 * corretamente. Passe `cor`, `tamanho` e `recuo` para ajustar o visual.
 *
 * @param {string}  cor     — cor do traço (padrão: laranja)
 * @param {number}  tamanho — largura/altura do SVG em px (padrão: 14)
 * @param {number}  recuo   — distância do canto em px (padrão: 8)
 */

function Colchete({ tamanho, cor, rotacao, style }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 16 16"
      fill="none"
      style={{ transform: `rotate(${rotacao}deg)`, position: 'absolute', ...style }}
    >
      <path d="M8 2H2V8" stroke={cor} strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export default function BracketCorners({ cor = '#E79839', tamanho = 14, recuo = 8 }) {
  return (
    <>
      <Colchete tamanho={tamanho} cor={cor} rotacao={0}   style={{ top: recuo,    left: recuo    }} />
      <Colchete tamanho={tamanho} cor={cor} rotacao={90}  style={{ top: recuo,    right: recuo   }} />
      <Colchete tamanho={tamanho} cor={cor} rotacao={270} style={{ bottom: recuo, left: recuo    }} />
      <Colchete tamanho={tamanho} cor={cor} rotacao={180} style={{ bottom: recuo, right: recuo   }} />
    </>
  );
}
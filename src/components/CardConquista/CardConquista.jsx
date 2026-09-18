import { useState } from 'preact/hooks';
import { urlImagemConquista } from '../../pages/Participantes/data/apiConquistasParticipante.js';
import ModalConquista from '../ModalConquista/ModalConquista.jsx';
import './cardConquista.css';

/* Card de uma conquista na área do participante.

   Um componente só porque a mesma grade aparece em três lugares — Início
   no mobile, Início na barra lateral do desktop e a aba Perfil. Antes eram
   três blocos de marcação quase idênticos; qualquer ajuste visual tinha
   que ser feito (e lembrado) três vezes.

   Conquistada sai colorida; bloqueada sai em preto e branco e apagada, mas
   com nome e descrição legíveis — a descrição é a meta a perseguir, então
   esconder não ajudaria ninguém.

   `compacto` é a variante da barra lateral e do mobile, onde só cabe
   imagem e nome. Tocar em qualquer card abre o detalhe (ver
   ModalConquista) — é lá que a descrição cabe por inteiro, o que importa
   justamente na variante compacta e nas conquistas ainda bloqueadas.

   O estado do modal fica aqui, e não na página: só um card pode estar
   aberto por vez, e assim as três grades que usam este componente não
   precisam repassar nada. */
export default function CardConquista({ conquista, compacto = false }) {
    const [detalheAberto, setDetalheAberto] = useState(false);

    const urlImagem = urlImagemConquista(conquista.id, conquista.imagemVersao);
    const desbloqueada = Boolean(conquista.desbloqueada);

    const classes = [
        'cardConquista',
        compacto ? 'cardConquistaCompacto' : '',
        desbloqueada ? 'cardConquistaDesbloqueada' : 'cardConquistaBloqueada',
        `cardConquistaRaridade${conquista.raridade ?? 1}`,
    ].filter(Boolean).join(' ');

    return (
        <>
        <button
            type="button"
            className={classes}
            title={conquista.descricao || undefined}
            aria-label={
                desbloqueada
                    ? `${conquista.nome}, conquistada. Ver detalhes`
                    : `${conquista.nome}, ainda não conquistada. Ver detalhes`
            }
            onClick={() => setDetalheAberto(true)}
        >
            <div className="molduraImagemCardConquista">
                {urlImagem ? (
                    <img className="imagemCardConquista" src={urlImagem} alt="" loading="lazy" />
                ) : (
                    <span className="marcadorSemImagemCardConquista" aria-hidden="true">?</span>
                )}
            </div>

            <span className="nomeCardConquista">{conquista.nome}</span>

            {!compacto && (
                <>
                    {conquista.descricao && (
                        <span className="descricaoCardConquista">{conquista.descricao}</span>
                    )}
                    <span className="pontosCardConquista">
                        {desbloqueada
                            ? `+${conquista.pontosBase} XP`
                            : `${conquista.pontosBase} XP`}
                    </span>
                </>
            )}
        </button>

        {detalheAberto && (
            <ModalConquista conquista={conquista} aoFechar={() => setDetalheAberto(false)} />
        )}
        </>
    );
}

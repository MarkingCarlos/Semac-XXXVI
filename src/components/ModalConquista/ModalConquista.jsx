import { useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { urlImagemConquista } from '../../pages/Participantes/data/apiConquistasParticipante.js';
import './modalConquista.css';

/* Detalhe de uma conquista, aberto ao tocar no card (ver CardConquista).

   Duas colunas: à esquerda o selo, o nome e quanto ela vale; à direita o
   que é preciso fazer para consegui-la.

   O selo segue a mesma metáfora do card e da animação de desbloqueio —
   preto e branco enquanto não foi conquistada, colorido depois. É por isso
   que o modal vale a pena mesmo na conquista bloqueada: na grade a
   descrição não cabe, e é ela que diz o que perseguir. */
export default function ModalConquista({ conquista, aoFechar }) {
    const botaoFecharRef = useRef(null);

    /* Fecha no Escape e trava a rolagem do fundo — mesmo comportamento do
       PainelLateral do módulo financeiro. */
    useEffect(() => {
        const aoTeclar = (evento) => {
            if (evento.key === 'Escape') aoFechar();
        };
        window.addEventListener('keydown', aoTeclar);
        document.body.style.overflow = 'hidden';
        botaoFecharRef.current?.focus();
        return () => {
            window.removeEventListener('keydown', aoTeclar);
            document.body.style.overflow = '';
        };
    }, [aoFechar]);

    const urlImagem = urlImagemConquista(conquista.id, conquista.imagemVersao);
    const desbloqueada = Boolean(conquista.desbloqueada);

    return createPortal(
        <div className="sobreposicaoModalConquista" onClick={aoFechar}>
            <div
                className={
                    desbloqueada
                        ? 'painelModalConquista painelDesbloqueadaModalConquista'
                        : 'painelModalConquista'
                }
                role="dialog"
                aria-modal="true"
                aria-label={conquista.nome}
                onClick={(evento) => evento.stopPropagation()}
            >
                <button
                    type="button"
                    className="botaoFecharModalConquista"
                    aria-label="Fechar"
                    ref={botaoFecharRef}
                    onClick={aoFechar}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="colunaSeloModalConquista">
                    <div
                        className={
                            desbloqueada
                                ? 'molduraSeloModalConquista'
                                : 'molduraSeloModalConquista molduraSeloBloqueadaModalConquista'
                        }
                    >
                        {urlImagem ? (
                            <img className="imagemSeloModalConquista" src={urlImagem} alt="" />
                        ) : (
                            <span className="marcadorSemImagemModalConquista" aria-hidden="true">?</span>
                        )}
                    </div>

                    <span className="nomeModalConquista">{conquista.nome}</span>
                    <span className="pontosModalConquista">
                        {desbloqueada ? `+${conquista.pontosBase} XP` : `${conquista.pontosBase} XP`}
                    </span>
                </div>

                <div className="colunaDescricaoModalConquista">
                    <span className="rotuloDescricaoModalConquista">
                        {desbloqueada ? 'COMO VOCÊ CONSEGUIU' : 'COMO CONSEGUIR'}
                    </span>
                    <p className="textoDescricaoModalConquista">
                        {conquista.descricao || 'Sem descrição cadastrada para esta conquista.'}
                    </p>
                </div>
            </div>
        </div>,
        document.body,
    );
}

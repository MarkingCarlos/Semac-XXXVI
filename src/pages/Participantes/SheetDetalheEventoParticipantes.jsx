/* Detalhe da atividade, aberto ao tocar numa palestra, mesa redonda ou
   minicurso: título, quem apresenta, horário, local e a descrição
   cadastrada no /admin — a mesma que a programação da página inicial
   mostra.

   Mobile: card que sobe de baixo, mesma coreografia do modal do crachá
   (ver fecharQr em Participantes.jsx) — sobe desacelerando, desce
   acelerando.
   Desktop: painel centralizado em duas colunas, no mesmo padrão do
   ModalConquista — surge com um leve deslize e escala.
   Com "reduzir movimento", só o fade. Enquanto aberto, o Lenis para e o
   conteúdo do card rola sozinho (data-lenis-prevent). */

import { useEffect, useRef } from 'preact/hooks';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

/* Mesmo breakpoint do CSS da área do participante. */
const CONSULTA_DESKTOP_SHEET_DETALHE_EVENTO = '(min-width: 860px)';

function animacaoCardSheetDetalheEvento(card, entrando) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return { autoAlpha: 0, duration: entrando ? 0.3 : 0.2, ease: entrando ? 'power1.out' : 'power1.in' };
    }
    if (window.matchMedia(CONSULTA_DESKTOP_SHEET_DETALHE_EVENTO).matches) {
        return entrando
            ? { autoAlpha: 0, y: 12, scale: 0.97, duration: 0.25, ease: 'expo.out' }
            : { autoAlpha: 0, y: 12, scale: 0.97, duration: 0.2, ease: 'power2.in' };
    }
    const distancia = window.innerHeight - card.getBoundingClientRect().top;
    return entrando
        ? { y: distancia, duration: 0.5, ease: 'expo.out' }
        : { y: distancia, duration: 0.3, ease: 'power3.in' };
}

export default function SheetDetalheEventoParticipantes({ evento, onFechar }) {
    const fundoSheetDetalheEventoRef = useRef(null);
    const cardSheetDetalheEventoRef = useRef(null);
    const botaoFecharSheetDetalheEventoRef = useRef(null);
    const fechandoSheetDetalheEventoRef = useRef(false);

    const { contextSafe } = useGSAP(() => {
        const card = cardSheetDetalheEventoRef.current;
        gsap.from(fundoSheetDetalheEventoRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' });
        gsap.from(card, animacaoCardSheetDetalheEvento(card, true));
    });

    const fechar = contextSafe(() => {
        if (fechandoSheetDetalheEventoRef.current) return;
        fechandoSheetDetalheEventoRef.current = true;

        const card = cardSheetDetalheEventoRef.current;
        gsap.to(fundoSheetDetalheEventoRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' });
        gsap.to(card, { ...animacaoCardSheetDetalheEvento(card, false), onComplete: onFechar });
    });

    useEffect(() => {
        window.lenis?.stop();
        botaoFecharSheetDetalheEventoRef.current?.focus({ preventScroll: true });
        const aoTeclar = (evento) => {
            if (evento.key === 'Escape') fechar();
        };
        window.addEventListener('keydown', aoTeclar);
        return () => {
            window.removeEventListener('keydown', aoTeclar);
            window.lenis?.start();
        };
    }, []);

    return (
        <div ref={fundoSheetDetalheEventoRef} className="fundoSheetDetalheEventoParticipantes" onClick={fechar}>
            <div
                ref={cardSheetDetalheEventoRef}
                className="cardSheetDetalheEventoParticipantes"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloSheetDetalheEventoParticipantes"
                onClick={(clique) => clique.stopPropagation()}
            >
                <span className="alcaSheetDetalheEventoParticipantes" aria-hidden="true" />

                <button
                    ref={botaoFecharSheetDetalheEventoRef}
                    type="button"
                    className="botaoFecharSheetDetalheEventoParticipantes"
                    aria-label="Fechar"
                    onClick={fechar}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="corpoSheetDetalheEventoParticipantes" data-lenis-prevent>
                    <div className="colunaInfoSheetDetalheEventoParticipantes">
                        <div className="linhaSeloSheetDetalheEventoParticipantes">
                            <span className="seloTipoSheetDetalheEventoParticipantes">{evento.tipo}</span>
                        </div>

                        <h2 id="tituloSheetDetalheEventoParticipantes" className="tituloSheetDetalheEventoParticipantes">
                            {evento.titulo}
                        </h2>

                        <div className="gradeInfoSheetDetalheEventoParticipantes">
                            <div className="campoInfoSheetDetalheEventoParticipantes">
                                <span className="rotuloInfoSheetDetalheEventoParticipantes">
                                    {evento.variosPalestrantes ? 'Palestrantes' : 'Palestrante'}
                                </span>
                                <span className="valorInfoSheetDetalheEventoParticipantes">
                                    {evento.palestrante || 'A confirmar'}
                                </span>
                            </div>
                            <div className="campoInfoSheetDetalheEventoParticipantes">
                                <span className="rotuloInfoSheetDetalheEventoParticipantes">Horário</span>
                                <span className="valorInfoSheetDetalheEventoParticipantes">{evento.diaHorario}</span>
                            </div>
                            <div className="campoInfoSheetDetalheEventoParticipantes">
                                <span className="rotuloInfoSheetDetalheEventoParticipantes">Local</span>
                                <span className="valorInfoSheetDetalheEventoParticipantes">{evento.local}</span>
                            </div>
                        </div>
                    </div>

                    <div className="colunaDescricaoSheetDetalheEventoParticipantes">
                        <span className="rotuloDescricaoSheetDetalheEventoParticipantes">Sobre a atividade</span>
                        <p className="descricaoSheetDetalheEventoParticipantes">
                            {evento.descricao || 'Descrição em breve.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

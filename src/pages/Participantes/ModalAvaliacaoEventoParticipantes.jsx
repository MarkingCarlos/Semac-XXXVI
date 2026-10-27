/* Pesquisa de satisfação de um evento: nota de 0 a 10, aberta pelo botão
   "Avaliar atividade" do card de detalhe. Só aparece para quem teve
   presença confirmada, depois que o evento terminou (o backend valida de
   novo). Quem já avaliou abre com a nota marcada e pode trocá-la.

   Abre por cima do SheetDetalheEventoParticipantes, com a mesma
   coreografia: sobe de baixo no mobile, surge com deslize e escala no
   desktop. O Lenis já foi parado pelo sheet de baixo, então este modal
   não mexe nele. O Esc é capturado aqui para fechar só este modal, e não
   o sheet junto. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { avaliarEvento } from './data/apiEventosParticipantes.js';

const NOTAS_AVALIACAO_EVENTO = Array.from({ length: 11 }, (_, nota) => nota);

/* Mesmo breakpoint do CSS da área do participante. */
const CONSULTA_DESKTOP_MODAL_AVALIACAO_EVENTO = '(min-width: 860px)';

function animacaoCardModalAvaliacaoEvento(card, entrando) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return { autoAlpha: 0, duration: entrando ? 0.3 : 0.2, ease: entrando ? 'power1.out' : 'power1.in' };
    }
    if (window.matchMedia(CONSULTA_DESKTOP_MODAL_AVALIACAO_EVENTO).matches) {
        return entrando
            ? { autoAlpha: 0, y: 12, scale: 0.97, duration: 0.25, ease: 'expo.out' }
            : { autoAlpha: 0, y: 12, scale: 0.97, duration: 0.2, ease: 'power2.in' };
    }
    const distancia = window.innerHeight - card.getBoundingClientRect().top;
    return entrando
        ? { y: distancia, duration: 0.5, ease: 'expo.out' }
        : { y: distancia, duration: 0.3, ease: 'power3.in' };
}

export default function ModalAvaliacaoEventoParticipantes({ evento, notaAtual, onAvaliado, onFechar, onConquistaConcedida }) {
    const fundoModalAvaliacaoEventoRef = useRef(null);
    const cardModalAvaliacaoEventoRef = useRef(null);
    const grupoNotasAvaliacaoEventoRef = useRef(null);
    const fechandoModalAvaliacaoEventoRef = useRef(false);

    const jaAvaliado = notaAtual !== null && notaAtual !== undefined;
    const [notaEscolhidaAvaliacaoEvento, setNotaEscolhidaAvaliacaoEvento] = useState(jaAvaliado ? notaAtual : null);
    const [enviandoAvaliacaoEvento, setEnviandoAvaliacaoEvento] = useState(false);
    const [erroAvaliacaoEvento, setErroAvaliacaoEvento] = useState('');
    const [mostrandoSucessoAvaliacaoEvento, setMostrandoSucessoAvaliacaoEvento] = useState(false);

    const { contextSafe } = useGSAP(() => {
        const card = cardModalAvaliacaoEventoRef.current;
        gsap.from(fundoModalAvaliacaoEventoRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' });
        gsap.from(card, animacaoCardModalAvaliacaoEvento(card, true));
    });

    const fechar = contextSafe(() => {
        if (fechandoModalAvaliacaoEventoRef.current) return;
        fechandoModalAvaliacaoEventoRef.current = true;

        const card = cardModalAvaliacaoEventoRef.current;
        gsap.to(fundoModalAvaliacaoEventoRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' });
        gsap.to(card, { ...animacaoCardModalAvaliacaoEvento(card, false), onComplete: onFechar });
    });

    useEffect(() => {
        /* Foca a nota marcada (ou a primeira): as setas trocam a nota. */
        const grupo = grupoNotasAvaliacaoEventoRef.current;
        (grupo?.querySelector('[aria-checked="true"]') ?? grupo?.querySelector('button'))?.focus({ preventScroll: true });
        const aoTeclar = (tecla) => {
            if (tecla.key !== 'Escape') return;
            tecla.stopPropagation();
            fechar();
        };
        window.addEventListener('keydown', aoTeclar, true);
        return () => window.removeEventListener('keydown', aoTeclar, true);
    }, []);

    /* Radiogroup: setas andam entre as notas, como num <input type=radio>. */
    function navegarNotasPorTeclado(tecla) {
        const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[tecla.key];
        if (passo === undefined) return;
        tecla.preventDefault();
        const base = notaEscolhidaAvaliacaoEvento ?? (passo > 0 ? -1 : 11);
        const proxima = Math.min(10, Math.max(0, base + passo));
        setNotaEscolhidaAvaliacaoEvento(proxima);
        grupoNotasAvaliacaoEventoRef.current?.querySelectorAll('button')[proxima]?.focus();
    }

    const podeEnviarAvaliacaoEvento = notaEscolhidaAvaliacaoEvento !== null
        && !enviandoAvaliacaoEvento
        && notaEscolhidaAvaliacaoEvento !== notaAtual;

    async function enviar(envio) {
        envio.preventDefault();
        if (!podeEnviarAvaliacaoEvento) return;
        setEnviandoAvaliacaoEvento(true);
        setErroAvaliacaoEvento('');
        try {
            const respostaAvaliacaoEvento = await avaliarEvento(evento.id, notaEscolhidaAvaliacaoEvento);
            if (!respostaAvaliacaoEvento) return;
            onAvaliado(evento.id, respostaAvaliacaoEvento.nota);
            if (respostaAvaliacaoEvento.conquistaConcedida) onConquistaConcedida?.();
            setMostrandoSucessoAvaliacaoEvento(true);
        } catch (erro) {
            setErroAvaliacaoEvento(erro.message);
        } finally {
            setEnviandoAvaliacaoEvento(false);
        }
    }

    return (
        <div ref={fundoModalAvaliacaoEventoRef} className="fundoModalAvaliacaoEventoParticipantes" onClick={fechar}>
            <div
                ref={cardModalAvaliacaoEventoRef}
                className="cardModalAvaliacaoEventoParticipantes"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalAvaliacaoEventoParticipantes"
                onClick={(clique) => clique.stopPropagation()}
            >
                <span className="alcaSheetDetalheEventoParticipantes" aria-hidden="true" />

                <span className="seloTipoSheetDetalheEventoParticipantes seloModalAvaliacaoEventoParticipantes">
                    AVALIAÇÃO
                </span>
                <h2 id="tituloModalAvaliacaoEventoParticipantes" className="tituloModalAvaliacaoEventoParticipantes">
                    {evento.titulo}
                </h2>

                {mostrandoSucessoAvaliacaoEvento ? (
                    <div className="blocoSucessoModalAvaliacaoEventoParticipantes" role="status">
                        <span className="tituloSucessoModalAvaliacaoEventoParticipantes">Valeu pela avaliação!</span>
                        <span className="textoSucessoModalAvaliacaoEventoParticipantes">
                            Sua nota {notaEscolhidaAvaliacaoEvento} ajuda a comissão a fazer a próxima SEMAC ainda melhor.
                        </span>
                        <div className="acoesModalAvaliacaoEventoParticipantes">
                            <button
                                type="button"
                                className="botaoPrimarioModalAvaliacaoEventoParticipantes"
                                onClick={fechar}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="formularioModalAvaliacaoEventoParticipantes" onSubmit={enviar}>
                        <span id="perguntaModalAvaliacaoEventoParticipantes" className="perguntaModalAvaliacaoEventoParticipantes">
                            De 0 a 10, que nota você dá para esta atividade?
                        </span>

                        <div
                            ref={grupoNotasAvaliacaoEventoRef}
                            className="grupoNotasAvaliacaoEventoParticipantes"
                            role="radiogroup"
                            aria-labelledby="perguntaModalAvaliacaoEventoParticipantes"
                            onKeyDown={navegarNotasPorTeclado}
                        >
                            {NOTAS_AVALIACAO_EVENTO.map((nota) => {
                                const marcada = nota === notaEscolhidaAvaliacaoEvento;
                                return (
                                    <button
                                        key={nota}
                                        type="button"
                                        role="radio"
                                        aria-checked={marcada}
                                        tabIndex={marcada || (notaEscolhidaAvaliacaoEvento === null && nota === 0) ? 0 : -1}
                                        className={
                                            marcada
                                                ? 'botaoNotaAvaliacaoEventoParticipantes botaoNotaMarcadaAvaliacaoEventoParticipantes'
                                                : 'botaoNotaAvaliacaoEventoParticipantes'
                                        }
                                        onClick={() => setNotaEscolhidaAvaliacaoEvento(nota)}
                                    >
                                        {nota}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="legendaNotasAvaliacaoEventoParticipantes" aria-hidden="true">
                            <span>Não gostei</span>
                            <span>Adorei</span>
                        </div>

                        {erroAvaliacaoEvento && (
                            <p className="erroModalAvaliacaoEventoParticipantes" role="alert">{erroAvaliacaoEvento}</p>
                        )}

                        <div className="acoesModalAvaliacaoEventoParticipantes">
                            <button
                                type="button"
                                className="botaoSecundarioModalAvaliacaoEventoParticipantes"
                                onClick={fechar}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="botaoPrimarioModalAvaliacaoEventoParticipantes"
                                disabled={!podeEnviarAvaliacaoEvento}
                            >
                                {enviandoAvaliacaoEvento ? 'Enviando…' : jaAvaliado ? 'Trocar nota' : 'Enviar nota'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

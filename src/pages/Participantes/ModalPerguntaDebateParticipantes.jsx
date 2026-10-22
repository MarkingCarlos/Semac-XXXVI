/* Envio de pergunta prévia para um debate, aberto pelo botão "Mande sua
   pergunta" do card de detalhe. O participante pode mandar quantas quiser
   (o backend limita por debate); depois de cada envio o modal oferece
   escrever outra.

   Abre por cima do SheetDetalheEventoParticipantes, com a mesma
   coreografia: sobe de baixo no mobile, surge com deslize e escala no
   desktop. O Lenis já foi parado pelo sheet de baixo, então este modal
   não mexe nele. O Esc é capturado aqui para fechar só este modal, e não
   o sheet junto. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { enviarPerguntaDebate } from './data/apiEventosParticipantes.js';

/* Mesmo limite validado no backend (PerguntaDebateRequestDTO). */
const LIMITE_CARACTERES_PERGUNTA_DEBATE = 500;

/* Mesmo breakpoint do CSS da área do participante. */
const CONSULTA_DESKTOP_MODAL_PERGUNTA_DEBATE = '(min-width: 860px)';

function animacaoCardModalPerguntaDebate(card, entrando) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return { autoAlpha: 0, duration: entrando ? 0.3 : 0.2, ease: entrando ? 'power1.out' : 'power1.in' };
    }
    if (window.matchMedia(CONSULTA_DESKTOP_MODAL_PERGUNTA_DEBATE).matches) {
        return entrando
            ? { autoAlpha: 0, y: 12, scale: 0.97, duration: 0.25, ease: 'expo.out' }
            : { autoAlpha: 0, y: 12, scale: 0.97, duration: 0.2, ease: 'power2.in' };
    }
    const distancia = window.innerHeight - card.getBoundingClientRect().top;
    return entrando
        ? { y: distancia, duration: 0.5, ease: 'expo.out' }
        : { y: distancia, duration: 0.3, ease: 'power3.in' };
}

export default function ModalPerguntaDebateParticipantes({ evento, onFechar, onConquistaConcedida }) {
    const fundoModalPerguntaDebateRef = useRef(null);
    const cardModalPerguntaDebateRef = useRef(null);
    const campoTextoPerguntaDebateRef = useRef(null);
    const fechandoModalPerguntaDebateRef = useRef(false);

    const [textoPerguntaDebate, setTextoPerguntaDebate] = useState('');
    const [enviandoPerguntaDebate, setEnviandoPerguntaDebate] = useState(false);
    const [erroPerguntaDebate, setErroPerguntaDebate] = useState('');
    const [perguntasEnviadasDebate, setPerguntasEnviadasDebate] = useState(0);
    const [mostrandoSucessoPerguntaDebate, setMostrandoSucessoPerguntaDebate] = useState(false);

    const { contextSafe } = useGSAP(() => {
        const card = cardModalPerguntaDebateRef.current;
        gsap.from(fundoModalPerguntaDebateRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' });
        gsap.from(card, animacaoCardModalPerguntaDebate(card, true));
    });

    const fechar = contextSafe(() => {
        if (fechandoModalPerguntaDebateRef.current) return;
        fechandoModalPerguntaDebateRef.current = true;

        const card = cardModalPerguntaDebateRef.current;
        gsap.to(fundoModalPerguntaDebateRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' });
        gsap.to(card, { ...animacaoCardModalPerguntaDebate(card, false), onComplete: onFechar });
    });

    useEffect(() => {
        campoTextoPerguntaDebateRef.current?.focus({ preventScroll: true });
        const aoTeclar = (tecla) => {
            if (tecla.key !== 'Escape') return;
            tecla.stopPropagation();
            fechar();
        };
        window.addEventListener('keydown', aoTeclar, true);
        return () => window.removeEventListener('keydown', aoTeclar, true);
    }, []);

    const textoLimpoPerguntaDebate = textoPerguntaDebate.trim();
    const podeEnviarPerguntaDebate = textoLimpoPerguntaDebate.length > 0 && !enviandoPerguntaDebate;

    async function enviar(envio) {
        envio.preventDefault();
        if (!podeEnviarPerguntaDebate) return;
        setEnviandoPerguntaDebate(true);
        setErroPerguntaDebate('');
        try {
            const respostaPerguntaDebate = await enviarPerguntaDebate(evento.id, textoLimpoPerguntaDebate);
            if (respostaPerguntaDebate?.conquistaConcedida) onConquistaConcedida?.();
            setPerguntasEnviadasDebate((total) => total + 1);
            setTextoPerguntaDebate('');
            setMostrandoSucessoPerguntaDebate(true);
        } catch (erro) {
            setErroPerguntaDebate(erro.message);
        } finally {
            setEnviandoPerguntaDebate(false);
        }
    }

    function escreverOutraPergunta() {
        setMostrandoSucessoPerguntaDebate(false);
        /* Espera o textarea voltar ao DOM para focar. */
        requestAnimationFrame(() => campoTextoPerguntaDebateRef.current?.focus({ preventScroll: true }));
    }

    return (
        <div ref={fundoModalPerguntaDebateRef} className="fundoModalPerguntaDebateParticipantes" onClick={fechar}>
            <div
                ref={cardModalPerguntaDebateRef}
                className="cardModalPerguntaDebateParticipantes"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalPerguntaDebateParticipantes"
                onClick={(clique) => clique.stopPropagation()}
            >
                <span className="alcaSheetDetalheEventoParticipantes" aria-hidden="true" />

                <span className="seloTipoSheetDetalheEventoParticipantes seloModalPerguntaDebateParticipantes">
                    DEBATE
                </span>
                <h2 id="tituloModalPerguntaDebateParticipantes" className="tituloModalPerguntaDebateParticipantes">
                    {evento.titulo}
                </h2>

                {mostrandoSucessoPerguntaDebate ? (
                    <div className="blocoSucessoModalPerguntaDebateParticipantes" role="status">
                        <span className="tituloSucessoModalPerguntaDebateParticipantes">Pergunta enviada!</span>
                        <span className="textoSucessoModalPerguntaDebateParticipantes">
                            {perguntasEnviadasDebate === 1
                                ? 'A organização vai levar sua pergunta para o debate.'
                                : `Você já mandou ${perguntasEnviadasDebate} perguntas para este debate.`}
                        </span>
                        <div className="acoesModalPerguntaDebateParticipantes">
                            <button
                                type="button"
                                className="botaoSecundarioModalPerguntaDebateParticipantes"
                                onClick={fechar}
                            >
                                Fechar
                            </button>
                            <button
                                type="button"
                                className="botaoPrimarioModalPerguntaDebateParticipantes"
                                onClick={escreverOutraPergunta}
                            >
                                Mandar outra
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="formularioModalPerguntaDebateParticipantes" onSubmit={enviar}>
                        <label
                            htmlFor="campoTextoPerguntaDebateParticipantes"
                            className="rotuloInfoSheetDetalheEventoParticipantes"
                        >
                            Sua pergunta
                        </label>
                        <textarea
                            id="campoTextoPerguntaDebateParticipantes"
                            ref={campoTextoPerguntaDebateRef}
                            className="campoTextoPerguntaDebateParticipantes"
                            rows={5}
                            maxLength={LIMITE_CARACTERES_PERGUNTA_DEBATE}
                            placeholder="O que você quer perguntar aos debatedores?"
                            value={textoPerguntaDebate}
                            onInput={(digitacao) => setTextoPerguntaDebate(digitacao.currentTarget.value)}
                            data-lenis-prevent
                        />
                        <span className="contadorCaracteresPerguntaDebateParticipantes" aria-live="polite">
                            {textoPerguntaDebate.length}/{LIMITE_CARACTERES_PERGUNTA_DEBATE}
                        </span>

                        {erroPerguntaDebate && (
                            <p className="erroModalPerguntaDebateParticipantes" role="alert">{erroPerguntaDebate}</p>
                        )}

                        <div className="acoesModalPerguntaDebateParticipantes">
                            <button
                                type="button"
                                className="botaoSecundarioModalPerguntaDebateParticipantes"
                                onClick={fechar}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="botaoPrimarioModalPerguntaDebateParticipantes"
                                disabled={!podeEnviarPerguntaDebate}
                            >
                                {enviandoPerguntaDebate ? 'Enviando…' : 'Enviar pergunta'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

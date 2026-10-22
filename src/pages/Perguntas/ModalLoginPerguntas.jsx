import { useEffect, useRef } from 'preact/hooks';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

/* Painel que sobe da borda de baixo quando alguém sem login toca em
   "Enviar pergunta" na página /perguntas: oferece entrar antes (e ganhar
   a conquista) ou enviar assim mesmo. Sobe de baixo também no desktop.

   Quem decide o que fazer é a página: `aoFechar` recebe a escolha
   ('entrar' | 'enviarSemLogin' | null) só depois da animação de saída,
   para o envio ou a navegação não cortarem o painel no meio. */

function animacaoPainelModalLoginPerguntas(entrando) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return { autoAlpha: 0, duration: entrando ? 0.3 : 0.2, ease: entrando ? 'power1.out' : 'power1.in' };
    }
    return entrando
        ? { yPercent: 100, duration: 0.5, ease: 'expo.out' }
        : { yPercent: 100, duration: 0.3, ease: 'power3.in' };
}

export default function ModalLoginPerguntas({ aoFechar }) {
    const fundoModalLoginPerguntasRef = useRef(null);
    const painelModalLoginPerguntasRef = useRef(null);
    const botaoEntrarModalLoginPerguntasRef = useRef(null);
    const fechandoModalLoginPerguntasRef = useRef(false);

    const { contextSafe } = useGSAP(() => {
        gsap.from(fundoModalLoginPerguntasRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' });
        gsap.from(painelModalLoginPerguntasRef.current, animacaoPainelModalLoginPerguntas(true));
    });

    const fechar = contextSafe((escolha) => {
        if (fechandoModalLoginPerguntasRef.current) return;
        fechandoModalLoginPerguntasRef.current = true;
        gsap.to(fundoModalLoginPerguntasRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' });
        gsap.to(painelModalLoginPerguntasRef.current, {
            ...animacaoPainelModalLoginPerguntas(false),
            onComplete: () => aoFechar(escolha),
        });
    });

    useEffect(() => {
        botaoEntrarModalLoginPerguntasRef.current?.focus({ preventScroll: true });
        const aoTeclar = (tecla) => {
            if (tecla.key === 'Escape') fechar(null);
        };
        window.addEventListener('keydown', aoTeclar);
        return () => window.removeEventListener('keydown', aoTeclar);
    }, []);

    return (
        <div
            ref={fundoModalLoginPerguntasRef}
            className="fundoModalLoginPerguntas"
            onClick={() => fechar(null)}
        >
            <div
                ref={painelModalLoginPerguntasRef}
                className="painelModalLoginPerguntas"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalLoginPerguntas"
                aria-describedby="textoModalLoginPerguntas"
                onClick={(clique) => clique.stopPropagation()}
            >
                <span className="alcaModalLoginPerguntas" aria-hidden="true" />

                <h2 id="tituloModalLoginPerguntas" className="tituloModalLoginPerguntas">
                    QUER ENTRAR ANTES DE ENVIAR?
                </h2>
                <p id="textoModalLoginPerguntas" className="textoModalLoginPerguntas">
                    Se você é inscrito na SEMAC, entre com a sua conta: a sua primeira pergunta para o
                    debate desbloqueia uma <strong className="destaqueModalLoginPerguntas">conquista</strong>.
                    
                </p>

                <div className="acoesModalLoginPerguntas">
                    <button
                        ref={botaoEntrarModalLoginPerguntasRef}
                        type="button"
                        className="botaoPrincipalPerguntas"
                        onClick={() => fechar('entrar')}
                    >
                        ENTRAR E GANHAR A CONQUISTA
                    </button>
                    <button
                        type="button"
                        className="botaoSecundarioPerguntas"
                        onClick={() => fechar('enviarSemLogin')}
                    >
                        ENVIAR SEM LOGIN
                    </button>
                </div>
            </div>
        </div>
    );
}

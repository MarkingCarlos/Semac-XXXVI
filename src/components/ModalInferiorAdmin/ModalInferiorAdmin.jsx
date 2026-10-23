import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import './modalInferiorAdmin.css';

/* Modal que sobe de baixo para cima, usado no mobile do /admin (seletor
   de sub-abas, detalhes de pessoa). Mesmo desenho dos modais do
   dashboard (modalTopoDashboard.css).

   Quem usa monta o componente para abrir e recebe `aoFechar` quando a
   animação de descida termina — aí desmonta. `children` pode ser uma
   função que recebe `fechar(depoisDeFechar?)`, para o conteúdo fechar o
   modal com animação e, se precisar, abrir outra coisa só depois (ex.:
   outro modal, sem empilhar um sobre o outro).

   Foco inicial: o primeiro elemento com `data-foco-inicial`, ou o X.

   `centralizadoNoDesktop`: acima de 820px o painel vira um modal no
   centro da tela, com 50% da largura e da altura, entrando e saindo com
   fade e escala. No mobile continua subindo de baixo. Sem a prop, nada
   muda para quem já usa o componente. */

const DURACAO_SAIDA_MODAL_INFERIOR_MS = 260;

export default function ModalInferiorAdmin({ titulo, subtitulo, aoFechar, centralizadoNoDesktop = false, children }) {
    const [modalInferiorSaindo, setModalInferiorSaindo] = useState(false);
    const painelModalInferiorRef = useRef(null);
    const botaoFecharModalInferiorRef = useRef(null);
    const temporizadorSaidaModalInferiorRef = useRef(null);
    const fechandoModalInferiorRef = useRef(false);

    /* Com "reduzir movimento" o CSS zera a animação; o atraso continua,
       mas é curto o bastante para não parecer travado. */
    function fecharModalInferior(depoisDeFechar) {
        if (fechandoModalInferiorRef.current) return;
        fechandoModalInferiorRef.current = true;
        setModalInferiorSaindo(true);
        temporizadorSaidaModalInferiorRef.current = setTimeout(() => {
            aoFechar();
            depoisDeFechar?.();
        }, DURACAO_SAIDA_MODAL_INFERIOR_MS);
    }

    /* Escape fecha; a página de trás não rola (body travado e Lenis
       parado) enquanto o modal está montado. */
    useEffect(() => {
        function fecharAoTeclarEscapeModalInferior(evento) {
            if (evento.key === 'Escape') fecharModalInferior();
        }
        window.addEventListener('keydown', fecharAoTeclarEscapeModalInferior);
        document.body.style.overflow = 'hidden';
        window.lenis?.stop();

        const alvoFocoInicial =
            painelModalInferiorRef.current?.querySelector('[data-foco-inicial]') ?? botaoFecharModalInferiorRef.current;
        alvoFocoInicial?.focus({ preventScroll: true });

        return () => {
            window.removeEventListener('keydown', fecharAoTeclarEscapeModalInferior);
            document.body.style.overflow = '';
            window.lenis?.start();
            clearTimeout(temporizadorSaidaModalInferiorRef.current);
        };
    }, []);

    /* Portal para o body: ancestrais com transform (animação de entrada
       das seções) prenderiam o position: fixed na seção. */
    const classeSobreposicaoModalInferior = [
        'sobreposicaoModalInferiorAdmin',
        centralizadoNoDesktop && 'sobreposicaoCentralizadaModalInferiorAdmin',
        modalInferiorSaindo && 'sobreposicaoSaindoModalInferiorAdmin',
    ].filter(Boolean).join(' ');

    return createPortal(
        <div
            className={classeSobreposicaoModalInferior}
            onClick={() => fecharModalInferior()}
        >
            <div
                ref={painelModalInferiorRef}
                className={
                    modalInferiorSaindo
                        ? 'painelModalInferiorAdmin painelSaindoModalInferiorAdmin'
                        : 'painelModalInferiorAdmin'
                }
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                onClick={(evento) => evento.stopPropagation()}
            >
                <div className="cabecalhoModalInferiorAdmin">
                    <div className="textosCabecalhoModalInferiorAdmin">
                        <h2 className="tituloModalInferiorAdmin">{titulo}</h2>
                        {subtitulo && <p className="subtituloModalInferiorAdmin">{subtitulo}</p>}
                    </div>
                    <button
                        type="button"
                        ref={botaoFecharModalInferiorRef}
                        className="botaoFecharModalInferiorAdmin"
                        aria-label="Fechar"
                        onClick={() => fecharModalInferior()}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="corpoModalInferiorAdmin">
                    {typeof children === 'function' ? children(fecharModalInferior) : children}
                </div>
            </div>
        </div>,
        document.body,
    );
}

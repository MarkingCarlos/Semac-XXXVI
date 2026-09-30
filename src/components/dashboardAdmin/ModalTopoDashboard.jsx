import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import './modalTopoDashboard.css';

const DURACAO_SAIDA_MS = 260;

/* Casca dos modais da dashboard: desce do topo da tela e sobe de volta ao
   fechar. Fecha com Esc, com o X ou clicando fora do painel.

   O Lenis (scroll suave global, ver index.html) é pausado enquanto o
   modal está aberto, e o corpo rolável leva data-lenis-prevent para a
   roda do mouse rolar a lista e não a página de trás.

   Props:
     titulo, subtitulo — cabeçalho do painel
     aoVoltar          — opcional; mostra "← Voltar" (navegação interna)
     aoFechar          — () => void, chamado depois da animação de saída
     children          — conteúdo rolável */
export default function ModalTopoDashboard({ titulo, subtitulo, aoVoltar, aoFechar, children }) {
    const [saindo, setSaindo] = useState(false);
    const botaoFecharRef = useRef(null);
    const corpoRef = useRef(null);
    const timeoutSaidaRef = useRef(null);
    // Ref além do state: o listener de Esc é registrado uma vez só e
    // leria um `saindo` congelado.
    const saindoRef = useRef(false);

    function fechar() {
        if (saindoRef.current) return;
        saindoRef.current = true;
        setSaindo(true);
        const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        timeoutSaidaRef.current = setTimeout(aoFechar, reduzirMovimento ? 0 : DURACAO_SAIDA_MS);
    }

    useEffect(() => {
        botaoFecharRef.current?.focus();
        window.lenis?.stop();
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function aoTeclar(evento) {
            if (evento.key === 'Escape') fechar();
        }
        document.addEventListener('keydown', aoTeclar);

        return () => {
            document.removeEventListener('keydown', aoTeclar);
            document.body.style.overflow = overflowAnterior;
            window.lenis?.start();
            clearTimeout(timeoutSaidaRef.current);
        };
    }, []);

    // Trocar de tela dentro do modal (título novo) volta a lista ao topo.
    useEffect(() => {
        if (corpoRef.current) corpoRef.current.scrollTop = 0;
    }, [titulo]);

    return createPortal(
        <div
            className={`sobreposicaoModalTopoDashboard ${saindo ? 'sobreposicaoSaindoModalTopoDashboard' : ''}`}
            onClick={fechar}
        >
            <div
                className={`painelModalTopoDashboard ${saindo ? 'painelSaindoModalTopoDashboard' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                onClick={(evento) => evento.stopPropagation()}
            >
                <header className="cabecalhoModalTopoDashboard">
                    <div className="textosCabecalhoModalTopoDashboard">
                        {aoVoltar && (
                            <button type="button" className="botaoVoltarModalTopoDashboard" onClick={aoVoltar}>
                                ← Voltar
                            </button>
                        )}
                        <h2 className="tituloModalTopoDashboard">{titulo}</h2>
                        {subtitulo && <p className="subtituloModalTopoDashboard">{subtitulo}</p>}
                    </div>
                    <button
                        type="button"
                        ref={botaoFecharRef}
                        className="botaoFecharModalTopoDashboard"
                        aria-label="Fechar"
                        onClick={fechar}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </header>

                <div className="corpoModalTopoDashboard" ref={corpoRef} data-lenis-prevent>
                    {children}
                </div>

                <span className="alcaModalTopoDashboard" aria-hidden="true" />
            </div>
        </div>,
        document.body
    );
}

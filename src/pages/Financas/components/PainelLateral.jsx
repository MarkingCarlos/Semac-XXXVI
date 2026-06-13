import { useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import './painelLateral.css';

/* Painel deslizante que entra pela direita. Usado por todos os
   formulários do módulo financeiro (compras, patrocínios). */
export default function PainelLateral({ aberto, titulo, aoFechar, children }) {
    /* Fecha com Escape e trava o scroll do body enquanto aberto */
    useEffect(() => {
        if (!aberto) return;
        const aoTeclar = (evento) => {
            if (evento.key === 'Escape') aoFechar();
        };
        window.addEventListener('keydown', aoTeclar);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', aoTeclar);
            document.body.style.overflow = '';
        };
    }, [aberto, aoFechar]);

    if (!aberto) return null;

    /* Portal para o body — ancestrais com transform (animação de entrada
       das seções) criariam um containing block e o position: fixed do
       painel ficaria preso à seção em vez de cobrir a viewport inteira. */
    return createPortal(
        <div className="fundoPainelLateralFinancas" onClick={aoFechar}>
            <aside
                className="painelLateralFinancas"
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                onClick={(evento) => evento.stopPropagation()}
            >
                <header className="cabecalhoPainelLateralFinancas">
                    <h2 className="tituloPainelLateralFinancas">{titulo}</h2>
                    <button
                        type="button"
                        className="botaoFecharPainelFinancas"
                        aria-label="Fechar painel"
                        onClick={aoFechar}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </header>
                <div className="corpoPainelLateralFinancas">{children}</div>
            </aside>
        </div>,
        document.body,
    );
}

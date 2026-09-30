/* Menu de navegação dos módulos internos (/admin e /financeiro) no mobile:
   o mesmo botão flutuante (FAB) da área do participante, que abre as seções
   em leque sobre o conteúdo escurecido. Substitui, só no mobile, a navbar
   flutuante horizontal — que com 8+ seções virava uma faixa com scroll.

   No desktop (>820px) some: lá a navbar flutuante continua valendo.
   Cada seção traz sua `marca` (letra do disco) e `classeMarcador` (cor). */

import { useEffect, useRef, useState } from 'preact/hooks';
import './menuFabModulos.css';

/* Abrindo, os itens entram de baixo pra cima — o mais perto do botão
   primeiro. Fechando, saem na ordem inversa e mais rápido. */
const ATRASO_ENTRADA_ITEM_MENU_FAB_MODULOS = 35;
const ATRASO_SAIDA_ITEM_MENU_FAB_MODULOS = 20;

export default function MenuFabModulos({ secoes, secaoAtiva, onIrPara, onSair, rotuloMenu }) {
    const [aberto, setAberto] = useState(false);
    const botaoFabRef = useRef(null);

    /* Escape fecha e devolve o foco pro botão. Só escuta enquanto aberto. */
    useEffect(() => {
        if (!aberto) return undefined;

        function fecharAoTeclarEscapeNoMenuFabModulos(evento) {
            if (evento.key !== 'Escape') return;
            setAberto(false);
            botaoFabRef.current?.focus();
        }

        document.addEventListener('keydown', fecharAoTeclarEscapeNoMenuFabModulos);
        return () => document.removeEventListener('keydown', fecharAoTeclarEscapeNoMenuFabModulos);
    }, [aberto]);

    function escolherSecaoNoMenuFabModulos(idSecao) {
        setAberto(false);
        onIrPara(idSecao);
    }

    /* "Sair" vai no topo do leque, longe do polegar, para não ser tocado
       por engano. Conta como um item a mais no cálculo dos atrasos. */
    const totalItens = secoes.length + 1;

    function atrasoDoItemMenuFabModulos(indice) {
        return aberto
            ? (totalItens - 1 - indice) * ATRASO_ENTRADA_ITEM_MENU_FAB_MODULOS
            : indice * ATRASO_SAIDA_ITEM_MENU_FAB_MODULOS;
    }

    return (
        <>
            <div
                className={
                    aberto
                        ? 'fundoEscuroMenuFabModulos fundoEscuroAbertoMenuFabModulos'
                        : 'fundoEscuroMenuFabModulos'
                }
                onClick={() => setAberto(false)}
            />

            <div
                id="listaItensMenuFabModulos"
                className={
                    aberto
                        ? 'listaItensMenuFabModulos listaItensAbertaMenuFabModulos'
                        : 'listaItensMenuFabModulos'
                }
                role="menu"
                aria-label={rotuloMenu}
            >
                <button
                    type="button"
                    role="menuitem"
                    tabIndex={aberto ? 0 : -1}
                    className="itemMenuFabModulos itemSairMenuFabModulos"
                    style={{ transitionDelay: `${atrasoDoItemMenuFabModulos(0)}ms` }}
                    onClick={() => {
                        setAberto(false);
                        onSair();
                    }}
                >
                    <span className="rotuloItemMenuFabModulos">SAIR</span>
                    <span className="marcadorItemMenuFabModulos marcadorSairMenuFabModulos">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </span>
                </button>

                {secoes.map((secao, indiceSecao) => {
                    const ativa = secao.id === secaoAtiva;

                    return (
                        <button
                            key={secao.id}
                            type="button"
                            role="menuitem"
                            tabIndex={aberto ? 0 : -1}
                            aria-current={ativa ? 'page' : undefined}
                            className={
                                ativa
                                    ? 'itemMenuFabModulos itemAtivoMenuFabModulos'
                                    : 'itemMenuFabModulos'
                            }
                            style={{ transitionDelay: `${atrasoDoItemMenuFabModulos(indiceSecao + 1)}ms` }}
                            onClick={() => escolherSecaoNoMenuFabModulos(secao.id)}
                        >
                            <span className="rotuloItemMenuFabModulos">{secao.rotulo.toUpperCase()}</span>
                            <span className={`marcadorItemMenuFabModulos ${secao.classeMarcador}`}>
                                {secao.marca}
                            </span>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                ref={botaoFabRef}
                className={
                    aberto
                        ? 'botaoFabMenuModulos botaoFabAbertoMenuModulos'
                        : 'botaoFabMenuModulos'
                }
                aria-haspopup="menu"
                aria-expanded={aberto}
                aria-controls="listaItensMenuFabModulos"
                aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setAberto((estavaAberto) => !estavaAberto)}
            >
                <span className="barraTopoBotaoFabModulos" />
                <span className="barraMeioBotaoFabModulos" />
                <span className="barraBaseBotaoFabModulos" />
            </button>
        </>
    );
}

/* Menu de navegação do participante no mobile: um botão flutuante (FAB) no
   canto inferior direito que abre as abas em leque, sobre o conteúdo
   escurecido. Substitui a barra fixa de baixo — o conteúdo ganha a altura
   dela de volta, e o botão fica sempre ao alcance do polegar.

   No desktop (>=860px) some: lá a navegação continua sendo a linha de abas
   do cabeçalho (ver navDesktopParticipantes em Participantes.jsx). */

import { useEffect, useRef, useState } from 'preact/hooks';

/* Marca e cor de cada aba. Fica aqui, e não em ABAS_PARTICIPANTES, porque
   só o FAB desenha os discos coloridos — a nav do cabeçalho é texto puro. */
const ESTILOS_ABAS_MENU_FAB_PARTICIPANTES = {
    inicio:   { marca: 'I', classeMarcador: 'marcadorInicioMenuFabParticipantes' },
    agenda:   { marca: 'A', classeMarcador: 'marcadorAgendaMenuFabParticipantes' },
    desafios: { marca: 'D', classeMarcador: 'marcadorDesafiosMenuFabParticipantes' },
    ranking:  { marca: 'R', classeMarcador: 'marcadorRankingMenuFabParticipantes' },
    perfil:   { marca: 'P', classeMarcador: 'marcadorPerfilMenuFabParticipantes' },
};

/* Abrindo, os itens entram de baixo pra cima — o mais perto do botão
   primeiro, como se saíssem dele. Fechando, saem na ordem inversa e mais
   rápido: ninguém quer esperar um menu sumir. */
const ATRASO_ENTRADA_ITEM_MENU_FAB_PARTICIPANTES = 45;
const ATRASO_SAIDA_ITEM_MENU_FAB_PARTICIPANTES = 25;

export default function MenuFabParticipantes({ abas, abaAtiva, onIrPara }) {
    const [aberto, setAberto] = useState(false);
    const botaoFabRef = useRef(null);

    /* Escape fecha e devolve o foco pro botão, como no menu da conta. Só
       escuta enquanto está aberto. */
    useEffect(() => {
        if (!aberto) return undefined;

        function fecharAoTeclarEscapeNoMenuFab(evento) {
            if (evento.key !== 'Escape') return;
            setAberto(false);
            botaoFabRef.current?.focus();
        }

        document.addEventListener('keydown', fecharAoTeclarEscapeNoMenuFab);
        return () => document.removeEventListener('keydown', fecharAoTeclarEscapeNoMenuFab);
    }, [aberto]);

    function escolherAbaNoMenuFab(aba) {
        setAberto(false);
        onIrPara(aba);
    }

    const totalItens = abas.length;

    return (
        <>
            <div
                className={
                    aberto
                        ? 'fundoEscuroMenuFabParticipantes fundoEscuroAbertoMenuFabParticipantes'
                        : 'fundoEscuroMenuFabParticipantes'
                }
                onClick={() => setAberto(false)}
            />

            <div
                id="listaItensMenuFabParticipantes"
                className={
                    aberto
                        ? 'listaItensMenuFabParticipantes listaItensAbertaMenuFabParticipantes'
                        : 'listaItensMenuFabParticipantes'
                }
                role="menu"
                aria-label="Seções da área do participante"
            >
                {abas.map((aba, indice) => {
                    const estilo = ESTILOS_ABAS_MENU_FAB_PARTICIPANTES[aba.id];
                    const ativa = aba.id === abaAtiva;
                    const atraso = aberto
                        ? (totalItens - 1 - indice) * ATRASO_ENTRADA_ITEM_MENU_FAB_PARTICIPANTES
                        : indice * ATRASO_SAIDA_ITEM_MENU_FAB_PARTICIPANTES;

                    return (
                        <button
                            key={aba.id}
                            type="button"
                            role="menuitem"
                            tabIndex={aberto ? 0 : -1}
                            aria-current={ativa ? 'page' : undefined}
                            className={
                                ativa
                                    ? 'itemMenuFabParticipantes itemAtivoMenuFabParticipantes'
                                    : 'itemMenuFabParticipantes'
                            }
                            style={{ transitionDelay: `${atraso}ms` }}
                            onClick={() => escolherAbaNoMenuFab(aba.id)}
                        >
                            <span className="rotuloItemMenuFabParticipantes">{aba.rotulo.toUpperCase()}</span>
                            <span className={`marcadorItemMenuFabParticipantes ${estilo.classeMarcador}`}>
                                {estilo.marca}
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
                        ? 'botaoFabMenuParticipantes botaoFabAbertoMenuParticipantes'
                        : 'botaoFabMenuParticipantes'
                }
                aria-haspopup="menu"
                aria-expanded={aberto}
                aria-controls="listaItensMenuFabParticipantes"
                aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setAberto((estavaAberto) => !estavaAberto)}
            >
                <span className="barraHorizontalBotaoFabParticipantes" />
                <span className="barraVerticalBotaoFabParticipantes" />
            </button>
        </>
    );
}

/* Aba "Ranking": pódio dos 3 primeiros, lista com a posição do
   participante e a tabela de como ganhar XP.

   `regrasXp` é real (GET /api/regra-xp, ver data/apiRegrasXpParticipante.js):
   as regras em PONTOS viram as linhas "+N" do card e as em MINUTOS viram a
   nota de atraso embaixo dele. Tudo editável em /admin -> Informações SEMAC,
   então o card se monta a partir do que vier — bloco some se vier vazio.

   `ranking` já vem fatiado por data/rankingParticipantes.js a partir da
   resposta real de GET /api/pessoa/ranking — pódio na ordem 2º-1º-3º e a
   lista com o 4º/5º colocados + a vizinhança de quem está logado. Itens
   marcados `extraTelaGrande` só aparecem em telas grandes (ver
   .itemListaExtraRankingParticipantes no CSS), pra preencher o espaço que
   sobra numa lista curta. */

function classeItemLista(pessoa) {
    if (pessoa.voce) return 'itemListaRankingParticipantes itemListaVoceRankingParticipantes';
    if (pessoa.extraTelaGrande) return 'itemListaRankingParticipantes itemListaExtraRankingParticipantes';
    return 'itemListaRankingParticipantes';
}

const CHAVE_ATRASO_METADE = 'ATRASO_METADE_MINUTOS';
const CHAVE_ATRASO_ZERO = 'ATRASO_ZERO_MINUTOS';

/* "Atrasou 20 min: metade do XP · 30 min: sem XP" — só com as duas
   regras em mãos, porque uma sozinha não descreve a escada. */
function notaAtraso(regrasXp) {
    const metade = regrasXp.find((regra) => regra.chave === CHAVE_ATRASO_METADE);
    const zero = regrasXp.find((regra) => regra.chave === CHAVE_ATRASO_ZERO);
    if (!metade || !zero) return null;
    return `Chegou ${metade.valor} min atrasado: metade do XP · ${zero.valor} min: sem XP`;
}

export default function SecaoRankingParticipantes({ ranking, regrasXp }) {
    // Atividade que vale 0 XP não é jeito de ganhar XP — fica fora do card.
    const regrasEmPontos = regrasXp.filter((regra) => regra.unidade === 'PONTOS' && regra.valor > 0);
    const avisoAtraso = notaAtraso(regrasXp);

    return (
        <div className="secaoRankingParticipantes">
            <div className="cabecalhoSecaoRankingParticipantes">
                <span className="tituloSecaoRankingParticipantes">RANKING</span>
                <span className="subtituloSecaoRankingParticipantes">
                    {ranking.totalParticipantes} participantes · atualizado às {ranking.atualizadoEm}
                </span>
            </div>

            <div className="corpoSecaoRankingParticipantes">
                <div className="colunaPrincipalRankingParticipantes">
                    <div className="podioRankingParticipantes">
                        {ranking.podio.map((pessoa) => (
                            <div key={pessoa.posicao} className="colunaPodioRankingParticipantes">
                                <span className="nomePodioRankingParticipantes">{pessoa.nome}</span>
                                <div className={`barraPodioRankingParticipantes barraPodioPosicao${pessoa.posicao}RankingParticipantes`}>
                                    <span className="posicaoPodioRankingParticipantes">{pessoa.posicao}º</span>
                                    <span className="xpPodioRankingParticipantes">{pessoa.xp} XP</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="listaRankingParticipantes">
                        {ranking.lista.map((pessoa, indice) => {
                            const anterior = ranking.lista[indice - 1];
                            const mostrarSeparador = anterior && pessoa.posicao - anterior.posicao > 1;
                            return (
                                <div key={pessoa.posicao}>
                                    {mostrarSeparador && <span className="separadorListaRankingParticipantes">· · ·</span>}
                                    <div className={classeItemLista(pessoa)}>
                                        <span className="posicaoItemListaRankingParticipantes">{pessoa.posicao}º</span>
                                        <span className="nomeItemListaRankingParticipantes">{pessoa.nome}</span>
                                        <span className="xpItemListaRankingParticipantes">{pessoa.xp} XP</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {regrasEmPontos.length > 0 && (
                    <aside className="barraLateralRankingParticipantes">
                        <div className="blocoComoGanharXpRankingParticipantes">
                            <span className="tituloBlocoComoGanharXpRankingParticipantes">COMO GANHAR XP</span>
                            {regrasEmPontos.map((regra) => (
                                <div key={regra.chave} className="linhaComoGanharXpRankingParticipantes">
                                    <span>{regra.rotulo}</span>
                                    <strong className="valorComoGanharXpRankingParticipantes">+{regra.valor}</strong>
                                </div>
                            ))}
                            {avisoAtraso && (
                                <span className="notaAtrasoComoGanharXpRankingParticipantes">{avisoAtraso}</span>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

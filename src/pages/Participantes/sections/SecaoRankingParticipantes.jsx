/* Aba "Ranking": pódio dos 3 primeiros, lista com a posição do
   participante e a tabela de como ganhar XP.

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

export default function SecaoRankingParticipantes({ ranking, comoGanharXp }) {
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

                <aside className="barraLateralRankingParticipantes">
                    <div className="blocoComoGanharXpRankingParticipantes">
                        <span className="tituloBlocoComoGanharXpRankingParticipantes">COMO GANHAR XP</span>
                        {comoGanharXp.map((item) => (
                            <div key={item.acao} className="linhaComoGanharXpRankingParticipantes">
                                <span>{item.acao}</span>
                                <strong className="valorComoGanharXpRankingParticipantes">+{item.valor}</strong>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}

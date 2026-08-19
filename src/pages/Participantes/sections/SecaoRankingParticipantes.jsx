/* Aba "Ranking": pódio dos 3 primeiros, lista com a posição do
   participante e a tabela de como ganhar XP. */

export default function SecaoRankingParticipantes({ ranking, comoGanharXp }) {
    return (
        <div className="secaoRankingParticipantes">
            <div className="cabecalhoSecaoRankingParticipantes">
                <span className="tituloSecaoRankingParticipantes">RANKING</span>
                <span className="subtituloSecaoRankingParticipantes">
                    {ranking.totalParticipantes} participantes · atualizado às {ranking.atualizadoEm}
                </span>
            </div>

            <div className="podioRankingParticipantes">
                {/* ordem fixa 2º-1º-3º (degraus do pódio) — ver rankingMockParticipante */}
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
                            <div
                                className={pessoa.voce ? 'itemListaRankingParticipantes itemListaVoceRankingParticipantes' : 'itemListaRankingParticipantes'}
                            >
                                <span className="posicaoItemListaRankingParticipantes">{pessoa.posicao}º</span>
                                <span className="nomeItemListaRankingParticipantes">{pessoa.nome}</span>
                                <span className="xpItemListaRankingParticipantes">{pessoa.xp} XP</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="blocoComoGanharXpRankingParticipantes">
                <span className="tituloBlocoComoGanharXpRankingParticipantes">COMO GANHAR XP</span>
                {comoGanharXp.map((item) => (
                    <div key={item.acao} className="linhaComoGanharXpRankingParticipantes">
                        <span>{item.acao}</span>
                        <strong className="valorComoGanharXpRankingParticipantes">+{item.valor}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

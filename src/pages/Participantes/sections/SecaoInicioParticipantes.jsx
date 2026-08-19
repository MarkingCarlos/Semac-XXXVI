/* Aba "Início": nível/XP, aula acontecendo agora, minicursos do participante,
   agenda do dia (mobile) / palestras da semana (desktop) e conquistas.
   Mobile x desktop é resolvido por CSS (ver participantes.css) — o mesmo
   JSX é reorganizado em coluna única ou coluna principal + barra lateral. */

export default function SecaoInicioParticipantes({
    nivel,
    aulaAgora,
    aSeguir,
    meuDia,
    palestrasDoDia,
    conquistas,
    minicursos,
    ranking,
    temMinicurso,
    onAbrirQr,
    onVerRanking,
    onVerAgenda,
}) {
    return (
        <div className="grelhaInicioParticipantes">
            <div className="colunaPrincipalInicioParticipantes">
                <div className="cardNivelInicioParticipantes">
                    <div className="linhaTopoCardNivelInicioParticipantes">
                        <div className="blocoNivelCardNivelInicioParticipantes">
                            <span className="rotuloNivelCardNivelInicioParticipantes">NÍVEL {nivel.numero}</span>
                            <span className="nomeNivelCardNivelInicioParticipantes">{nivel.nome}</span>
                        </div>
                        <div className="blocoXpCardNivelInicioParticipantes">
                            <span className="valorXpCardNivelInicioParticipantes">{nivel.xp} XP</span>
                            <span className="posicaoCardNivelInicioParticipantes">
                                {nivel.posicaoRanking}º de {nivel.totalParticipantesRanking} no ranking
                            </span>
                        </div>
                    </div>
                    <div className="progressoCardNivelInicioParticipantes">
                        <div className="trilhoProgressoCardNivelInicioParticipantes">
                            <div
                                className="preenchimentoProgressoCardNivelInicioParticipantes"
                                style={{ width: `${Math.min(100, (nivel.xp / (nivel.xp + nivel.xpFaltanteProximoNivel)) * 100)}%` }}
                            />
                        </div>
                        <span className="textoProgressoCardNivelInicioParticipantes">
                            Faltam <strong>{nivel.xpFaltanteProximoNivel} XP</strong> para {nivel.proximoNivelNome} — cada presença vale {nivel.xpPorPresenca} XP
                        </span>
                    </div>
                    <div className="botoesCardNivelInicioParticipantes">
                        <button type="button" className="botaoQrCardNivelInicioParticipantes" onClick={onAbrirQr}>
                            MEU QR CODE
                        </button>
                        <button type="button" className="botaoRankingCardNivelInicioParticipantes" onClick={onVerRanking}>
                            RANKING
                        </button>
                    </div>
                </div>

                <div className="blocoAconteceAgoraInicioParticipantes">
                    <div className="cabecalhoBlocoInicioParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">ACONTECE AGORA</span>
                    </div>
                    <div className="cardAconteceAgoraInicioParticipantes">
                        <span className="categoriaCardAconteceAgoraInicioParticipantes">
                            {aulaAgora.tipo} · {aulaAgora.palestrante}
                        </span>
                        <span className="tituloCardAconteceAgoraInicioParticipantes">{aulaAgora.titulo}</span>
                        <div className="tagsCardAconteceAgoraInicioParticipantes">
                            <span className="tagLocalAconteceAgoraInicioParticipantes">{aulaAgora.local}</span>
                            <span className="tagHorarioAconteceAgoraInicioParticipantes">{aulaAgora.horario}</span>
                            {aulaAgora.checkinFeito && (
                                <span className="tagCheckinAconteceAgoraInicioParticipantes">CHECK-IN FEITO</span>
                            )}
                        </div>
                    </div>
                    <div className="avisoASeguirInicioParticipantes">
                        <span className="rotuloASeguirInicioParticipantes">A SEGUIR</span>
                        <span className="textoASeguirInicioParticipantes">
                            {aSeguir.horario} · {aSeguir.tipo} <strong>{aSeguir.titulo}</strong> · {aSeguir.local}
                        </span>
                    </div>
                </div>

                {temMinicurso && (
                    <div className="blocoMinicursosInicioParticipantes soDesktopParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">MEUS MINICURSOS</span>
                        <div className="grelhaMinicursosInicioParticipantes">
                            {minicursos.map((curso) => (
                                <div key={curso.id} className={`cardMinicursoInicioParticipantes corMinicurso${capitalizar(curso.cor)}Participantes`}>
                                    <span className="professorCardMinicursoInicioParticipantes">{curso.professor}</span>
                                    <span className="tituloCardMinicursoInicioParticipantes">{curso.titulo}</span>
                                    <div className="rodapeCardMinicursoInicioParticipantes">
                                        <span className="horarioCardMinicursoInicioParticipantes">{curso.horarioLocal}</span>
                                        <span className="situacaoCardMinicursoInicioParticipantes">
                                            {curso.encontro ?? curso.situacaoLabel}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="blocoMeuDiaInicioParticipantes soMobileParticipantes">
                    <div className="cabecalhoBlocoInicioParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">MEU DIA</span>
                        <span className="acaoBlocoInicioParticipantes" onClick={onVerAgenda}>Ver agenda</span>
                    </div>
                    {meuDia.map((item) => (
                        <div key={item.id} className={`itemMeuDiaInicioParticipantes statusMeuDia${capitalizar(item.status)}Participantes`}>
                            <div className="horarioItemMeuDiaInicioParticipantes">
                                <span className="valorHorarioItemMeuDiaInicioParticipantes">{item.horario}</span>
                                <span className="localItemMeuDiaInicioParticipantes">{item.local}</span>
                            </div>
                            <div className="textoItemMeuDiaInicioParticipantes">
                                <span className="tituloItemMeuDiaInicioParticipantes">{item.titulo}</span>
                                <span className="detalheItemMeuDiaInicioParticipantes">{item.detalhe}</span>
                            </div>
                            {item.status === 'concluido' && <span className="marcaConcluidaItemMeuDiaInicioParticipantes">OK</span>}
                        </div>
                    ))}
                </div>

                <div className="blocoPalestrasSemanaInicioParticipantes soDesktopParticipantes">
                    <span className="rotuloBlocoInicioParticipantes">PALESTRAS DA SEMANA</span>
                    <div className="grelhaPalestrasSemanaInicioParticipantes">
                        {palestrasDoDia.map((item) => (
                            <div key={item.id} className={`cardPalestraSemanaInicioParticipantes statusMeuDia${capitalizar(item.status)}Participantes`}>
                                <span className="horarioCardPalestraSemanaInicioParticipantes">{item.horario}</span>
                                <span className="tituloCardPalestraSemanaInicioParticipantes">{item.titulo}</span>
                                <span className="detalheCardPalestraSemanaInicioParticipantes">{item.detalhe}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="blocoConquistasInicioParticipantes soMobileParticipantes">
                    <div className="cabecalhoBlocoInicioParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">CONQUISTAS</span>
                        <span className="contadorBlocoInicioParticipantes">
                            {conquistas.filter((c) => c.desbloqueada).length} de {conquistas.length}
                        </span>
                    </div>
                    <div className="grelhaConquistasInicioParticipantes">
                        {conquistas.map((conquista) => (
                            <div
                                key={conquista.id}
                                className={
                                    conquista.desbloqueada
                                        ? `itemConquistaInicioParticipantes corConquista${capitalizar(conquista.cor)}Participantes`
                                        : 'itemConquistaInicioParticipantes itemConquistaBloqueadaInicioParticipantes'
                                }
                            >
                                <span className="valorItemConquistaInicioParticipantes">{conquista.valorExibido}</span>
                                <span className="rotuloItemConquistaInicioParticipantes">{conquista.rotulo}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <aside className="barraLateralInicioParticipantes soDesktopParticipantes">
                <div className="cardBarraLateralInicioParticipantes">
                    <div className="cabecalhoBlocoInicioParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">RANKING</span>
                        <span className="acaoBlocoInicioParticipantes" onClick={onVerRanking}>Ver todos</span>
                    </div>
                    <div className="listaRankingBarraLateralInicioParticipantes">
                        {ranking.lista.map((pessoa) => (
                            <div
                                key={pessoa.posicao}
                                className={pessoa.voce ? 'itemRankingBarraLateralInicioParticipantes itemRankingVoceInicioParticipantes' : 'itemRankingBarraLateralInicioParticipantes'}
                            >
                                <span className="posicaoItemRankingBarraLateralInicioParticipantes">{pessoa.posicao}º</span>
                                <span className="nomeItemRankingBarraLateralInicioParticipantes">{pessoa.nome}</span>
                                <span className="xpItemRankingBarraLateralInicioParticipantes">{pessoa.xp} XP</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cardBarraLateralInicioParticipantes">
                    <div className="cabecalhoBlocoInicioParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">CONQUISTAS</span>
                        <span className="contadorBlocoInicioParticipantes">
                            {conquistas.filter((c) => c.desbloqueada).length} de {conquistas.length}
                        </span>
                    </div>
                    <div className="grelhaConquistasBarraLateralInicioParticipantes">
                        {conquistas.map((conquista) => (
                            <div
                                key={conquista.id}
                                className={
                                    conquista.desbloqueada
                                        ? `itemConquistaInicioParticipantes corConquista${capitalizar(conquista.cor)}Participantes`
                                        : 'itemConquistaInicioParticipantes itemConquistaBloqueadaInicioParticipantes'
                                }
                            >
                                <span className="valorItemConquistaInicioParticipantes">{conquista.valorExibido}</span>
                                <span className="rotuloItemConquistaInicioParticipantes">{conquista.rotulo}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

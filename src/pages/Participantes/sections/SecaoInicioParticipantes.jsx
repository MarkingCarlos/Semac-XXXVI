/* Aba "Início": nível/XP, atividade acontecendo agora, os minicursos que
   o participante escolheu, agenda do dia (mobile) / palestras do dia
   (desktop) e conquistas. Mobile x desktop é resolvido por CSS (ver
   participantes.css) — o mesmo JSX é reorganizado em coluna única ou
   coluna principal + barra lateral.

   Nível, ranking e conquistas ainda vêm de mockParticipante.js; o resto
   é a programação real da API. */

export default function SecaoInicioParticipantes({
    nivel,
    atividadeAtual,
    atividadeSeguinte,
    meuDia,
    palestrasDoDia,
    conquistas,
    meusMinicursos,
    totalMinicursos,
    ranking,
    carregando,
    onAbrirQr,
    onVerRanking,
    onVerAgenda,
    onEscolherMinicursos,
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
                        <span className="rotuloBlocoInicioParticipantes">
                            {atividadeAtual ? 'ACONTECE AGORA' : 'PRÓXIMA ATIVIDADE'}
                        </span>
                    </div>

                    {carregando && (
                        <p className="avisoCarregandoAgendaParticipantes">Carregando a programação…</p>
                    )}

                    {/* Fora do horário de qualquer atividade (antes da semana do
                        evento, por exemplo) o destaque passa a ser a próxima. */}
                    {!carregando && (atividadeAtual ?? atividadeSeguinte) && (
                        <div className="cardAconteceAgoraInicioParticipantes">
                            <span className="categoriaCardAconteceAgoraInicioParticipantes">
                                {(atividadeAtual ?? atividadeSeguinte).tipo}
                                {(atividadeAtual ?? atividadeSeguinte).palestrante
                                    ? ` · ${(atividadeAtual ?? atividadeSeguinte).palestrante}`
                                    : ''}
                            </span>
                            <span className="tituloCardAconteceAgoraInicioParticipantes">
                                {(atividadeAtual ?? atividadeSeguinte).titulo}
                            </span>
                            <div className="tagsCardAconteceAgoraInicioParticipantes">
                                <span className="tagLocalAconteceAgoraInicioParticipantes">
                                    {(atividadeAtual ?? atividadeSeguinte).local}
                                </span>
                                <span className="tagHorarioAconteceAgoraInicioParticipantes">
                                    {(atividadeAtual ?? atividadeSeguinte).dia} · {(atividadeAtual ?? atividadeSeguinte).horario}
                                </span>
                            </div>
                        </div>
                    )}

                    {!carregando && !atividadeAtual && !atividadeSeguinte && (
                        <p className="avisoVazioAgendaParticipantes">
                            Nenhuma atividade programada daqui pra frente.
                        </p>
                    )}

                    {!carregando && atividadeAtual && atividadeSeguinte && (
                        <div className="avisoASeguirInicioParticipantes">
                            <span className="rotuloASeguirInicioParticipantes">A SEGUIR</span>
                            <span className="textoASeguirInicioParticipantes">
                                {atividadeSeguinte.dia} · {atividadeSeguinte.horario} · <strong>{atividadeSeguinte.titulo}</strong> · {atividadeSeguinte.local}
                            </span>
                        </div>
                    )}
                </div>

                {/* Único ponto de entrada da escolha de minicursos — a aba
                    Agenda é só leitura, então este bloco aparece também no
                    mobile. */}
                {totalMinicursos > 0 && (
                    <div className="blocoMinicursosInicioParticipantes">
                        <div className="cabecalhoBlocoInicioParticipantes">
                            <span className="rotuloBlocoInicioParticipantes">MEUS MINICURSOS</span>
                            <span className="acaoBlocoInicioParticipantes" onClick={onEscolherMinicursos}>
                                {meusMinicursos.length > 0 ? 'Trocar' : 'Escolher'}
                            </span>
                        </div>
                        {meusMinicursos.length === 0 ? (
                            <>
                                <p className="avisoVazioAgendaParticipantes">
                                    Você ainda não escolheu nenhum minicurso — são {totalMinicursos} na semana, com vagas limitadas.
                                </p>
                                <button
                                    type="button"
                                    className="botaoEscolherMinicursosInicioParticipantes"
                                    onClick={onEscolherMinicursos}
                                >
                                    ESCOLHER MEUS MINICURSOS
                                </button>
                            </>
                        ) : (
                            <div className="grelhaMinicursosInicioParticipantes">
                                {meusMinicursos.map((curso) => (
                                    <div key={curso.id} className={`cardMinicursoInicioParticipantes corMinicurso${capitalizar(curso.cor)}Participantes`}>
                                        <span className="professorCardMinicursoInicioParticipantes">{curso.professor}</span>
                                        <span className="tituloCardMinicursoInicioParticipantes">{curso.titulo}</span>
                                        <div className="rodapeCardMinicursoInicioParticipantes">
                                            <span className="horarioCardMinicursoInicioParticipantes">{curso.horarioLocal}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="blocoMeuDiaInicioParticipantes soMobileParticipantes">
                    <div className="cabecalhoBlocoInicioParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">MEU DIA</span>
                        <span className="acaoBlocoInicioParticipantes" onClick={onVerAgenda}>Ver agenda</span>
                    </div>
                    {!carregando && meuDia.length === 0 && (
                        <p className="avisoVazioAgendaParticipantes">Nada programado para esse dia.</p>
                    )}
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
                    <div className="cabecalhoBlocoInicioParticipantes">
                        <span className="rotuloBlocoInicioParticipantes">PALESTRAS DO DIA</span>
                        <span className="acaoBlocoInicioParticipantes" onClick={onVerAgenda}>Ver agenda</span>
                    </div>
                    {!carregando && palestrasDoDia.length === 0 && (
                        <p className="avisoVazioAgendaParticipantes">Nenhuma palestra nesse dia.</p>
                    )}
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

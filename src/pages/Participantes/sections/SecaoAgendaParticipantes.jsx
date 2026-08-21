/* Aba "Agenda": dia da semana, escolha de minicursos e palestras do dia.

   Palestras são abertas — o participante já entra nelas ao ter a
   inscrição confirmada, então não têm ação nenhuma aqui. Minicursos têm
   vagas limitadas: o card mostra quantas sobraram, fica marcado como
   ESGOTADO quando acabam e é bloqueado quando bate de frente com outro
   minicurso já escolhido (um por faixa de horário). */

export default function SecaoAgendaParticipantes({
    diasSemana,
    diaSelecionado,
    onSelecionarDia,
    minicursos,
    meusMinicursos,
    palestrasDoDia,
    carregando,
    erroMinicurso,
    minicursoEmEspera,
    onEscolherMinicurso,
    onSairDoMinicurso,
}) {
    const minicursosDisponiveis = minicursos.filter((curso) => !curso.escolhido);

    return (
        <div className="secaoAgendaParticipantes">
            <div className="cabecalhoSecaoAgendaParticipantes">
                <span className="tituloSecaoAgendaParticipantes">AGENDA</span>
                <span className="subtituloSecaoAgendaParticipantes">
                    Palestras são abertas a todos os inscritos. Minicursos têm vagas limitadas — você escolhe um por horário.
                </span>
            </div>

            <div className="seletorDiasAgendaParticipantes">
                {diasSemana.map((dia) => (
                    <button
                        key={dia.id}
                        type="button"
                        className={
                            dia.id === diaSelecionado
                                ? 'itemDiaAgendaParticipantes itemDiaSelecionadoAgendaParticipantes'
                                : 'itemDiaAgendaParticipantes'
                        }
                        aria-pressed={dia.id === diaSelecionado}
                        onClick={() => onSelecionarDia(dia.id)}
                    >
                        <span className="rotuloItemDiaAgendaParticipantes">{dia.rotulo}</span>
                        <span className="dataItemDiaAgendaParticipantes">{dia.hoje ? `${dia.data} · hoje` : dia.data}</span>
                    </button>
                ))}
            </div>

            {carregando && (
                <p className="avisoCarregandoAgendaParticipantes">Carregando a programação…</p>
            )}

            {erroMinicurso && (
                <p className="avisoErroMinicursoAgendaParticipantes" role="alert">{erroMinicurso}</p>
            )}

            {meusMinicursos.length > 0 && (
                <div className="blocoMinicursosAgendaParticipantes">
                    <div className="cabecalhoBlocoAgendaParticipantes">
                        <span className="rotuloBlocoAgendaParticipantes">MEUS MINICURSOS</span>
                        <span className="contadorBlocoAgendaParticipantes">
                            {meusMinicursos.length} de {minicursos.length}
                        </span>
                    </div>
                    <div className="listaMinicursosAgendaParticipantes">
                        {meusMinicursos.map((curso) => (
                            <CardMinicursoAgendaParticipantes
                                key={curso.id}
                                curso={curso}
                                emEspera={minicursoEmEspera === curso.id}
                                onEscolher={onEscolherMinicurso}
                                onSair={onSairDoMinicurso}
                            />
                        ))}
                    </div>
                </div>
            )}

            {minicursos.length > 0 && (
                <div className="blocoMinicursosAgendaParticipantes">
                    <div className="cabecalhoBlocoAgendaParticipantes">
                        <span className="rotuloBlocoAgendaParticipantes">
                            {meusMinicursos.length > 0 ? 'OUTROS MINICURSOS' : 'MINICURSOS DA SEMANA'}
                        </span>
                        <span className="contadorBlocoAgendaParticipantes">
                            {minicursosDisponiveis.length} disponíveis
                        </span>
                    </div>
                    <div className="listaMinicursosAgendaParticipantes">
                        {minicursosDisponiveis.length === 0 && (
                            <p className="avisoVazioAgendaParticipantes">
                                Você já está em todos os minicursos oferecidos.
                            </p>
                        )}
                        {minicursosDisponiveis.map((curso) => (
                            <CardMinicursoAgendaParticipantes
                                key={curso.id}
                                curso={curso}
                                emEspera={minicursoEmEspera === curso.id}
                                onEscolher={onEscolherMinicurso}
                                onSair={onSairDoMinicurso}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="blocoPalestrasAgendaParticipantes">
                <span className="rotuloBlocoAgendaParticipantes">PALESTRAS DO DIA</span>
                {!carregando && palestrasDoDia.length === 0 && (
                    <p className="avisoVazioAgendaParticipantes">Nenhuma palestra nesse dia.</p>
                )}
                {palestrasDoDia.map((item) => (
                    <div key={item.id} className={`cardPalestraAgendaParticipantes statusPalestra${capitalizar(item.status)}AgendaParticipantes`}>
                        <div className="horarioCardPalestraAgendaParticipantes">
                            <span className="valorHorarioCardPalestraAgendaParticipantes">{item.horario}</span>
                            <span className="localCardPalestraAgendaParticipantes">{item.local}</span>
                        </div>
                        <div className="textoCardPalestraAgendaParticipantes">
                            <span className="tituloCardPalestraAgendaParticipantes">{item.titulo}</span>
                            <span className="detalheCardPalestraAgendaParticipantes">{item.detalhe}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="avisoPresencaAgendaParticipantes">
                <span className="tituloAvisoPresencaAgendaParticipantes">COMO CONTA A PRESENÇA</span>
                <span className="textoAvisoPresencaAgendaParticipantes">
                    O crachá é lido na entrada de cada atividade. A confirmação aparece aqui em até 1 minuto.
                </span>
            </div>
        </div>
    );
}

/* Card de minicurso com a ação que couber: sair (se é meu), escolher, ou
   o motivo de não dar — esgotado, choque de horário, já começou. */
function CardMinicursoAgendaParticipantes({ curso, emEspera, onEscolher, onSair }) {
    return (
        <div className={`cardMinicursoAgendaParticipantes corMinicurso${capitalizar(curso.cor)}Participantes`}>
            <span className="professorCardMinicursoAgendaParticipantes">{curso.professor}</span>
            <span className="tituloCardMinicursoAgendaParticipantes">{curso.titulo}</span>

            <div className="situacaoCardMinicursoAgendaParticipantes">
                <span>{curso.horarioLocal}</span>
                {curso.vagasRestantes !== null && !curso.escolhido && (
                    <span className="etiquetaSituacaoCardMinicursoAgendaParticipantes">
                        {curso.vagasRestantes > 0
                            ? `${curso.vagasRestantes} de ${curso.capacidadeMaxima} vagas`
                            : 'sem vagas'}
                    </span>
                )}
            </div>

            <div className="linhaAcaoCardMinicursoAgendaParticipantes">
                {curso.escolhido ? (
                    <>
                        <span className="etiquetaEscolhidoMinicursoAgendaParticipantes">VOCÊ ESTÁ NESTE</span>
                        {!curso.jaComecou && (
                            <button
                                type="button"
                                className="botaoSairMinicursoAgendaParticipantes"
                                disabled={emEspera}
                                onClick={() => onSair(curso.id)}
                            >
                                {emEspera ? 'SAINDO…' : 'SAIR'}
                            </button>
                        )}
                    </>
                ) : curso.jaComecou ? (
                    <span className="etiquetaBloqueioMinicursoAgendaParticipantes">JÁ COMEÇOU</span>
                ) : curso.esgotado ? (
                    <span className="etiquetaBloqueioMinicursoAgendaParticipantes">ESGOTADO</span>
                ) : curso.conflita ? (
                    <span className="etiquetaBloqueioMinicursoAgendaParticipantes">CHOQUE DE HORÁRIO</span>
                ) : (
                    <button
                        type="button"
                        className="botaoEscolherMinicursoAgendaParticipantes"
                        disabled={emEspera}
                        onClick={() => onEscolher(curso.id)}
                    >
                        {emEspera ? 'ENTRANDO…' : 'ESCOLHER'}
                    </button>
                )}
            </div>
        </div>
    );
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

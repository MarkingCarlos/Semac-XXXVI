/* Aba "Agenda": seletor de dia da semana, minicursos do participante e
   palestras do dia selecionado. Filtro "Só os meus" / "Tudo do dia" é
   apenas visual por enquanto — os dados mockados já representam "os meus". */

export default function SecaoAgendaParticipantes({ diasSemana, temMinicurso, minicursos, palestrasDoDia }) {
    return (
        <div className="secaoAgendaParticipantes">
            <div className="cabecalhoSecaoAgendaParticipantes">
                <span className="tituloSecaoAgendaParticipantes">AGENDA</span>
                <span className="subtituloSecaoAgendaParticipantes">
                    Palestras são abertas a todos os inscritos. Minicursos aparecem só na sua turma.
                </span>
            </div>

            <div className="seletorDiasAgendaParticipantes">
                {diasSemana.map((dia) => (
                    <div
                        key={dia.id}
                        className={dia.hoje ? 'itemDiaAgendaParticipantes itemDiaHojeAgendaParticipantes' : 'itemDiaAgendaParticipantes'}
                    >
                        <span className="rotuloItemDiaAgendaParticipantes">{dia.rotulo}</span>
                        <span className="dataItemDiaAgendaParticipantes">{dia.hoje ? `${dia.data} · hoje` : dia.data}</span>
                    </div>
                ))}
            </div>

            <div className="filtrosAgendaParticipantes">
                <span className="filtroAtivoAgendaParticipantes">SÓ OS MEUS</span>
                <span className="filtroInativoAgendaParticipantes">TUDO DO DIA</span>
            </div>

            {temMinicurso && (
                <div className="blocoMinicursosAgendaParticipantes">
                    <div className="cabecalhoBlocoAgendaParticipantes">
                        <span className="rotuloBlocoAgendaParticipantes">MEUS MINICURSOS</span>
                        <span className="contadorBlocoAgendaParticipantes">
                            {minicursos.length} de 4 vagas
                        </span>
                    </div>
                    <div className="listaMinicursosAgendaParticipantes">
                        {minicursos.map((curso) => (
                            <div key={curso.id} className={`cardMinicursoAgendaParticipantes corMinicurso${capitalizar(curso.cor)}Participantes`}>
                                <span className="professorCardMinicursoAgendaParticipantes">{curso.professor}</span>
                                <span className="tituloCardMinicursoAgendaParticipantes">{curso.titulo}</span>
                                {curso.tags ? (
                                    <div className="tagsCardMinicursoAgendaParticipantes">
                                        {curso.tags.map((tag) => (
                                            <span
                                                key={tag.rotulo}
                                                className={
                                                    tag.atual
                                                        ? 'tagCardMinicursoAgendaParticipantes tagAtualCardMinicursoAgendaParticipantes'
                                                        : 'tagCardMinicursoAgendaParticipantes'
                                                }
                                            >
                                                {tag.rotulo}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="situacaoCardMinicursoAgendaParticipantes">
                                        <span>{curso.horarioLocal}</span>
                                        <span className="etiquetaSituacaoCardMinicursoAgendaParticipantes">{curso.situacaoLabel}</span>
                                    </div>
                                )}
                                {curso.rodape && <span className="rodapeCardMinicursoAgendaParticipantes">{curso.rodape}</span>}
                            </div>
                        ))}
                        <div className="vagaLivreAgendaParticipantes">
                            <div className="textoVagaLivreAgendaParticipantes">
                                <span className="tituloVagaLivreAgendaParticipantes">4ª VAGA LIVRE</span>
                                <span className="descricaoVagaLivreAgendaParticipantes">Você pode se inscrever em até 4 minicursos</span>
                            </div>
                            <span className="botaoVagaLivreAgendaParticipantes">ESCOLHER</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="blocoPalestrasAgendaParticipantes">
                <span className="rotuloBlocoAgendaParticipantes">PALESTRAS DO DIA</span>
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

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

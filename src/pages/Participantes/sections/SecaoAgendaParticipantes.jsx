/* Aba "Agenda": só o que o participante já tem, dia a dia — as palestras
   (abertas a todos os inscritos, ele entra ao ter a inscrição confirmada)
   e os minicursos que escolheu.

   Nenhuma ação aqui: escolher, trocar ou desistir de minicurso acontece
   exclusivamente no modal de escolha, aberto pela aba Início. */

export default function SecaoAgendaParticipantes({
    diasSemana,
    diaSelecionado,
    onSelecionarDia,
    meuDia,
    carregando,
}) {
    return (
        <div className="secaoAgendaParticipantes">
            <div className="cabecalhoSecaoAgendaParticipantes">
                <span className="tituloSecaoAgendaParticipantes">AGENDA</span>
                <span className="subtituloSecaoAgendaParticipantes">
                    Suas atividades da semana: as palestras abertas a todos os inscritos e os minicursos que você escolheu.
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

            <div className="blocoAtividadesAgendaParticipantes">
                <span className="rotuloBlocoAgendaParticipantes">MINHAS ATIVIDADES DO DIA</span>
                {!carregando && meuDia.length === 0 && (
                    <p className="avisoVazioAgendaParticipantes">Nada programado para você nesse dia.</p>
                )}
                {meuDia.map((item) => (
                    <div key={item.id} className={`cardAtividadeAgendaParticipantes statusAtividade${capitalizar(item.status)}AgendaParticipantes`}>
                        <div className="horarioCardAtividadeAgendaParticipantes">
                            <span className="valorHorarioCardAtividadeAgendaParticipantes">{item.horario}</span>
                            <span className="localCardAtividadeAgendaParticipantes">{item.local}</span>
                        </div>
                        <div className="textoCardAtividadeAgendaParticipantes">
                            <span className="tituloCardAtividadeAgendaParticipantes">{item.titulo}</span>
                            <span className="detalheCardAtividadeAgendaParticipantes">{item.detalhe}</span>
                        </div>
                        {item.status === 'concluido' && (
                            <span className="marcaConcluidaCardAtividadeAgendaParticipantes">OK</span>
                        )}
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

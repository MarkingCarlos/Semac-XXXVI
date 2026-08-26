/* Modal de escolha de minicursos — o único lugar onde o participante
   entra, troca ou desiste de um minicurso (a aba Agenda passou a ser só
   leitura do que ele já tem).

   Funciona como um assistente: um passo por dia com minicurso, as
   opções daquele dia lado a lado. Escolher avança para o dia seguinte;
   no último dia, fecha. Como só cabe um minicurso por faixa de horário,
   cada dia é uma decisão só — por isso a escolha já leva adiante. */

import { useEffect, useMemo, useState } from 'preact/hooks';
import { agruparMinicursosPorDia } from './data/agendaParticipantes.js';

export default function ModalEscolhaMinicursos({
    minicursos,
    minicursoEmEspera,
    erroMinicurso,
    onEscolher,
    onSair,
    onFechar,
}) {
    const diasComMinicurso = useMemo(() => agruparMinicursosPorDia(minicursos), [minicursos]);
    const [indiceDiaAtual, setIndiceDiaAtual] = useState(0);

    /* A agenda é recarregada a cada escolha; se um dia deixar de existir
       na volta, o passo atual não pode ficar apontando para o vazio. */
    useEffect(() => {
        if (indiceDiaAtual > diasComMinicurso.length - 1) {
            setIndiceDiaAtual(Math.max(0, diasComMinicurso.length - 1));
        }
    }, [diasComMinicurso.length]);

    const diaAtual = diasComMinicurso[indiceDiaAtual];
    const ehUltimoDia = indiceDiaAtual >= diasComMinicurso.length - 1;

    function avancar() {
        if (ehUltimoDia) {
            onFechar();
            return;
        }
        setIndiceDiaAtual((indice) => indice + 1);
    }

    function voltar() {
        setIndiceDiaAtual((indice) => Math.max(0, indice - 1));
    }

    /* Só passa para o próximo dia se a inscrição entrou de fato — dando
       erro (esgotou entre a carga e o clique, sessão expirada), o
       participante fica no mesmo dia com a mensagem à vista. */
    async function escolherEAvancar(minicursoId) {
        const deuCerto = await onEscolher(minicursoId);
        if (deuCerto) avancar();
    }

    return (
        <div className="sobreposicaoModalMinicursosParticipantes" onClick={onFechar}>
            <div
                className="modalMinicursosParticipantes"
                role="dialog"
                aria-modal="true"
                aria-label="Escolha dos minicursos"
                onClick={(evento) => evento.stopPropagation()}
            >
                <div className="cabecalhoModalMinicursosParticipantes">
                    <div className="textoCabecalhoModalMinicursosParticipantes">
                        <span className="tituloModalMinicursosParticipantes">ESCOLHER MINICURSO</span>
                        <span className="subtituloModalMinicursosParticipantes">
                            {diasComMinicurso.length > 0
                                ? `Passo ${indiceDiaAtual + 1} de ${diasComMinicurso.length} · uma opção por dia`
                                : 'Nenhum minicurso disponível'}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="botaoFecharModalMinicursosParticipantes"
                        onClick={onFechar}
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                {diasComMinicurso.length > 1 && (
                    <div className="trilhaPassosModalMinicursosParticipantes">
                        {diasComMinicurso.map((dia, indice) => (
                            <span
                                key={dia.id}
                                className={
                                    indice === indiceDiaAtual
                                        ? 'passoAtivoModalMinicursosParticipantes'
                                        : dia.escolhido
                                            ? 'passoConcluidoModalMinicursosParticipantes'
                                            : 'passoModalMinicursosParticipantes'
                                }
                            />
                        ))}
                    </div>
                )}

                {!diaAtual && (
                    <p className="avisoVazioModalMinicursosParticipantes">
                        Os minicursos ainda não foram abertos para escolha.
                    </p>
                )}

                {diaAtual && (
                    <>
                        <div className="identidadeDiaModalMinicursosParticipantes">
                            <span className="nomeDiaModalMinicursosParticipantes">{diaAtual.rotuloDiaCompleto}</span>
                            <span className="dataDiaModalMinicursosParticipantes">{diaAtual.dataExtenso}</span>
                            <span className="instrucaoDiaModalMinicursosParticipantes">
                                {diaAtual.escolhido
                                    ? 'Você já tem um minicurso neste dia.'
                                    : `Escolha 1 entre ${diaAtual.cursos.length} ${diaAtual.cursos.length === 1 ? 'opção' : 'opções'}.`}
                            </span>
                        </div>

                        {erroMinicurso && (
                            <p className="avisoErroModalMinicursosParticipantes" role="alert">{erroMinicurso}</p>
                        )}

                        <div className="gradeCardsModalMinicursosParticipantes">
                            {diaAtual.cursos.map((curso) => (
                                <CardOpcaoModalMinicursos
                                    key={curso.id}
                                    curso={curso}
                                    emEspera={minicursoEmEspera === curso.id}
                                    onEscolher={escolherEAvancar}
                                    onSair={onSair}
                                />
                            ))}
                        </div>

                        <div className="rodapeModalMinicursosParticipantes">
                            {indiceDiaAtual > 0 ? (
                                <button
                                    type="button"
                                    className="botaoVoltarModalMinicursosParticipantes"
                                    onClick={voltar}
                                >
                                    VOLTAR
                                </button>
                            ) : (
                                <span />
                            )}
                            <button
                                type="button"
                                className="botaoAvancarModalMinicursosParticipantes"
                                onClick={avancar}
                            >
                                {ehUltimoDia
                                    ? 'CONCLUIR'
                                    : diaAtual.escolhido
                                        ? 'AVANÇAR'
                                        : 'PULAR ESTE DIA'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* Card de uma opção do dia. Mesmos estados do card antigo da agenda:
   escolhido (com a opção de desistir), esgotado, choque de horário com
   outro dia já escolhido, ou já começou. */
function CardOpcaoModalMinicursos({ curso, emEspera, onEscolher, onSair }) {
    const indisponivel = curso.jaComecou || curso.esgotado || curso.conflita;

    return (
        <div
            className={
                curso.escolhido
                    ? `cardOpcaoModalMinicursosParticipantes cardOpcaoEscolhidaModalMinicursosParticipantes corMinicurso${capitalizar(curso.cor)}Participantes`
                    : `cardOpcaoModalMinicursosParticipantes corMinicurso${capitalizar(curso.cor)}Participantes`
            }
        >
            <span className="professorCardOpcaoModalMinicursosParticipantes">{curso.professor}</span>
            <span className="tituloCardOpcaoModalMinicursosParticipantes">{curso.titulo}</span>
            <span className="horarioCardOpcaoModalMinicursosParticipantes">{curso.horarioLocal}</span>

            {curso.vagasRestantes !== null && !curso.escolhido && (
                <span className="vagasCardOpcaoModalMinicursosParticipantes">
                    {curso.vagasRestantes > 0
                        ? `${curso.vagasRestantes} de ${curso.capacidadeMaxima} vagas`
                        : 'sem vagas'}
                </span>
            )}

            <div className="acaoCardOpcaoModalMinicursosParticipantes">
                {curso.escolhido ? (
                    <>
                        <span className="etiquetaEscolhidaCardOpcaoModalMinicursosParticipantes">VOCÊ ESTÁ NESTE</span>
                        {!curso.jaComecou && (
                            <button
                                type="button"
                                className="botaoSairCardOpcaoModalMinicursosParticipantes"
                                disabled={emEspera}
                                onClick={() => onSair(curso.id)}
                            >
                                {emEspera ? 'SAINDO…' : 'TROCAR'}
                            </button>
                        )}
                    </>
                ) : indisponivel ? (
                    <span className="etiquetaBloqueioCardOpcaoModalMinicursosParticipantes">
                        {curso.jaComecou ? 'JÁ COMEÇOU' : curso.esgotado ? 'ESGOTADO' : 'CHOQUE DE HORÁRIO'}
                    </span>
                ) : (
                    <button
                        type="button"
                        className="botaoEscolherCardOpcaoModalMinicursosParticipantes"
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

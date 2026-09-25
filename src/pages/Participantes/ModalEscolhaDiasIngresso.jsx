/* Modal de escolha dos dias do ingresso diário. Quem comprou N diárias
   marca N dias entre os que têm programação; o QR só vale neles (ver
   DiaIngressoService no backend).

   Enquanto a escolha não está completa o modal é obrigatório: abre
   sozinho ao entrar em /participantes e não fecha pelo fundo nem tem
   botão de fechar. Depois dá pra voltar aqui e trocar — menos os dias que
   já começaram, que ficam travados. */

import { useMemo, useState } from 'preact/hooks';

const NOMES_DIA_SEMANA_INGRESSO = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
const NOMES_MES_INGRESSO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/* Hoje como 'YYYY-MM-DD' no fuso de quem está olhando. */
function hojeLocalIngresso() {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${agora.getFullYear()}-${mes}-${dia}`;
}

export default function ModalEscolhaDiasIngresso({ diasIngresso, obrigatorio, salvando, erro, onSalvar, onFechar }) {
    const { diasContratados, diasDisponiveis, diasEscolhidos, diasTravados } = diasIngresso;
    const [diasSelecionados, setDiasSelecionados] = useState(() => new Set(diasEscolhidos));

    const hoje = hojeLocalIngresso();
    const travados = useMemo(() => new Set(diasTravados), [diasTravados]);
    const completo = diasSelecionados.size === diasContratados;

    const cardsDias = useMemo(
        () =>
            diasDisponiveis.map((dia) => {
                const data = new Date(`${dia}T00:00:00`);
                return {
                    id: dia,
                    nomeDia: NOMES_DIA_SEMANA_INGRESSO[data.getDay()],
                    numeroDia: data.getDate(),
                    mes: NOMES_MES_INGRESSO[data.getMonth()],
                    travado: travados.has(dia),
                    passou: dia < hoje,
                };
            }),
        [diasDisponiveis, travados, hoje],
    );

    /* Com uma diária só, clicar em outro dia troca a escolha direto; com
       mais, o dia novo só entra se ainda houver diária sobrando. */
    function alternarDia(card) {
        if (card.travado) return;
        setDiasSelecionados((atual) => {
            const proximo = new Set(atual);
            if (proximo.has(card.id)) {
                proximo.delete(card.id);
                return proximo;
            }
            if (card.passou) return atual;
            if (diasContratados === 1) return new Set([card.id]);
            if (proximo.size >= diasContratados) return atual;
            proximo.add(card.id);
            return proximo;
        });
    }

    function confirmar() {
        if (!completo || salvando) return;
        onSalvar([...diasSelecionados].sort());
    }

    const fecharPeloFundo = obrigatorio ? undefined : onFechar;
    const faltam = diasContratados - diasSelecionados.size;

    return (
        <div className="sobreposicaoModalMinicursosParticipantes" onClick={fecharPeloFundo}>
            <div
                className="modalMinicursosParticipantes"
                role="dialog"
                aria-modal="true"
                aria-label="Escolha dos dias do ingresso"
                onClick={(evento) => evento.stopPropagation()}
            >
                <div className="cabecalhoModalMinicursosParticipantes">
                    <div className="textoCabecalhoModalMinicursosParticipantes">
                        <span className="tituloModalMinicursosParticipantes">DIAS DO SEU INGRESSO</span>
                        <span className="subtituloModalMinicursosParticipantes">
                            {diasContratados === 1
                                ? 'Você comprou 1 diária · escolha o dia em que vai usá-la'
                                : `Você comprou ${diasContratados} diárias · escolha os dias em que vai usá-las`}
                        </span>
                    </div>
                </div>

                <span className="instrucaoDiaModalMinicursosParticipantes">
                    Seu QR code só será aceito na entrada das atividades dos dias escolhidos. Dá pra trocar
                    depois, até o dia começar.
                </span>

                {erro && (
                    <p className="avisoErroModalMinicursosParticipantes" role="alert">{erro}</p>
                )}

                {cardsDias.length === 0 ? (
                    <p className="avisoVazioModalMinicursosParticipantes">
                        A programação ainda não foi publicada. Volte quando os dias do evento estiverem definidos.
                    </p>
                ) : (
                    <div className="gradeDiasModalDiasIngressoParticipantes">
                        {cardsDias.map((card) => {
                            const selecionado = diasSelecionados.has(card.id);
                            const bloqueado = card.travado || (!selecionado && card.passou);
                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    className={
                                        selecionado
                                            ? 'botaoDiaModalDiasIngressoParticipantes botaoDiaSelecionadoModalDiasIngressoParticipantes'
                                            : 'botaoDiaModalDiasIngressoParticipantes'
                                    }
                                    aria-pressed={selecionado}
                                    disabled={bloqueado}
                                    onClick={() => alternarDia(card)}
                                >
                                    <span className="nomeBotaoDiaModalDiasIngressoParticipantes">{card.nomeDia}</span>
                                    <span className="numeroBotaoDiaModalDiasIngressoParticipantes">{card.numeroDia}</span>
                                    <span className="mesBotaoDiaModalDiasIngressoParticipantes">{card.mes}</span>
                                    {card.travado && (
                                        <span className="etiquetaBotaoDiaModalDiasIngressoParticipantes">EM USO</span>
                                    )}
                                    {!card.travado && card.passou && !selecionado && (
                                        <span className="etiquetaBotaoDiaModalDiasIngressoParticipantes">JÁ PASSOU</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="rodapeModalMinicursosParticipantes">
                    <span className="contadorModalDiasIngressoParticipantes">
                        {completo
                            ? 'Tudo certo!'
                            : `Falta${faltam === 1 ? '' : 'm'} ${faltam} ${faltam === 1 ? 'dia' : 'dias'}`}
                    </span>
                    <div className="acoesRodapeModalDiasIngressoParticipantes">
                        {!obrigatorio && (
                            <button type="button" className="botaoVoltarModalMinicursosParticipantes" onClick={onFechar}>
                                CANCELAR
                            </button>
                        )}
                        <button
                            type="button"
                            className="botaoConfirmarModalDiasIngressoParticipantes"
                            disabled={!completo || salvando}
                            onClick={confirmar}
                        >
                            {salvando ? 'SALVANDO…' : 'CONFIRMAR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

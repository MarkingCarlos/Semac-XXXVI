import { useEffect, useMemo, useState } from 'preact/hooks';
import { listarEventosCheckin } from './data/apiCheckin.js';
import './TelaSelecaoEventoCheckin.css';

const NOMES_DIA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/* Cor da etiqueta de tipo no cartão do evento. Tipo fora da lista cai no
   rosa escuro (mesa-redonda, cerimônia etc.). */
const CLASSE_ETIQUETA_POR_TIPO = {
    palestra: 'etiquetaTipoPalestraTelaSelecaoEventoCheckin',
    minicurso: 'etiquetaTipoMinicursoTelaSelecaoEventoCheckin',
};

/* 'YYYY-MM-DD' → { dataCurta: 'DD/MM', semana: 'Terça' }. Constrói a
   Date em horário local (ano, mês, dia) em vez de parsear o ISO direto,
   pra não perder um dia por causa do fuso (new Date('YYYY-MM-DD') é UTC). */
function formatarDia(dataIso) {
    const [ano, mes, dia] = dataIso.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return {
        dataCurta: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`,
        semana: NOMES_DIA_SEMANA[data.getDay()],
    };
}

function textoQuantidadeEventos(quantidade) {
    return `${quantidade} ${quantidade === 1 ? 'evento' : 'eventos'}`;
}

/* Escolha do evento antes de ler os crachás: primeiro o dia (cartões
   horizontais), depois o evento do dia (lista), e o rodapé fixo com o
   resumo e o "INICIAR LEITURA".

   `onVoltar` devolve à escolha de modo do /checkin (presença x conquista)
   — ver ModalQrCode. */
export default function TelaSelecaoEventoCheckin({ onIniciar, onVoltar }) {
    const [eventos, setEventos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [diaSelecionado, setDiaSelecionado] = useState(null);
    const [palestraSelecionadaId, setPalestraSelecionadaId] = useState(null);

    useEffect(() => {
        let cancelado = false;
        listarEventosCheckin()
            .then((lista) => {
                if (cancelado) return;
                setEventos(lista);
                setDiaSelecionado(lista[0]?.data ?? null);
            })
            .catch((erro) => {
                if (!cancelado) setErroCarregamento(erro.message);
            })
            .finally(() => {
                if (!cancelado) setCarregando(false);
            });
        return () => {
            cancelado = true;
        };
    }, []);

    const dias = useMemo(() => {
        const datasUnicas = [...new Set(eventos.map((evento) => evento.data))];
        return datasUnicas.map((data) => ({
            data,
            ...formatarDia(data),
            quantidade: eventos.filter((evento) => evento.data === data).length,
        }));
    }, [eventos]);

    const palestrasDoDia = useMemo(
        () => eventos.filter((evento) => evento.data === diaSelecionado),
        [eventos, diaSelecionado]
    );

    const diaSelecionadoFormatado = dias.find((dia) => dia.data === diaSelecionado) ?? null;
    const palestraSelecionada = palestrasDoDia.find((evento) => evento.id === palestraSelecionadaId) ?? null;

    function selecionarDia(data) {
        setDiaSelecionado(data);
        setPalestraSelecionadaId(null);
    }

    // Tocar de novo no evento já escolhido desmarca.
    function alternarPalestra(id) {
        setPalestraSelecionadaId((atual) => (atual === id ? null : id));
    }

    function iniciarLeitura() {
        if (palestraSelecionada) onIniciar(palestraSelecionada);
    }

    return (
        <div className="containerTelaSelecaoEventoCheckin">
            <div className="cabecalhoTelaSelecaoEventoCheckin">
                <h1 className="tituloTelaSelecaoEventoCheckin">CHECK-IN</h1>
                <p className="descricaoTelaSelecaoEventoCheckin">
                    Escolha o dia e a palestra para registrar a presença dos participantes.
                </p>
            </div>

            {carregando && <p className="mensagemEstadoTelaSelecaoEventoCheckin">Carregando eventos...</p>}
            {erroCarregamento && <p className="mensagemErroTelaSelecaoEventoCheckin">{erroCarregamento}</p>}

            {!carregando && !erroCarregamento && (
                <>
                    <div className="blocoDiasTelaSelecaoEventoCheckin">
                        <div className="linhaRotuloDiasTelaSelecaoEventoCheckin">
                            <span className="rotuloEtapaTelaSelecaoEventoCheckin">1 · DIA</span>
                            <span className="contadorEtapaTelaSelecaoEventoCheckin">
                                {dias.length} {dias.length === 1 ? 'dia' : 'dias'} de evento
                            </span>
                        </div>
                        <div className="listaDiasTelaSelecaoEventoCheckin">
                            {dias.map((dia) => {
                                const ativo = dia.data === diaSelecionado;
                                return (
                                    <button
                                        key={dia.data}
                                        type="button"
                                        aria-pressed={ativo}
                                        onClick={() => selecionarDia(dia.data)}
                                        className={
                                            ativo
                                                ? 'botaoDiaTelaSelecaoEventoCheckin botaoDiaAtivoTelaSelecaoEventoCheckin'
                                                : 'botaoDiaTelaSelecaoEventoCheckin'
                                        }
                                    >
                                        <span className="semanaBotaoDiaTelaSelecaoEventoCheckin">{dia.semana}</span>
                                        <span className="dataBotaoDiaTelaSelecaoEventoCheckin">{dia.dataCurta}</span>
                                        <span className="quantidadeBotaoDiaTelaSelecaoEventoCheckin">
                                            {textoQuantidadeEventos(dia.quantidade)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="painelEventosTelaSelecaoEventoCheckin">
                        <div className="linhaRotuloEventosTelaSelecaoEventoCheckin">
                            <span className="rotuloEtapaTelaSelecaoEventoCheckin">2 · PALESTRA</span>
                            {diaSelecionadoFormatado && (
                                <span className="contadorEtapaTelaSelecaoEventoCheckin">
                                    {diaSelecionadoFormatado.semana}, {diaSelecionadoFormatado.dataCurta}
                                </span>
                            )}
                        </div>

                        <div className="listaEventosTelaSelecaoEventoCheckin">
                            {palestrasDoDia.length === 0 && (
                                <p className="mensagemEstadoTelaSelecaoEventoCheckin">
                                    Nenhum evento cadastrado para este dia.
                                </p>
                            )}
                            {palestrasDoDia.map((palestra) => {
                                const ativo = palestra.id === palestraSelecionadaId;
                                const classeEtiqueta = CLASSE_ETIQUETA_POR_TIPO[palestra.tipo.toLowerCase()]
                                    ?? 'etiquetaTipoOutroTelaSelecaoEventoCheckin';
                                return (
                                    <button
                                        key={palestra.id}
                                        type="button"
                                        aria-pressed={ativo}
                                        onClick={() => alternarPalestra(palestra.id)}
                                        className={
                                            ativo
                                                ? 'cartaoEventoTelaSelecaoEventoCheckin cartaoEventoAtivoTelaSelecaoEventoCheckin'
                                                : 'cartaoEventoTelaSelecaoEventoCheckin'
                                        }
                                    >
                                        <span className="colunaHorarioCartaoEventoTelaSelecaoEventoCheckin">
                                            <span className="horaInicioCartaoEventoTelaSelecaoEventoCheckin">{palestra.hora}</span>
                                            {palestra.horaFim && (
                                                <span className="horaFimCartaoEventoTelaSelecaoEventoCheckin">até {palestra.horaFim}</span>
                                            )}
                                        </span>
                                        <span className="colunaTextoCartaoEventoTelaSelecaoEventoCheckin">
                                            <span className="nomeCartaoEventoTelaSelecaoEventoCheckin">{palestra.nome}</span>
                                            <span className="linhaDetalhesCartaoEventoTelaSelecaoEventoCheckin">
                                                {palestra.tipo && (
                                                    <span className={`etiquetaTipoCartaoEventoTelaSelecaoEventoCheckin ${classeEtiqueta}`}>
                                                        {palestra.tipo}
                                                    </span>
                                                )}
                                                {palestra.local && (
                                                    <span className="localCartaoEventoTelaSelecaoEventoCheckin">{palestra.local}</span>
                                                )}
                                            </span>
                                        </span>
                                        <span className="marcadorSelecaoCartaoEventoTelaSelecaoEventoCheckin" aria-hidden="true">
                                            {ativo && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                                </svg>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rodapeTelaSelecaoEventoCheckin">
                            <div className="resumoRodapeTelaSelecaoEventoCheckin">
                                {palestraSelecionada
                                    ? `Selecionado: ${palestraSelecionada.hora} · ${palestraSelecionada.nome}`
                                    : 'Selecione uma palestra para continuar'}
                            </div>
                            <button
                                type="button"
                                disabled={!palestraSelecionada}
                                onClick={iniciarLeitura}
                                className="botaoIniciarLeituraTelaSelecaoEventoCheckin"
                            >
                                INICIAR LEITURA
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

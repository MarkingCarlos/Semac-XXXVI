import { useEffect, useMemo, useState } from 'preact/hooks';
import { listarEventosCheckin } from './data/apiCheckin.js';
import './TelaSelecaoEventoCheckin.css';

const NOMES_DIA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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

export default function TelaSelecaoEventoCheckin({ onIniciar }) {
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
        return datasUnicas.map((data) => ({ data, ...formatarDia(data) }));
    }, [eventos]);

    const palestrasDoDia = useMemo(
        () => eventos.filter((evento) => evento.data === diaSelecionado),
        [eventos, diaSelecionado]
    );

    const palestraSelecionada = palestrasDoDia.find((evento) => evento.id === palestraSelecionadaId) ?? null;

    function selecionarDia(data) {
        setDiaSelecionado(data);
        setPalestraSelecionadaId(null);
    }

    function iniciarLeitura() {
        if (palestraSelecionada) onIniciar(palestraSelecionada);
    }

    return (
        <div className="containerTelaSelecaoCheckin">
            <div className="cabecalhoTituloTelaSelecaoCheckin">
                <h1 className="tituloTelaSelecaoCheckin">SELECIONE O EVENTO</h1>
            </div>

            {carregando && <p className="mensagemEstadoTelaSelecaoCheckin">Carregando eventos...</p>}
            {erroCarregamento && <p className="mensagemErroTelaSelecaoCheckin">{erroCarregamento}</p>}

            {!carregando && !erroCarregamento && (
                <>
                    <div className="blocoDiasTelaSelecaoCheckin">
                        <div className="rotuloSecaoTelaSelecaoCheckin">SELECIONE O DIA</div>
                        <div className="listaDiasTelaSelecaoCheckin">
                            {dias.map((dia) => (
                                <button
                                    key={dia.data}
                                    type="button"
                                    onClick={() => selecionarDia(dia.data)}
                                    className={
                                        dia.data === diaSelecionado
                                            ? 'botaoDiaTelaSelecaoCheckin botaoDiaTelaSelecaoCheckinAtivo'
                                            : 'botaoDiaTelaSelecaoCheckin'
                                    }
                                >
                                    <span className="dataBotaoDiaTelaSelecaoCheckin">{dia.dataCurta}</span>
                                    <span className="semanaBotaoDiaTelaSelecaoCheckin">{dia.semana}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="blocoPalestrasTelaSelecaoCheckin">
                        <div className="rotuloSecaoTelaSelecaoCheckin">SELECIONE A PALESTRA</div>
                        <div className="listaPalestrasTelaSelecaoCheckin">
                            {palestrasDoDia.length === 0 && (
                                <p className="mensagemEstadoTelaSelecaoCheckin">
                                    Nenhum evento cadastrado para este dia.
                                </p>
                            )}
                            {palestrasDoDia.map((palestra) => (
                                <button
                                    key={palestra.id}
                                    type="button"
                                    onClick={() => setPalestraSelecionadaId(palestra.id)}
                                    className={
                                        palestra.id === palestraSelecionadaId
                                            ? 'botaoPalestraTelaSelecaoCheckin botaoPalestraTelaSelecaoCheckinAtivo'
                                            : 'botaoPalestraTelaSelecaoCheckin'
                                    }
                                >
                                    <span className="horaBotaoPalestraTelaSelecaoCheckin">{palestra.hora}</span>
                                    <span className="nomeBotaoPalestraTelaSelecaoCheckin">{palestra.nome}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="rodapeTelaSelecaoCheckin">
                <button
                    type="button"
                    disabled={!palestraSelecionada}
                    onClick={iniciarLeitura}
                    className="botaoIniciarTelaSelecaoCheckin"
                >
                    INICIAR LEITURA
                </button>
            </div>
        </div>
    );
}

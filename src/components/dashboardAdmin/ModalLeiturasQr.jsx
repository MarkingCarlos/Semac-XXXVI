import { useState } from 'preact/hooks';
import ModalTopoDashboard from './ModalTopoDashboard.jsx';
import { buscarDetalheCheckinDashboard } from './data/apiDashboard.js';
import { formatarDiaHora, formatarHora, nomeOperador, porcentagem } from './formatoDashboard.js';
import { usarConsultaPeriodica } from './usarConsultaPeriodica.js';

/* Detalhe do card de leitura de QR. Duas abas:
   - Eventos: os que estão acontecendo e os passados; ao escolher um, as
     leituras por membro naquele evento e a lista de quem leu quem;
   - Por membro: total de leituras de cada membro da comissão.

   Props:
     dados    — resposta de GET /api/dashboard/checkins (o pai já a
                atualiza periodicamente, então as listas daqui ficam vivas)
     aoFechar — () => void */
export default function ModalLeiturasQr({ dados, aoFechar }) {
    const [aba, setAba] = useState('eventos');
    const [eventoSelecionado, setEventoSelecionado] = useState(null);

    const idsAgora = new Set(dados.eventosAgora.map((evento) => evento.id));

    return (
        <ModalTopoDashboard
            titulo={eventoSelecionado ? eventoSelecionado.nome : 'Leitura de QR code'}
            subtitulo={eventoSelecionado
                ? formatarDiaHora(eventoSelecionado.dataHoraInicio)
                : `${dados.totalLeituras} QR codes lidos no total`}
            aoVoltar={eventoSelecionado ? () => setEventoSelecionado(null) : null}
            aoFechar={aoFechar}
        >
            {eventoSelecionado ? (
                <DetalheEventoQr
                    key={eventoSelecionado.id}
                    eventoId={eventoSelecionado.id}
                    aoVivo={idsAgora.has(eventoSelecionado.id)}
                />
            ) : (
                <>
                    <div className="abasModalDashboard" role="tablist" aria-label="Visualização das leituras">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={aba === 'eventos'}
                            className={`abaModalDashboard ${aba === 'eventos' ? 'abaAtivaModalDashboard' : ''}`}
                            onClick={() => setAba('eventos')}
                        >
                            Eventos
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={aba === 'membros'}
                            className={`abaModalDashboard ${aba === 'membros' ? 'abaAtivaModalDashboard' : ''}`}
                            onClick={() => setAba('membros')}
                        >
                            Por membro
                        </button>
                    </div>

                    {aba === 'eventos'
                        ? <ListaEventosQr eventos={dados.eventos} idsAgora={idsAgora} aoEscolher={setEventoSelecionado} />
                        : <ListaLeiturasPorMembro membros={dados.porMembro} />}
                </>
            )}
        </ModalTopoDashboard>
    );
}

function ListaEventosQr({ eventos, idsAgora, aoEscolher }) {
    if (eventos.length === 0) {
        return <p className="estadoModalDashboard">Nenhum evento abriu o check-in ainda.</p>;
    }

    return (
        <ul className="listaModalDashboard">
            {eventos.map((evento) => {
                const aoVivo = idsAgora.has(evento.id);
                return (
                    <li key={evento.id}>
                        <button
                            type="button"
                            className={`linhaClicavelModalDashboard ${aoVivo ? 'linhaDestaqueModalDashboard' : ''}`}
                            onClick={() => aoEscolher(evento)}
                        >
                            <span className="blocoTextoLinhaModalDashboard">
                                <span className="nomeLinhaModalDashboard">{evento.nome}</span>
                                <span className="detalheLinhaModalDashboard">
                                    {evento.tipo} · {formatarDiaHora(evento.dataHoraInicio)}
                                </span>
                                <span className="barraModalDashboard" aria-hidden="true">
                                    <span
                                        className="preenchimentoBarraModalDashboard"
                                        style={{ width: `${porcentagem(evento.leituras, evento.esperados)}%` }}
                                    />
                                </span>
                            </span>
                            {aoVivo && (
                                <span className="etiquetaModalDashboard etiquetaAmarelaModalDashboard">Agora</span>
                            )}
                            <span className="valorLinhaModalDashboard">
                                {evento.leituras}/{evento.esperados}
                                <span className="rotuloValorLinhaModalDashboard">lidos</span>
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function ListaLeiturasPorMembro({ membros }) {
    if (membros.length === 0) {
        return <p className="estadoModalDashboard">Nenhum QR code lido ainda.</p>;
    }

    return (
        <ol className="listaModalDashboard">
            {membros.map((membro) => (
                <li
                    key={membro.operadorId ?? 'semOperador'}
                    className="linhaModalDashboard"
                >
                    <span className="blocoTextoLinhaModalDashboard">
                        <span className="nomeLinhaModalDashboard">{nomeOperador(membro.operadorNome)}</span>
                    </span>
                    <span className="valorLinhaModalDashboard">
                        {membro.leituras}
                        <span className="rotuloValorLinhaModalDashboard">
                            {membro.leituras === 1 ? 'leitura' : 'leituras'}
                        </span>
                    </span>
                </li>
            ))}
        </ol>
    );
}

/* Leituras de um evento: resumo por membro (clicável, filtra a lista) e
   quem leu quem. Evento acontecendo agora continua se atualizando. */
function DetalheEventoQr({ eventoId, aoVivo }) {
    const { dados: detalhe, erro } = usarConsultaPeriodica(
        () => buscarDetalheCheckinDashboard(eventoId),
        aoVivo
    );
    const [operadorFiltrado, setOperadorFiltrado] = useState(undefined);

    if (erro && !detalhe) return <p className="estadoModalDashboard erroModalDashboard">{erro}</p>;
    if (!detalhe) return <p className="estadoModalDashboard">Carregando leituras...</p>;

    const { evento, porMembro, leituras } = detalhe;
    const leiturasVisiveis = operadorFiltrado === undefined
        ? leituras
        : leituras.filter((leitura) => leitura.operadorId === operadorFiltrado);

    return (
        <>
            <div className="resumoTotaisModalDashboard">
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{evento.leituras}</span>
                    <span className="rotuloResumoTotaisModalDashboard">QR lidos</span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{evento.esperados}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Esperados</span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{porcentagem(evento.leituras, evento.esperados)}%</span>
                    <span className="rotuloResumoTotaisModalDashboard">Presença</span>
                </div>
            </div>

            {porMembro.length > 0 && (
                <>
                    <h3 className="tituloSecaoModalDashboard">Leituras por membro</h3>
                    <ul className="listaModalDashboard">
                        {porMembro.map((membro) => {
                            const ativo = operadorFiltrado === membro.operadorId;
                            return (
                                <li key={membro.operadorId ?? 'semOperador'}>
                                    <button
                                        type="button"
                                        className={`linhaClicavelModalDashboard ${ativo ? 'linhaDestaqueModalDashboard' : ''}`}
                                        aria-pressed={ativo}
                                        onClick={() => setOperadorFiltrado(ativo ? undefined : membro.operadorId)}
                                    >
                                        <span className="blocoTextoLinhaModalDashboard">
                                            <span className="nomeLinhaModalDashboard">{nomeOperador(membro.operadorNome)}</span>
                                            <span className="detalheLinhaModalDashboard">
                                                {ativo ? 'Mostrando só as leituras deste membro' : 'Toque para filtrar as leituras'}
                                            </span>
                                        </span>
                                        <span className="valorLinhaModalDashboard">{membro.leituras}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}

            <h3 className="tituloSecaoModalDashboard">Quem leu quem</h3>
            {leiturasVisiveis.length === 0 ? (
                <p className="estadoModalDashboard">Nenhum QR code lido neste evento.</p>
            ) : (
                <ul className="listaModalDashboard">
                    {leiturasVisiveis.map((leitura) => (
                        <li key={leitura.participanteId} className="linhaModalDashboard">
                            <span className="blocoTextoLinhaModalDashboard">
                                <span className="nomeLinhaModalDashboard">{leitura.participanteNome}</span>
                                <span className="detalheLinhaModalDashboard">
                                    Lido por {nomeOperador(leitura.operadorNome)}
                                </span>
                            </span>
                            <span className="valorLinhaModalDashboard">{formatarHora(leitura.lidoEm)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

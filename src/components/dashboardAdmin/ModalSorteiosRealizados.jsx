import { useState } from 'preact/hooks';
import ModalTopoDashboard from './ModalTopoDashboard.jsx';
import { formatarDiaHora } from './formatoDashboard.js';

/* Detalhe do card de sorteios: a lista de sorteios com quantos brindes já
   saíram e, ao escolher um, quem ganhou, quem sorteou e quando.

   Um sorteio conta como realizado quando tem ao menos um ganhador.

   Props:
     sorteios — resposta de GET /api/sorteio
     aoFechar — () => void */
export default function ModalSorteiosRealizados({ sorteios, aoFechar }) {
    const [idSorteioSelecionado, setIdSorteioSelecionado] = useState(null);
    const sorteioSelecionado = sorteios.find((s) => s.id === idSorteioSelecionado) ?? null;

    const realizados = sorteios.filter((s) => s.ganhadores.length > 0).length;

    return (
        <ModalTopoDashboard
            titulo={sorteioSelecionado ? sorteioSelecionado.nome : 'Sorteios realizados'}
            subtitulo={sorteioSelecionado
                ? `${sorteioSelecionado.eventoNome} · ${formatarDiaHora(sorteioSelecionado.eventoDataHoraInicio)}`
                : `${realizados}/${sorteios.length} sorteios realizados`}
            aoVoltar={sorteioSelecionado ? () => setIdSorteioSelecionado(null) : null}
            aoFechar={aoFechar}
        >
            {sorteioSelecionado
                ? <GanhadoresSorteio sorteio={sorteioSelecionado} />
                : (
                    <ListaSorteios
                        sorteios={sorteios}
                        realizados={realizados}
                        aoEscolher={(sorteio) => setIdSorteioSelecionado(sorteio.id)}
                    />
                )}
        </ModalTopoDashboard>
    );
}

/* Totais e um sorteio por linha; os ainda não realizados ficam marcados. */
function ListaSorteios({ sorteios, realizados, aoEscolher }) {
    const sorteiosOrdenados = [...sorteios].sort((a, b) =>
        (a.eventoDataHoraInicio ?? '').localeCompare(b.eventoDataHoraInicio ?? ''));

    return (
        <>
            <div className="resumoTotaisModalDashboard">
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{sorteios.length}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Sorteios</span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{realizados}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Realizados</span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{sorteios.length - realizados}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Pendentes</span>
                </div>
            </div>

            {sorteiosOrdenados.length === 0 ? (
                <p className="estadoModalDashboard">Nenhum sorteio cadastrado.</p>
            ) : (
                <ul className="listaModalDashboard">
                    {sorteiosOrdenados.map((sorteio) => (
                        <li key={sorteio.id}>
                            <button
                                type="button"
                                className="linhaClicavelModalDashboard"
                                onClick={() => aoEscolher(sorteio)}
                            >
                                <span className="blocoTextoLinhaModalDashboard">
                                    <span className="nomeLinhaModalDashboard">{sorteio.nome}</span>
                                    <span className="detalheLinhaModalDashboard">
                                        {sorteio.eventoNome} · {formatarDiaHora(sorteio.eventoDataHoraInicio)}
                                    </span>
                                </span>
                                {sorteio.ganhadores.length === 0 ? (
                                    <span className="etiquetaModalDashboard etiquetaNeutraModalDashboard">Pendente</span>
                                ) : (
                                    <span className="valorLinhaModalDashboard">
                                        {sorteio.quantidadeEntregue}/{sorteio.quantidadeBrindes}
                                        <span className="rotuloValorLinhaModalDashboard">
                                            {sorteio.quantidadeBrindes === 1 ? 'brinde' : 'brindes'}
                                        </span>
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

/* Ganhadores do sorteio, do primeiro ao último a ser sorteado. */
function GanhadoresSorteio({ sorteio }) {
    if (sorteio.ganhadores.length === 0) {
        return <p className="estadoModalDashboard">Ninguém ganhou neste sorteio ainda.</p>;
    }

    const ganhadoresOrdenados = [...sorteio.ganhadores].sort((a, b) =>
        (a.ganhouEm ?? '').localeCompare(b.ganhouEm ?? ''));

    return (
        <ul className="listaModalDashboard">
            {ganhadoresOrdenados.map((ganhador) => (
                <li key={ganhador.id} className="linhaModalDashboard">
                    <span className="blocoTextoLinhaModalDashboard">
                        <span className="nomeLinhaModalDashboard">{ganhador.participanteNome}</span>
                        <span className="detalheLinhaModalDashboard">
                            Ganhou: {ganhador.brindeNome}
                        </span>
                        <span className="detalheLinhaModalDashboard">
                            Sorteado por {ganhador.organizadorNome} · {formatarDiaHora(ganhador.ganhouEm)}
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

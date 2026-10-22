import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import ModalTopoDashboard from './ModalTopoDashboard.jsx';
import { partesDiaSemana } from './formatoDashboard.js';
import './modalParticipantesPorDia.css';

/* Detalhe do card "Participantes por dia": barras empilhadas por dia
   (passe completo embaixo, diárias em cima, total no topo) e a mesma
   conta em tabela, para quem não lê o gráfico.

   Cores validadas (dataviz/validate_palette.js) contra o fundo do modal
   (--vermelhoEscuro #590629): passam faixa de luminosidade, croma,
   daltonismo e contraste. O âmbar é o da marca, escurecido para a faixa.

   Nada de JSX como filho ou prop dos componentes do recharts (LabelList
   dentro do Bar, content={<Tooltip />}): o recharts 3 guarda as props do
   Bar no store, o immer congela o objeto e o Preact quebra ao tentar
   reaproveitar o vnode congelado (TypeError "read only property '__'"),
   duplicando a dashboard na tela. Rótulo e tooltip vão como função.

   Props:
     dados    — resposta de GET /api/dashboard/participantes-por-dia
     aoFechar — () => void */

const COR_PASSE_COMPLETO_PARTICIPANTES_DIA = '#C97B1E';
const COR_DIARIAS_PARTICIPANTES_DIA = '#3E95C9';
const COR_FUNDO_MODAL_PARTICIPANTES_DIA = '#590629';

export default function ModalParticipantesPorDia({ dados, aoFechar }) {
    const linhasParticipantesDia = dados.dias.map((dia) => {
        const { sigla, data } = partesDiaSemana(dia.dia);
        return { ...dia, rotulo: `${sigla} ${data}` };
    });
    // O recharts não desenha segmento de altura zero e numera os rótulos só
    // entre os desenhados: o `index` do rótulo é a posição nestas listas,
    // não em linhasParticipantesDia.
    const linhasComPasseCompletoParticipantesDia = linhasParticipantesDia.filter((dia) => dia.passeCompleto > 0);
    const linhasComDiaristasParticipantesDia = linhasParticipantesDia.filter((dia) => dia.diaristas > 0);
    const diaPicoParticipantes = linhasParticipantesDia.reduce(
        (maior, dia) => (!maior || dia.total > maior.total ? dia : maior), null);

    return (
        <ModalTopoDashboard
            titulo="Participantes por dia"
            subtitulo="Participantes confirmados esperados em cada dia"
            aoFechar={aoFechar}
        >
            <div className="resumoTotaisModalDashboard">
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{dados.totalPasseCompleto}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Passe completo</span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{diaPicoParticipantes?.total ?? 0}</span>
                    <span className="rotuloResumoTotaisModalDashboard">
                        {diaPicoParticipantes ? `Pico · ${diaPicoParticipantes.rotulo}` : 'Pico'}
                    </span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{dados.diaristasSemEscolha}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Diaristas sem dia</span>
                </div>
            </div>

            {linhasParticipantesDia.length === 0 ? (
                <p className="estadoModalDashboard">Nenhum evento na programação ainda.</p>
            ) : (
                <>
                    <ul className="legendaGraficoParticipantesDia" aria-label="Legenda">
                        <li className="itemLegendaGraficoParticipantesDia">
                            <span
                                className="marcadorLegendaGraficoParticipantesDia"
                                style={{ background: COR_PASSE_COMPLETO_PARTICIPANTES_DIA }}
                                aria-hidden="true"
                            />
                            Passe completo
                        </li>
                        <li className="itemLegendaGraficoParticipantesDia">
                            <span
                                className="marcadorLegendaGraficoParticipantesDia"
                                style={{ background: COR_DIARIAS_PARTICIPANTES_DIA }}
                                aria-hidden="true"
                            />
                            Diárias
                        </li>
                    </ul>

                    {/* A tabela abaixo traz os mesmos números; o gráfico é decorativo para leitor de tela. */}
                    <div className="areaGraficoParticipantesDia" aria-hidden="true">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={linhasParticipantesDia}
                                margin={{ top: 22, right: 4, bottom: 0, left: -18 }}
                                barCategoryGap="28%"
                            >
                                <CartesianGrid vertical={false} stroke="rgba(252,248,245,0.10)" />
                                <XAxis
                                    dataKey="rotulo"
                                    stroke="rgba(237,236,236,0.72)"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    stroke="rgba(237,236,236,0.45)"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    content={TooltipParticipantesDia}
                                    cursor={{ fill: 'rgba(252,248,245,0.06)' }}
                                />
                                {/* Contorno na cor do fundo: separa os dois segmentos da pilha com 2px. */}
                                <Bar
                                    dataKey="passeCompleto"
                                    name="Passe completo"
                                    stackId="participantesDia"
                                    fill={COR_PASSE_COMPLETO_PARTICIPANTES_DIA}
                                    stroke={COR_FUNDO_MODAL_PARTICIPANTES_DIA}
                                    strokeWidth={1}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={44}
                                    isAnimationActive={false}
                                    label={(propsRotulo) => {
                                        const linha = linhasComPasseCompletoParticipantesDia[propsRotulo.index];
                                        return linha?.diaristas === 0
                                            ? <RotuloTotalParticipantesDia {...propsRotulo} total={linha.total} />
                                            : null;
                                    }}
                                />
                                <Bar
                                    dataKey="diaristas"
                                    name="Diárias"
                                    stackId="participantesDia"
                                    fill={COR_DIARIAS_PARTICIPANTES_DIA}
                                    stroke={COR_FUNDO_MODAL_PARTICIPANTES_DIA}
                                    strokeWidth={1}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={44}
                                    isAnimationActive={false}
                                    label={(propsRotulo) => {
                                        const linha = linhasComDiaristasParticipantesDia[propsRotulo.index];
                                        return linha
                                            ? <RotuloTotalParticipantesDia {...propsRotulo} total={linha.total} />
                                            : null;
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <table className="tabelaParticipantesDia">
                        <caption className="legendaTabelaParticipantesDia">Participantes esperados por dia</caption>
                        <thead>
                            <tr>
                                <th scope="col">Dia</th>
                                <th scope="col">Passe completo</th>
                                <th scope="col">Diárias</th>
                                <th scope="col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhasParticipantesDia.map((dia) => (
                                <tr key={dia.dia}>
                                    <th scope="row">{dia.rotulo}</th>
                                    <td>{dia.passeCompleto}</td>
                                    <td>{dia.diaristas}</td>
                                    <td className="celulaTotalTabelaParticipantesDia">{dia.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {dados.diaristasSemEscolha > 0 && (
                <p className="notaParticipantesDia">
                    {dados.diaristasSemEscolha === 1
                        ? '1 diarista ainda não escolheu o dia e não aparece em nenhuma barra.'
                        : `${dados.diaristasSemEscolha} diaristas ainda não escolheram os dias e não aparecem em nenhuma barra.`}
                </p>
            )}
        </ModalTopoDashboard>
    );
}

/* Total do dia acima da pilha. Vai no segmento de cima (diárias); num dia
   sem diarista esse segmento tem altura zero e o recharts não desenha o
   rótulo, então aí quem mostra o total é o segmento do passe completo. */
function RotuloTotalParticipantesDia({ x, y, width, total }) {
    if (total == null) return null;
    return (
        <text
            x={x + width / 2}
            y={y - 6}
            textAnchor="middle"
            fill="#fcf8f5"
            fontSize={12}
            fontWeight={700}
        >
            {total}
        </text>
    );
}

function TooltipParticipantesDia({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const total = payload[0]?.payload?.total ?? 0;
    return (
        <div className="tooltipParticipantesDia">
            <strong className="tituloTooltipParticipantesDia">{label}</strong>
            {[...payload].reverse().map((serie) => (
                <span key={serie.name} className="linhaTooltipParticipantesDia">
                    <span
                        className="marcadorLegendaGraficoParticipantesDia"
                        style={{ background: serie.color }}
                        aria-hidden="true"
                    />
                    {serie.name}: {serie.value}
                </span>
            ))}
            <span className="totalTooltipParticipantesDia">Total: {total}</span>
        </div>
    );
}

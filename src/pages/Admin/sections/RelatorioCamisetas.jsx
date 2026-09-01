// Relatório de camisetas: quantas precisamos comprar no total, divididas
// entre as inclusas no kit (ingresso) e as compradas à parte. A divisão é
// por pessoa, feita no backend — soma-se o que cada uma já pediu no
// cadastro e compara com o camisetasGratis do ingresso dela; quem é da
// comissão perdeu esse vínculo ao ser confirmado (o ingresso é zerado em
// PessoaService.atribuirRole), então tudo que ela já pediu conta como
// inclusa, já que a comissão não paga por camiseta.
//
// Dados vêm de GET /api/relatorio/camisetas.

import { useEffect, useState } from 'preact/hooks';
import { PieChart, Pie, Cell, Sector, Tooltip } from 'recharts';
import { buscarRelatorioCamisetas } from '../data/apiRelatorios.js';
import { formatarCentavos } from '../../Financas/utils/moeda.js';
import './relatorioCamisetas.css';

// Backend manda receita/custo/lucro em reais (BigDecimal); formatarCentavos
// espera centavos, então convertemos aqui na borda do componente.
const paraCentavos = (reais) => Math.round(Number(reais ?? 0) * 100);

const ROTULO_MODELO = { NORMAL: 'Normal', BABY_LOOK: 'Baby Look' };
const ORDEM_TAMANHO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

// Ordena por modelo e depois pelo tamanho na progressão de numeração.
function ordenarItens(itens) {
    return [...itens].sort((a, b) => {
        if (a.modelo !== b.modelo) return a.modelo.localeCompare(b.modelo);
        return ORDEM_TAMANHO.indexOf(a.tamanho) - ORDEM_TAMANHO.indexOf(b.tamanho);
    });
}

// Tooltip customizado da rosca — segue o mesmo cartão escuro do resto do
// admin, com uma bolinha da cor da fatia pra reforçar a associação visual.
function TooltipDonutCamisetas({ active, payload }) {
    if (!active || !payload?.length || payload[0].name === 'Nenhuma') return null;
    const item = payload[0];
    const classeMarcador = item.name === 'Inclusas no kit'
        ? 'marcadorDadasRelatorioCamisetas'
        : 'marcadorAvulsasRelatorioCamisetas';
    return (
        <div class="tooltipDonutRelatorioCamisetas">
            <span class={`marcadorLegendaRelatorioCamisetas ${classeMarcador}`} />
            <strong>{item.name}</strong>: {item.value}
        </div>
    );
}

// Fatia "em destaque" ao passar o mouse (ou ao passar na legenda, já que os
// dois compartilham o mesmo índice ativo): mesma cor, só um pouco maior.
function FormaAtivaDonutCamisetas({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, payload }) {
    return (
        <Sector
            cx={cx} cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 6}
            startAngle={startAngle}
            endAngle={endAngle}
            class={payload?.classe}
            style={payload?.gradiente ? { fill: `url(#${payload.gradiente})` } : undefined}
        />
    );
}

// Gráfico de rosca via Recharts: duas fatias — dadas e avulsas — com o
// total centralizado (texto sobreposto como filho direto do PieChart),
// preenchimento em gradiente e destaque sincronizado entre a fatia e o
// item correspondente da legenda.
function DonutCamisetas({ totalDadas, totalAvulsas }) {
    const [indiceAtivo, setIndiceAtivo] = useState(null);
    const total = totalDadas + totalAvulsas;
    const dados = total > 0
        ? [
            { nome: 'Inclusas no kit', valor: totalDadas, gradiente: 'gradienteDadasRelatorioCamisetas' },
            { nome: 'Compradas à parte', valor: totalAvulsas, gradiente: 'gradienteAvulsasRelatorioCamisetas' },
        ]
        : [{ nome: 'Nenhuma', valor: 1, classe: 'trilhoDonutRelatorioCamisetas' }];
    const porcentagem = (valor) => (total > 0 ? Math.round((valor / total) * 100) : 0);

    return (
        <>
            <div
                class="svgDonutRelatorioCamisetas"
                role="img"
                aria-label={`${totalDadas} camisetas inclusas no kit e ${totalAvulsas} compradas à parte, de um total de ${total}`}
            >
                <PieChart width={180} height={180}>
                    <defs>
                        <linearGradient id="gradienteDadasRelatorioCamisetas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" class="paradaInicioDadasRelatorioCamisetas" />
                            <stop offset="100%" class="paradaFimDadasRelatorioCamisetas" />
                        </linearGradient>
                        <linearGradient id="gradienteAvulsasRelatorioCamisetas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" class="paradaInicioAvulsasRelatorioCamisetas" />
                            <stop offset="100%" class="paradaFimAvulsasRelatorioCamisetas" />
                        </linearGradient>
                    </defs>
                    <Pie
                        data={dados}
                        dataKey="valor"
                        nameKey="nome"
                        cx={90}
                        cy={90}
                        innerRadius={56}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                        paddingAngle={total > 0 ? 3 : 0}
                        cornerRadius={total > 0 ? 6 : 0}
                        animationDuration={700}
                        animationEasing="ease-out"
                        activeIndex={indiceAtivo}
                        activeShape={FormaAtivaDonutCamisetas}
                        onMouseEnter={(_, indice) => setIndiceAtivo(indice)}
                        onMouseLeave={() => setIndiceAtivo(null)}
                    >
                        {dados.map((item) => (
                            <Cell
                                key={item.nome}
                                class={item.classe}
                                style={item.gradiente ? { fill: `url(#${item.gradiente})` } : undefined}
                            />
                        ))}
                    </Pie>
                    <text x={90} y={86} text-anchor="middle" class="numeroCentralDonutRelatorioCamisetas">{total}</text>
                    <text x={90} y={104} text-anchor="middle" class="rotuloCentralDonutRelatorioCamisetas">no total</text>
                    <Tooltip content={<TooltipDonutCamisetas />} />
                </PieChart>
            </div>
            <ul class="legendaDonutRelatorioCamisetas">
                <li
                    class="itemLegendaRelatorioCamisetas"
                    onMouseEnter={() => setIndiceAtivo(0)}
                    onMouseLeave={() => setIndiceAtivo(null)}
                >
                    <span class="marcadorLegendaRelatorioCamisetas marcadorDadasRelatorioCamisetas" />
                    Inclusas no kit — <strong>{totalDadas}</strong> ({porcentagem(totalDadas)}%)
                </li>
                <li
                    class="itemLegendaRelatorioCamisetas"
                    onMouseEnter={() => setIndiceAtivo(1)}
                    onMouseLeave={() => setIndiceAtivo(null)}
                >
                    <span class="marcadorLegendaRelatorioCamisetas marcadorAvulsasRelatorioCamisetas" />
                    Compradas à parte — <strong>{totalAvulsas}</strong> ({porcentagem(totalAvulsas)}%)
                </li>
            </ul>
        </>
    );
}

export default function RelatorioCamisetas() {
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let ativo = true;
        buscarRelatorioCamisetas()
            .then((d) => { if (ativo) setDados(d); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    if (carregando) return <p class="estadoCarregandoParticipantesAdmin">Carregando relatório...</p>;
    if (erro) return <p class="avisoErroAdmin">{erro}</p>;
    if (!dados) return null;

    const {
        totalGeral, totalDadas, totalAvulsas,
        totalComissao, totalParticipantes,
        receitaAvulsas, custoAvulsas, lucroAvulsas,
        porModeloTamanho,
    } = dados;
    const itens = ordenarItens(porModeloTamanho ?? []);

    return (
        <div class="conteudoRelatorioCamisetas">
            <div class="gradeCartoesRelatorioCamisetas">
                <div class="cartaoEstatisticaAdmin cartaoTotalRelatorioCamisetas">
                    <span class="numeroEstatisticaAdmin">{totalGeral}</span>
                    <span class="rotuloEstatisticaAdmin">Total a comprar</span>
                </div>
                <div class="cartaoEstatisticaAdmin cartaoDadasRelatorioCamisetas">
                    <span class="numeroEstatisticaAdmin">{totalDadas}</span>
                    <span class="rotuloEstatisticaAdmin">Inclusas no kit</span>
                </div>
                <div class="cartaoEstatisticaAdmin cartaoAvulsasRelatorioCamisetas">
                    <span class="numeroEstatisticaAdmin">{totalAvulsas}</span>
                    <span class="rotuloEstatisticaAdmin">Compradas à parte</span>
                </div>
            </div>

            <div class="conteinerTabelaAdmin blocoGraficoRelatorioCamisetas">
                <DonutCamisetas totalDadas={totalDadas} totalAvulsas={totalAvulsas} />
            </div>

            <div class="blocoSecaoRelatorioCamisetas">
                <h2 class="tituloTabelaAdmin">Por perfil</h2>
                <div class="gradeComissaoParticipantesRelatorioCamisetas">
                    <div class="cartaoEstatisticaAdmin cartaoComissaoRelatorioCamisetas">
                        <span class="numeroEstatisticaAdmin">{totalComissao}</span>
                        <span class="rotuloEstatisticaAdmin">Camisetas da comissão</span>
                    </div>
                    <div class="cartaoEstatisticaAdmin cartaoParticipantesRelatorioCamisetas">
                        <span class="numeroEstatisticaAdmin">{totalParticipantes}</span>
                        <span class="rotuloEstatisticaAdmin">Camisetas de participantes</span>
                    </div>
                </div>
            </div>

            <div class="blocoSecaoRelatorioCamisetas">
                <h2 class="tituloTabelaAdmin">Financeiro das avulsas</h2>
                <div class="gradeFinanceiroRelatorioCamisetas">
                    <div class="cartaoEstatisticaAdmin cartaoReceitaRelatorioCamisetas">
                        <span class="numeroEstatisticaAdmin">{formatarCentavos(paraCentavos(receitaAvulsas))}</span>
                        <span class="rotuloEstatisticaAdmin">Receita</span>
                    </div>
                    <div class="cartaoEstatisticaAdmin cartaoCustoRelatorioCamisetas">
                        <span class="numeroEstatisticaAdmin">{formatarCentavos(paraCentavos(custoAvulsas))}</span>
                        <span class="rotuloEstatisticaAdmin">Custo</span>
                    </div>
                    <div class="cartaoEstatisticaAdmin cartaoLucroRelatorioCamisetas">
                        <span class="numeroEstatisticaAdmin">{formatarCentavos(paraCentavos(lucroAvulsas))}</span>
                        <span class="rotuloEstatisticaAdmin">Lucro estimado</span>
                    </div>
                </div>
            </div>

            <div class="conteinerTabelaAdmin">
                <div class="topoTabelaAdmin">
                    <h2 class="tituloTabelaAdmin">Quantidade por modelo e tamanho</h2>
                </div>
                <div class="scrollTabelaAdmin">
                    <table class="tabelaAdmin">
                        <thead>
                            <tr>
                                <th>Modelo</th>
                                <th>Tamanho</th>
                                <th>Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.length === 0 ? (
                                <tr>
                                    <td colSpan={3} class="tabelaVaziaAdmin">Nenhuma camiseta pedida ainda.</td>
                                </tr>
                            ) : itens.map((item) => (
                                <tr key={`${item.modelo}-${item.tamanho}`}>
                                    <td>{ROTULO_MODELO[item.modelo] ?? item.modelo}</td>
                                    <td>{item.tamanho}</td>
                                    <td class="celulaNumeroAdmin">{item.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

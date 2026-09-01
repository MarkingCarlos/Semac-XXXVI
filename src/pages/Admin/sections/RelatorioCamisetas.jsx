// Relatório de camisetas: quantas precisamos comprar no total, divididas
// entre as inclusas no ingresso ("dadas") e as compradas à parte
// ("avulsas"). A divisão é por pessoa, feita no backend — soma-se o que
// cada uma já pediu no cadastro e compara com o camisetasGratis do
// ingresso dela; quem é da comissão perdeu esse vínculo ao ser confirmado
// (o ingresso é zerado em PessoaService.atribuirRole), então tudo que ela
// já pediu conta como dado, já que a comissão não paga por camiseta.
//
// Dados vêm de GET /api/relatorio/camisetas.

import { useEffect, useState } from 'preact/hooks';
import { buscarRelatorioCamisetas } from '../data/apiRelatorios.js';
import './relatorioCamisetas.css';

const ROTULO_MODELO = { NORMAL: 'Normal', BABY_LOOK: 'Baby Look' };
const ORDEM_TAMANHO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

// Ordena por modelo e depois pelo tamanho na progressão de numeração.
function ordenarItens(itens) {
    return [...itens].sort((a, b) => {
        if (a.modelo !== b.modelo) return a.modelo.localeCompare(b.modelo);
        return ORDEM_TAMANHO.indexOf(a.tamanho) - ORDEM_TAMANHO.indexOf(b.tamanho);
    });
}

// Gráfico de rosca em SVG puro (sem biblioteca): duas fatias — dadas e
// avulsas — desenhadas com stroke-dasharray sobre a circunferência do
// círculo, giradas para começar no topo.
function DonutCamisetas({ totalDadas, totalAvulsas }) {
    const total = totalDadas + totalAvulsas;
    const raio = 60;
    const circunferencia = 2 * Math.PI * raio;
    const fracaoDadas = total > 0 ? totalDadas / total : 0;
    const comprimentoDadas = circunferencia * fracaoDadas;
    const comprimentoAvulsas = circunferencia - comprimentoDadas;

    return (
        <svg
            viewBox="0 0 160 160"
            class="svgDonutRelatorioCamisetas"
            role="img"
            aria-label={`${totalDadas} camisetas dadas e ${totalAvulsas} avulsas, de um total de ${total}`}
        >
            <circle cx="80" cy="80" r={raio} class="trilhoDonutRelatorioCamisetas" />
            {total > 0 && (
                <>
                    <circle
                        cx="80" cy="80" r={raio}
                        class="fatiaDadasDonutRelatorioCamisetas"
                        stroke-dasharray={`${comprimentoDadas} ${circunferencia}`}
                        transform="rotate(-90 80 80)"
                    />
                    <circle
                        cx="80" cy="80" r={raio}
                        class="fatiaAvulsasDonutRelatorioCamisetas"
                        stroke-dasharray={`${comprimentoAvulsas} ${circunferencia}`}
                        stroke-dashoffset={-comprimentoDadas}
                        transform="rotate(-90 80 80)"
                    />
                </>
            )}
            <text x="80" y="75" text-anchor="middle" class="numeroCentralDonutRelatorioCamisetas">{total}</text>
            <text x="80" y="95" text-anchor="middle" class="rotuloCentralDonutRelatorioCamisetas">no total</text>
        </svg>
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

    const { totalGeral, totalDadas, totalAvulsas, porModeloTamanho } = dados;
    const porcentagem = (valor) => (totalGeral > 0 ? Math.round((valor / totalGeral) * 100) : 0);
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
                    <span class="rotuloEstatisticaAdmin">Dadas (inclusas no ingresso)</span>
                </div>
                <div class="cartaoEstatisticaAdmin cartaoAvulsasRelatorioCamisetas">
                    <span class="numeroEstatisticaAdmin">{totalAvulsas}</span>
                    <span class="rotuloEstatisticaAdmin">Avulsas (compra à parte)</span>
                </div>
            </div>

            <div class="conteinerTabelaAdmin blocoGraficoRelatorioCamisetas">
                <DonutCamisetas totalDadas={totalDadas} totalAvulsas={totalAvulsas} />
                <ul class="legendaDonutRelatorioCamisetas">
                    <li class="itemLegendaRelatorioCamisetas">
                        <span class="marcadorLegendaRelatorioCamisetas marcadorDadasRelatorioCamisetas" />
                        Dadas — <strong>{totalDadas}</strong> ({porcentagem(totalDadas)}%)
                    </li>
                    <li class="itemLegendaRelatorioCamisetas">
                        <span class="marcadorLegendaRelatorioCamisetas marcadorAvulsasRelatorioCamisetas" />
                        Avulsas — <strong>{totalAvulsas}</strong> ({porcentagem(totalAvulsas)}%)
                    </li>
                </ul>
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

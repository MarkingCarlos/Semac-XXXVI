// Relatório só das camisetas da comissão: total e quantidade por tamanho,
// separada por modelo, para fechar o pedido da camiseta exclusiva com o
// fornecedor. Entram só as inclusas no kit de quem tem role de comissão —
// avulsas são do modelo de participante e ficam de fora, mesmo quando
// compradas pela comissão. O filtro é feito no backend
// (RelatorioService.relatorioCamisetasComissao).
//
// Dados vêm de GET /api/relatorio/camisetas-comissao.

import { useEffect, useState } from 'preact/hooks';
import { buscarRelatorioCamisetasComissao } from '../data/apiRelatorios.js';
import './relatorioCamisetasComissao.css';

const ORDEM_TAMANHO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

// Converte a lista modelo+tamanho do backend em uma linha por tamanho com
// as colunas Normal / Baby Look / Total. Tamanhos sem pedido não aparecem.
function montarLinhasPorTamanho(itens) {
    const linhasPorTamanho = {};
    for (const item of itens) {
        const linha = linhasPorTamanho[item.tamanho] ??= { tamanho: item.tamanho, normal: 0, babyLook: 0, total: 0 };
        if (item.modelo === 'BABY_LOOK') linha.babyLook += item.total;
        else linha.normal += item.total;
        linha.total += item.total;
    }
    return Object.values(linhasPorTamanho)
        .sort((a, b) => ORDEM_TAMANHO.indexOf(a.tamanho) - ORDEM_TAMANHO.indexOf(b.tamanho));
}

export default function RelatorioCamisetasComissao() {
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let ativo = true;
        buscarRelatorioCamisetasComissao()
            .then((d) => { if (ativo) setDados(d); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    if (carregando) return <p class="estadoCarregandoParticipantesAdmin">Carregando relatório...</p>;
    if (erro) return <p class="avisoErroAdmin">{erro}</p>;
    if (!dados) return null;

    const linhasTamanho = montarLinhasPorTamanho(dados.porModeloTamanho ?? []);
    const totalNormal = linhasTamanho.reduce((soma, linha) => soma + linha.normal, 0);
    const totalBabyLook = linhasTamanho.reduce((soma, linha) => soma + linha.babyLook, 0);

    return (
        <div class="conteudoRelatorioCamisetasComissao">
            <div class="gradeCartoesRelatorioCamisetasComissao">
                <div class="cartaoEstatisticaAdmin cartaoTotalRelatorioCamisetasComissao">
                    <span class="numeroEstatisticaAdmin">{dados.totalComissao}</span>
                    <span class="rotuloEstatisticaAdmin">Camisetas da comissão</span>
                    <span class="descricaoCartaoRelatorioCamisetasComissao">
                        Só as inclusas no kit da comissão — avulsas não entram
                    </span>
                </div>
                <div class="cartaoEstatisticaAdmin cartaoNormalRelatorioCamisetasComissao">
                    <span class="numeroEstatisticaAdmin">{totalNormal}</span>
                    <span class="rotuloEstatisticaAdmin">Normal</span>
                </div>
                <div class="cartaoEstatisticaAdmin cartaoBabyLookRelatorioCamisetasComissao">
                    <span class="numeroEstatisticaAdmin">{totalBabyLook}</span>
                    <span class="rotuloEstatisticaAdmin">Baby Look</span>
                </div>
            </div>

            <div class="conteinerTabelaAdmin">
                <div class="topoTabelaAdmin">
                    <h2 class="tituloTabelaAdmin">Quantidade por tamanho</h2>
                </div>
                <div class="scrollTabelaAdmin">
                    <table class="tabelaAdmin">
                        <thead>
                            <tr>
                                <th>Tamanho</th>
                                <th>Normal</th>
                                <th>Baby Look</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhasTamanho.length === 0 ? (
                                <tr>
                                    <td colSpan={4} class="tabelaVaziaAdmin">Nenhuma camiseta da comissão pedida ainda.</td>
                                </tr>
                            ) : linhasTamanho.map((linha) => (
                                <tr key={linha.tamanho}>
                                    <td>{linha.tamanho}</td>
                                    <td class="celulaNumeroAdmin">{linha.normal}</td>
                                    <td class="celulaNumeroAdmin">{linha.babyLook}</td>
                                    <td class="celulaNumeroAdmin">{linha.total}</td>
                                </tr>
                            ))}
                        </tbody>
                        {linhasTamanho.length > 0 && (
                            <tfoot>
                                <tr class="linhaTotalRelatorioCamisetasComissao">
                                    <td>Total</td>
                                    <td class="celulaNumeroAdmin">{totalNormal}</td>
                                    <td class="celulaNumeroAdmin">{totalBabyLook}</td>
                                    <td class="celulaNumeroAdmin">{dados.totalComissao}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}

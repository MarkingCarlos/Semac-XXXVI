// Base compartilhada dos relatórios de camisetas por tamanho (comissão e
// participantes): busca os dados, mostra os cartões Total / Normal / Baby
// Look e a tabela por tamanho com colunas por modelo. Quem usa define só o
// texto, a cor do total e a função da API — o filtro de quais camisetas
// entram é feito no backend (RelatorioService).
//
// A função `buscarDados` deve devolver `{ porModeloTamanho: [{ modelo,
// tamanho, total }] }`; o total geral é somado aqui a partir dessa lista.

import { useEffect, useState } from 'preact/hooks';
import './relatorioCamisetasPorTamanho.css';

const ORDEM_TAMANHO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

const CLASSE_CARTAO_TOTAL_POR_PERFIL = {
    comissao: 'cartaoTotalComissaoRelatorioCamisetasPorTamanho',
    participantes: 'cartaoTotalParticipantesRelatorioCamisetasPorTamanho',
};

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

export default function RelatorioCamisetasPorTamanho({ buscarDados, perfil, rotuloTotal, descricaoTotal, mensagemVazia }) {
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let ativo = true;
        buscarDados()
            .then((d) => { if (ativo) setDados(d); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, [buscarDados]);

    if (carregando) return <p class="estadoCarregandoParticipantesAdmin">Carregando relatório...</p>;
    if (erro) return <p class="avisoErroAdmin">{erro}</p>;
    if (!dados) return null;

    const linhasTamanho = montarLinhasPorTamanho(dados.porModeloTamanho ?? []);
    const totalNormal = linhasTamanho.reduce((soma, linha) => soma + linha.normal, 0);
    const totalBabyLook = linhasTamanho.reduce((soma, linha) => soma + linha.babyLook, 0);
    const totalGeral = totalNormal + totalBabyLook;

    return (
        <div class="conteudoRelatorioCamisetasPorTamanho">
            <div class="gradeCartoesRelatorioCamisetasPorTamanho">
                <div class={`cartaoEstatisticaAdmin ${CLASSE_CARTAO_TOTAL_POR_PERFIL[perfil] ?? ''}`}>
                    <span class="numeroEstatisticaAdmin">{totalGeral}</span>
                    <span class="rotuloEstatisticaAdmin">{rotuloTotal}</span>
                    <span class="descricaoCartaoRelatorioCamisetasPorTamanho">{descricaoTotal}</span>
                </div>
                <div class="cartaoEstatisticaAdmin cartaoNormalRelatorioCamisetasPorTamanho">
                    <span class="numeroEstatisticaAdmin">{totalNormal}</span>
                    <span class="rotuloEstatisticaAdmin">Normal</span>
                </div>
                <div class="cartaoEstatisticaAdmin cartaoBabyLookRelatorioCamisetasPorTamanho">
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
                                    <td colSpan={4} class="tabelaVaziaAdmin">{mensagemVazia}</td>
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
                                <tr class="linhaTotalRelatorioCamisetasPorTamanho">
                                    <td>Total</td>
                                    <td class="celulaNumeroAdmin">{totalNormal}</td>
                                    <td class="celulaNumeroAdmin">{totalBabyLook}</td>
                                    <td class="celulaNumeroAdmin">{totalGeral}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}

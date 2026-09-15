import { useState } from 'preact/hooks';
import { formatarCentavos, normalizar } from '../utils/moeda.js';
import './inscricoes.css';

/* Inscrições — somente leitura. Cada linha é uma pessoa cujo dinheiro já
   entrou: confirmada pelo organizador ou ainda pendente, mas com
   comprovante Pix anexado ou cartão aprovado (o filtro é do backend, em
   PessoaService.listarInscricoes).

   Três colunas de dinheiro porque o cartão não entrega o que cobra: a
   maquininha retém 5%, e é o líquido — não o bruto — que a comissão tem
   para gastar. Os dados são carregados em Financas.jsx. */
export default function Inscricoes({ inscricoes, carregando, erro }) {
    const [filtro, setFiltro] = useState('');

    const totalLiquidoInscricoes = inscricoes.reduce((soma, inscricao) => soma + inscricao.valorLiquido, 0);
    const totalBrutoInscricoes = inscricoes.reduce((soma, inscricao) => soma + inscricao.valorBruto, 0);
    const totalTaxaCartaoInscricoes = inscricoes.reduce((soma, inscricao) => soma + inscricao.taxaCartao, 0);
    const quantidadeConfirmadasInscricoes = inscricoes.filter((inscricao) => inscricao.confirmada).length;
    const quantidadePendentesInscricoes = inscricoes.length - quantidadeConfirmadasInscricoes;

    const inscricoesFiltradas = filtro.trim()
        ? inscricoes.filter((inscricao) => normalizar(inscricao.nomePessoa).includes(normalizar(filtro)))
        : inscricoes;

    // Sem forma registrada é a confirmação manual do /admin (dinheiro,
    // cortesia): não passou por Pix nem por maquininha.
    const rotuloFormaPagamento = (forma) => {
        if (forma === 'CARTAO') return 'Cartão';
        if (forma === 'PIX') return 'Pix';
        return 'Não registrada';
    };

    return (
        <div className="conteudoInscricoesFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Inscrições</h1>
                    <p className="subtituloSecaoFinancas">
                        Inscrições pagas — confirmadas e aguardando confirmação, já
                        descontada a taxa do cartão
                    </p>
                </div>
                <div className="filtroTabelaFinancas">
                    <span className="iconeFiltroFinancas">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </span>
                    <input
                        className="entradaFiltroFinancas"
                        type="search"
                        placeholder="Filtrar por participante…"
                        value={filtro}
                        onInput={(e) => setFiltro(e.currentTarget.value)}
                        aria-label="Filtrar inscrições por participante"
                    />
                </div>
            </header>

            {erro && <p className="avisoErroInscricoes" role="alert">{erro}</p>}

            {/* ── Faixa de totais ─────────────────────────── */}
            <div className="faixaResumoInscricoes">
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Entrou no caixa</span>
                    <strong className="valorItemResumoInscricoes valorDestaqueInscricoes">
                        {formatarCentavos(totalLiquidoInscricoes)}
                    </strong>
                </div>
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Valor bruto</span>
                    <strong className="valorItemResumoInscricoes">
                        {formatarCentavos(totalBrutoInscricoes)}
                    </strong>
                </div>
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Taxa do cartão</span>
                    <strong className="valorItemResumoInscricoes valorTaxaCartaoInscricoes">
                        − {formatarCentavos(totalTaxaCartaoInscricoes)}
                    </strong>
                </div>
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Confirmadas</span>
                    <strong className="valorItemResumoInscricoes">{quantidadeConfirmadasInscricoes}</strong>
                </div>
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Aguardando</span>
                    <strong className="valorItemResumoInscricoes">{quantidadePendentesInscricoes}</strong>
                </div>
            </div>

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Participante</th>
                            <th>Tipo de inscrição</th>
                            <th>Situação</th>
                            <th>Pagamento</th>
                            <th>Bruto</th>
                            <th>Taxa</th>
                            <th>Líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={7} className="celulaVaziaFinancas">
                                    Carregando inscrições…
                                </td>
                            </tr>
                        )}
                        {!carregando && inscricoesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan={7} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum participante encontrado para esse filtro.'
                                        : 'Nenhuma inscrição paga ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && inscricoesFiltradas.map((inscricao) => (
                            <tr key={inscricao.id}>
                                <td>
                                    <span className="nomeParticipanteInscricoes">
                                        {inscricao.nomePessoa}
                                    </span>
                                </td>
                                <td>
                                    <span className="seloTipoInscricoes">
                                        {inscricao.tipoInscricao}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={
                                            inscricao.confirmada
                                                ? 'seloSituacaoInscricoes'
                                                : 'seloSituacaoInscricoes seloSituacaoPendenteInscricoes'
                                        }
                                    >
                                        {inscricao.confirmada ? 'Confirmada' : 'Aguardando'}
                                    </span>
                                </td>
                                <td className="celulaFormaPagamentoInscricoes">
                                    {rotuloFormaPagamento(inscricao.formaPagamento)}
                                </td>
                                <td className="celulaValorFinancas">
                                    {formatarCentavos(inscricao.valorBruto)}
                                </td>
                                <td className="celulaValorFinancas celulaTaxaCartaoInscricoes">
                                    {inscricao.taxaCartao > 0
                                        ? `− ${formatarCentavos(inscricao.taxaCartao)}`
                                        : '—'}
                                </td>
                                <td className="celulaValorFinancas celulaValorEntradaInscricoes">
                                    {formatarCentavos(inscricao.valorLiquido)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

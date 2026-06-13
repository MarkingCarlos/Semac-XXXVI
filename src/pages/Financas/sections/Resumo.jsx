import { formatarCentavos } from '../utils/moeda.js';
import { CAIXA_ANTERIOR } from '../data/mockFinancas.js';
import './resumo.css';

/* Resumo do saldo — extrato em forma de livro-razão.
   Saldo operacional = patrocínios recebidos + inscrições − compras.
   Caixa anterior (FundoUnesp) é exibido em card separado — não entra no saldo.
   Patrocínios A_RECEBER aparecem à parte e não entram no saldo. */
export default function Resumo({ patrocinadores, compras, inscricoes }) {
    const totalPatrociniosRecebidos = patrocinadores
        .filter((patrocinador) => patrocinador.statusPagamento === 'RECEBIDO')
        .reduce((soma, patrocinador) => soma + patrocinador.valorFinal, 0);

    const totalPatrociniosAReceber = patrocinadores
        .filter((patrocinador) => patrocinador.statusPagamento === 'A_RECEBER')
        .reduce((soma, patrocinador) => soma + patrocinador.valorFinal, 0);

    const totalInscricoes = inscricoes.reduce((soma, inscricao) => soma + inscricao.valor, 0);
    const totalCompras = compras.reduce((soma, compra) => soma + compra.valorTotal, 0);

    const saldoAtual = totalPatrociniosRecebidos + totalInscricoes - totalCompras;

    const lancamentos = [
        { rotulo: 'Patrocínios recebidos', valor: totalPatrociniosRecebidos, tipo: 'entrada' },
        { rotulo: 'Inscrições', valor: totalInscricoes, tipo: 'entrada' },
        { rotulo: 'Compras', valor: totalCompras, tipo: 'saida' },
    ];

    return (
        <div className="conteudoResumoFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Resumo</h1>
                    <p className="subtituloSecaoFinancas">Extrato consolidado da SEMAC XXXVI</p>
                </div>
            </header>

            <div className="gradeResumoFinancas">
                {/* ── Extrato ─────────────────────────────── */}
                <section className="blocoExtratoResumo" aria-label="Extrato de lançamentos">
                    <h2 className="rotuloBlocoResumo">Extrato</h2>
                    <ul className="listaLancamentosResumo">
                        {lancamentos.map((lancamento) => (
                            <li key={lancamento.rotulo} className="linhaLancamentoResumo">
                                <div className="textoLancamentoResumo">
                                    <span className="rotuloLancamentoResumo">{lancamento.rotulo}</span>
                                    {lancamento.nota && (
                                        <span className="notaLancamentoResumo">{lancamento.nota}</span>
                                    )}
                                </div>
                                <span
                                    className={
                                        lancamento.tipo === 'entrada'
                                            ? 'valorLancamentoResumo valorEntradaResumo'
                                            : 'valorLancamentoResumo valorSaidaResumo'
                                    }
                                >
                                    {lancamento.tipo === 'entrada' ? '+' : '−'}{' '}
                                    {formatarCentavos(lancamento.valor)}
                                </span>
                            </li>
                        ))}
                        <li className="linhaLancamentoResumo linhaSaldoResumo">
                            <span className="rotuloLancamentoResumo">Saldo em caixa</span>
                            <span className="valorLancamentoResumo valorSaldoLinhaResumo">
                                {formatarCentavos(saldoAtual)}
                            </span>
                        </li>
                    </ul>
                </section>

                {/* ── Saldo + FundoUnesp + a receber ─────── */}
                <div className="colunaSaldoResumo">
                    <section className="blocoSaldoResumo" aria-label="Saldo em caixa">
                        <span className="rotuloBlocoResumo">Saldo em caixa</span>
                        <strong className="valorSaldoResumo">{formatarCentavos(saldoAtual)}</strong>
                        <span className="notaSaldoResumo">
                            Patrocínios e inscrições recebidos menos compras registradas
                        </span>
                    </section>

                    <section className="blocoCaixaAnteriorResumo" aria-label="Caixa anterior FundoUnesp">
                        <span className="rotuloBlocoResumo">Caixa anterior</span>
                        <strong className="valorCaixaAnteriorResumo">
                            {formatarCentavos(CAIXA_ANTERIOR.valor)}
                        </strong>
                        <span className="notaSaldoResumo">{CAIXA_ANTERIOR.observacao}</span>
                    </section>

                    <section className="blocoAReceberResumo" aria-label="Valores a receber">
                        <span className="rotuloBlocoResumo">A receber</span>
                        <strong className="valorAReceberResumo">
                            {formatarCentavos(totalPatrociniosAReceber)}
                        </strong>
                        <span className="notaSaldoResumo">
                            Patrocínios com contrato assinado aguardando pagamento
                        </span>
                    </section>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'preact/hooks';
import { Link } from 'wouter';
import { formatarCentavos, formatarData } from '../utils/moeda.js';
import { atualizarCaixaFundunesp } from '../data/apiCaixaFundunesp.js';
import CampoMoeda from '../components/CampoMoeda.jsx';
import './resumo.css';

/* Resumo do saldo — extrato em forma de livro-razão.
   Saldo operacional = patrocínios recebidos + inscrições + doações − compras.
   Caixa anterior (FundoUnesp) vem da tabela `caixa_fundunesp` e é exibido em
   card separado, editável no próprio card — não entra no saldo.
   Patrocínios A_RECEBER aparecem à parte e não entram no saldo.
   Doações são cadastradas no /admin e contabilizadas aqui no caixa. */
export default function Resumo({
    patrocinadores,
    compras,
    inscricoes,
    doadores = [],
    caixaFundunesp,
    setCaixaFundunesp,
    erroCaixaFundunesp = '',
}) {
    const totalPatrociniosRecebidos = patrocinadores
        .filter((patrocinador) => patrocinador.statusPagamento === 'RECEBIDO')
        .reduce((soma, patrocinador) => soma + patrocinador.valorFinal, 0);

    const totalPatrociniosAReceber = patrocinadores
        .filter((patrocinador) => patrocinador.statusPagamento === 'A_RECEBER')
        .reduce((soma, patrocinador) => soma + patrocinador.valorFinal, 0);

    const totalInscricoes = inscricoes.reduce((soma, inscricao) => soma + inscricao.valor, 0);
    const totalDoacoes = doadores.reduce((soma, doador) => soma + doador.valor, 0);
    const totalCompras = compras.reduce((soma, compra) => soma + compra.valorTotal, 0);

    const saldoAtual = totalPatrociniosRecebidos + totalInscricoes + totalDoacoes - totalCompras;

    const lancamentos = [
        { rotulo: 'Patrocínios recebidos', valor: totalPatrociniosRecebidos, tipo: 'entrada' },
        { rotulo: 'Inscrições', valor: totalInscricoes, tipo: 'entrada' },
        { rotulo: 'Doações', valor: totalDoacoes, tipo: 'entrada' },
        { rotulo: 'Compras', valor: totalCompras, tipo: 'saida' },
    ];

    /* ── Edição inline do caixa da FundoUnesp ────────────────── */
    const [editandoCaixa, setEditandoCaixa] = useState(false);
    const [valorEditadoCaixa, setValorEditadoCaixa] = useState(0);
    const [salvandoCaixa, setSalvandoCaixa] = useState(false);
    const [erroSalvarCaixa, setErroSalvarCaixa] = useState('');

    function abrirEdicaoCaixa() {
        setValorEditadoCaixa(caixaFundunesp?.valor ?? 0);
        setErroSalvarCaixa('');
        setEditandoCaixa(true);
    }

    // Esc descarta a alteração e volta ao valor que veio do banco.
    function cancelarEdicaoCaixa() {
        setEditandoCaixa(false);
        setErroSalvarCaixa('');
    }

    // Em caso de falha permanece em edição, preservando o que foi digitado.
    async function salvarCaixa() {
        setSalvandoCaixa(true);
        setErroSalvarCaixa('');
        try {
            const atualizado = await atualizarCaixaFundunesp(valorEditadoCaixa);
            setCaixaFundunesp(atualizado);
            setEditandoCaixa(false);
        } catch (e) {
            setErroSalvarCaixa(e.message);
        } finally {
            setSalvandoCaixa(false);
        }
    }

    function aoTeclarCaixa(evento) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            salvarCaixa();
        } else if (evento.key === 'Escape') {
            evento.preventDefault();
            cancelarEdicaoCaixa();
        }
    }

    /* Sem registro carregado (falha ou ainda carregando) não se afirma nada
       sobre a data — só depois de ter o dado em mãos. */
    const notaCaixaFundunesp = !caixaFundunesp
        ? 'Saldo FundoUnesp'
        : caixaFundunesp.dataAtualizacao
          ? `Saldo FundoUnesp — atualizado em ${formatarData(caixaFundunesp.dataAtualizacao)}`
          : 'Saldo FundoUnesp — nunca atualizado';

    return (
        <div className="conteudoResumoFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Resumo</h1>
                    <p className="subtituloSecaoFinancas">Extrato consolidado da SEMAC XXXVI</p>
                </div>
                <Link href="/admin" className="cartaoMudarVisaoResumo">
                    <span className="tituloCartaoMudarVisaoResumo">Mudar para visão administrativa</span>
                    <span className="subtituloCartaoMudarVisaoResumo">Acessar o painel administrativo geral da SEMAC</span>
                </Link>
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
                            Patrocínios, inscrições e doações recebidos menos compras registradas
                        </span>
                    </section>

                    <section className="blocoCaixaAnteriorResumo" aria-label="Caixa anterior FundoUnesp">
                        <span className="rotuloBlocoResumo">Caixa anterior</span>

                        <div className="linhaValorCaixaAnteriorResumo">
                            {editandoCaixa ? (
                                <CampoMoeda
                                    valorCentavos={valorEditadoCaixa}
                                    aoMudar={setValorEditadoCaixa}
                                    desabilitado={salvandoCaixa}
                                    classeExtra="entradaCaixaAnteriorResumo"
                                    aoTeclar={aoTeclarCaixa}
                                    rotuloAcessivel="Valor do caixa da FundoUnesp"
                                    autoFoco
                                />
                            ) : (
                                <strong className="valorCaixaAnteriorResumo">
                                    {caixaFundunesp ? formatarCentavos(caixaFundunesp.valor) : '—'}
                                </strong>
                            )}

                            <button
                                type="button"
                                className={
                                    editandoCaixa
                                        ? 'botaoAcaoLinhaFinancas botaoEditarCaixaAnteriorResumo botaoSalvarCaixaAnteriorResumo'
                                        : 'botaoAcaoLinhaFinancas botaoEditarCaixaAnteriorResumo'
                                }
                                aria-label={
                                    editandoCaixa
                                        ? 'Salvar caixa da FundoUnesp'
                                        : 'Editar caixa da FundoUnesp'
                                }
                                title={editandoCaixa ? 'Salvar' : 'Editar'}
                                disabled={!caixaFundunesp || salvandoCaixa}
                                onClick={editandoCaixa ? salvarCaixa : abrirEdicaoCaixa}
                            >
                                {editandoCaixa ? (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <span className="notaSaldoResumo">{notaCaixaFundunesp}</span>

                        {(erroCaixaFundunesp || erroSalvarCaixa) && (
                            <p className="avisoErroCaixaAnteriorResumo" role="alert">
                                {erroSalvarCaixa || erroCaixaFundunesp}
                            </p>
                        )}
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

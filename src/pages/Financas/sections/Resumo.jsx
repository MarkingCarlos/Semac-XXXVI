import { useState } from 'preact/hooks';
import { Link } from 'wouter';
import { formatarCentavos, formatarData } from '../utils/moeda.js';
import { atualizarCaixa, CONTAS, ROTULO_CONTA } from '../data/apiCaixa.js';
import CampoMoeda from '../components/CampoMoeda.jsx';
import './resumo.css';

/* Resumo do saldo — extrato em forma de livro-razão.
   Saldo operacional = patrocínios recebidos + inscrições + doações − compras.
   Saldo por conta vem do backend (/api/previsao/resumo), que cruza caixa
   inicial, entradas e saídas da MESMA conta. Só o caixa inicial é editado
   aqui — o resto é derivado e não se digita.
   Patrocínios A_RECEBER aparecem à parte e não entram no saldo.
   Doações são cadastradas no /admin e contabilizadas aqui no caixa. */
export default function Resumo({
    patrocinadores,
    compras,
    inscricoes,
    doadores = [],
    caixas = [],
    setCaixas,
    contasResumo = [],
    recarregarContas,
    erroCaixas = '',
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

    /* ── Edição inline do caixa, por conta ───────────────────── */
    /* Guarda QUAL conta está em edição (não um booleano): os dois cards
       compartilham os mesmos handlers e só um fica aberto por vez. */
    const [contaEmEdicao, setContaEmEdicao] = useState(null);
    const [valorEditadoCaixa, setValorEditadoCaixa] = useState(0);
    const [salvandoCaixa, setSalvandoCaixa] = useState(false);
    const [erroSalvarCaixa, setErroSalvarCaixa] = useState('');

    const buscarCaixa = (conta) => caixas.find((caixa) => caixa.conta === conta) ?? null;

    function abrirEdicaoCaixa(conta) {
        setValorEditadoCaixa(buscarCaixa(conta)?.valor ?? 0);
        setErroSalvarCaixa('');
        setContaEmEdicao(conta);
    }

    // Esc descarta a alteração e volta ao valor que veio do banco.
    function cancelarEdicaoCaixa() {
        setContaEmEdicao(null);
        setErroSalvarCaixa('');
    }

    // Em caso de falha permanece em edição, preservando o que foi digitado.
    async function salvarCaixa(conta) {
        setSalvandoCaixa(true);
        setErroSalvarCaixa('');
        try {
            const atualizado = await atualizarCaixa(conta, valorEditadoCaixa);
            setCaixas(caixas.some((caixa) => caixa.conta === conta)
                ? caixas.map((caixa) => (caixa.conta === conta ? atualizado : caixa))
                : [...caixas, atualizado]);
            setContaEmEdicao(null);
            // O saldo da conta depende do valor inicial recém-salvo.
            if (recarregarContas) await recarregarContas();
        } catch (e) {
            setErroSalvarCaixa(e.message);
        } finally {
            setSalvandoCaixa(false);
        }
    }

    function aoTeclarCaixa(evento, conta) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            salvarCaixa(conta);
        } else if (evento.key === 'Escape') {
            evento.preventDefault();
            cancelarEdicaoCaixa();
        }
    }

    /* Sem registro carregado (falha ou ainda carregando) não se afirma nada
       sobre a data — só depois de ter o dado em mãos. */
    function notaCaixa(caixa, conta) {
        const rotulo = `Saldo ${ROTULO_CONTA[conta]}`;
        if (!caixa) return rotulo;
        return caixa.dataAtualizacao
            ? `${rotulo} — atualizado em ${formatarData(caixa.dataAtualizacao)}`
            : `${rotulo} — nunca atualizado`;
    }

    const buscarContaResumo = (conta) => contasResumo.find((linha) => linha.conta === conta) ?? null;
    const totalSaldoContas = contasResumo.reduce((soma, linha) => soma + linha.saldo, 0);

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

                    <section className="blocoCaixaAnteriorResumo" aria-label="Saldo por conta">
                        <span className="rotuloBlocoResumo">Saldo por conta</span>
                        <strong className="valorCaixaAnteriorResumo">
                            {contasResumo.length ? formatarCentavos(totalSaldoContas) : '—'}
                        </strong>

                        {/* Uma linha por conta. O saldo é derivado; só o caixa
                            inicial (remanescente de edições anteriores, que não
                            dá para calcular) continua sendo digitado. */}
                        <ul className="listaContasCaixaAnteriorResumo">
                            {CONTAS.map((conta) => {
                                const caixa = buscarCaixa(conta);
                                const linha = buscarContaResumo(conta);
                                const emEdicao = contaEmEdicao === conta;
                                return (
                                    <li key={conta} className="linhaContaCaixaAnteriorResumo">
                                        <div className="topoContaSaldoResumo">
                                            <span className="rotuloContaCaixaAnteriorResumo">
                                                {ROTULO_CONTA[conta]}
                                            </span>
                                            <strong className="valorContaCaixaAnteriorResumo">
                                                {linha ? formatarCentavos(linha.saldo) : '—'}
                                            </strong>
                                        </div>

                                        <ul className="parcelasContaSaldoResumo">
                                            <li className="parcelaContaSaldoResumo">
                                                <span className="rotuloParcelaContaSaldoResumo">Caixa inicial</span>
                                                <span className="valorEdicaoParcelaResumo">
                                                    {emEdicao ? (
                                                        <CampoMoeda
                                                            valorCentavos={valorEditadoCaixa}
                                                            aoMudar={setValorEditadoCaixa}
                                                            desabilitado={salvandoCaixa}
                                                            classeExtra="entradaCaixaAnteriorResumo"
                                                            aoTeclar={(evento) => aoTeclarCaixa(evento, conta)}
                                                            rotuloAcessivel={`Caixa inicial da conta ${ROTULO_CONTA[conta]}`}
                                                            autoFoco
                                                        />
                                                    ) : (
                                                        <span className="valorParcelaContaSaldoResumo">
                                                            {caixa ? formatarCentavos(caixa.valor) : '—'}
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={
                                                            emEdicao
                                                                ? 'botaoAcaoLinhaFinancas botaoEditarCaixaAnteriorResumo botaoSalvarCaixaAnteriorResumo'
                                                                : 'botaoAcaoLinhaFinancas botaoEditarCaixaAnteriorResumo'
                                                        }
                                                        aria-label={
                                                            emEdicao
                                                                ? `Salvar caixa inicial da conta ${ROTULO_CONTA[conta]}`
                                                                : `Editar caixa inicial da conta ${ROTULO_CONTA[conta]}`
                                                        }
                                                        title={emEdicao ? 'Salvar' : 'Editar'}
                                                        disabled={salvandoCaixa}
                                                        onClick={() =>
                                                            emEdicao ? salvarCaixa(conta) : abrirEdicaoCaixa(conta)
                                                        }
                                                    >
                                                        {emEdicao ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </span>
                                            </li>
                                            <li className="parcelaContaSaldoResumo">
                                                <span className="rotuloParcelaContaSaldoResumo">Entradas</span>
                                                <span className="valorParcelaContaSaldoResumo valorEntradaResumo">
                                                    + {formatarCentavos(linha?.entradas ?? 0)}
                                                </span>
                                            </li>
                                            <li className="parcelaContaSaldoResumo">
                                                <span className="rotuloParcelaContaSaldoResumo">Saídas</span>
                                                <span className="valorParcelaContaSaldoResumo valorSaidaResumo">
                                                    − {formatarCentavos(linha?.saidas ?? 0)}
                                                </span>
                                            </li>
                                        </ul>

                                        <span className="notaSaldoResumo">{notaCaixa(caixa, conta)}</span>
                                    </li>
                                );
                            })}
                        </ul>

                        <span className="notaSaldoResumo notaRodapeContasResumo">
                            Entradas da conta: patrocínios recebidos e doações destinadas a ela.
                            As inscrições entram todas na conta da Comissão.
                        </span>

                        {(erroCaixas || erroSalvarCaixa) && (
                            <p className="avisoErroCaixaAnteriorResumo" role="alert">
                                {erroSalvarCaixa || erroCaixas}
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

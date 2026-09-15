import { useState } from 'preact/hooks';
import { Link } from 'wouter';
import { formatarCentavos, formatarData } from '../utils/moeda.js';
import { atualizarCaixa, CONTA_RESERVA } from '../data/apiCaixa.js';
import CampoMoeda from '../components/CampoMoeda.jsx';
import './resumo.css';

/* Resumo do saldo — extrato em forma de livro-razão.
   Saldo operacional = patrocínios recebidos + inscrições + doações − compras.
   O que a comissão tem para gastar vem do backend (/api/previsao/resumo):
   patrocínios recebidos + doações + inscrições. Não se digita.

   Inscrições entram LÍQUIDAS (a maquininha retém 5% do que foi pago no
   cartão) e em duas parcelas: as confirmadas pelo organizador e as que
   ainda aguardam confirmação mas já foram pagas — o dinheiro delas está
   na conta do mesmo jeito. Quem se cadastrou sem pagar não aparece em
   nenhuma das duas (filtro em PessoaService.listarInscricoes).
   A reserva da FUNDUNESP é um valor fixo de emergência, editado aqui e
   fora de qualquer cálculo.
   Patrocínios A_RECEBER aparecem à parte e não entram no saldo.
   Doações são cadastradas no /admin e contabilizadas aqui no caixa. */
export default function Resumo({
    patrocinadores,
    compras,
    inscricoes,
    doadores = [],
    caixas = [],
    setCaixas,
    entradasResumo = null,
    reservaFundunesp = 0,
    recarregarContas,
    erroCaixas = '',
}) {
    const totalPatrociniosRecebidos = patrocinadores
        .filter((patrocinador) => patrocinador.statusPagamento === 'RECEBIDO')
        .reduce((soma, patrocinador) => soma + patrocinador.valorFinal, 0);

    const totalPatrociniosAReceber = patrocinadores
        .filter((patrocinador) => patrocinador.statusPagamento === 'A_RECEBER')
        .reduce((soma, patrocinador) => soma + patrocinador.valorFinal, 0);

    const inscricoesConfirmadas = inscricoes.filter((inscricao) => inscricao.confirmada);
    const inscricoesAguardando = inscricoes.filter((inscricao) => !inscricao.confirmada);

    const somarLiquidoInscricoes = (lista) =>
        lista.reduce((soma, inscricao) => soma + inscricao.valorLiquido, 0);

    const totalInscricoesConfirmadas = somarLiquidoInscricoes(inscricoesConfirmadas);
    const totalInscricoesAguardando = somarLiquidoInscricoes(inscricoesAguardando);
    const totalInscricoes = totalInscricoesConfirmadas + totalInscricoesAguardando;
    const totalTaxaCartaoInscricoes = inscricoes.reduce((soma, inscricao) => soma + inscricao.taxaCartao, 0);

    const totalDoacoes = doadores.reduce((soma, doador) => soma + doador.valor, 0);
    const totalCompras = compras.reduce((soma, compra) => soma + compra.valorTotal, 0);

    const saldoAtual = totalPatrociniosRecebidos + totalInscricoes + totalDoacoes - totalCompras;

    /* As inscrições vêm em duas linhas de propósito: juntas escondiam
       quanto do saldo ainda depende de o organizador conferir comprovante. */
    const lancamentos = [
        { rotulo: 'Patrocínios recebidos', valor: totalPatrociniosRecebidos, tipo: 'entrada' },
        {
            rotulo: 'Inscrições confirmadas',
            valor: totalInscricoesConfirmadas,
            tipo: 'entrada',
            nota: `${inscricoesConfirmadas.length} inscrição(ões), já descontada a taxa do cartão`,
        },
        {
            rotulo: 'Inscrições aguardando confirmação',
            valor: totalInscricoesAguardando,
            tipo: 'entrada',
            nota: `${inscricoesAguardando.length} pagamento(s) recebido(s), pendente(s) de confirmação no /admin`,
        },
        { rotulo: 'Doações', valor: totalDoacoes, tipo: 'entrada' },
        { rotulo: 'Compras', valor: totalCompras, tipo: 'saida' },
    ];

    /* ── Edição inline da reserva da FUNDUNESP ──────────────── */
    /* É o único valor digitado que restou no card: não há de onde
       derivá-lo. O resto vem calculado do backend. */
    const [editandoReserva, setEditandoReserva] = useState(false);
    const [valorEditadoCaixa, setValorEditadoCaixa] = useState(0);
    const [salvandoCaixa, setSalvandoCaixa] = useState(false);
    const [erroSalvarCaixa, setErroSalvarCaixa] = useState('');

    const caixaReserva = caixas.find((caixa) => caixa.conta === CONTA_RESERVA) ?? null;

    function abrirEdicaoReserva() {
        setValorEditadoCaixa(caixaReserva?.valor ?? reservaFundunesp ?? 0);
        setErroSalvarCaixa('');
        setEditandoReserva(true);
    }

    // Esc descarta a alteração e volta ao valor que veio do banco.
    function cancelarEdicaoReserva() {
        setEditandoReserva(false);
        setErroSalvarCaixa('');
    }

    // Em caso de falha permanece em edição, preservando o que foi digitado.
    async function salvarReserva() {
        setSalvandoCaixa(true);
        setErroSalvarCaixa('');
        try {
            const atualizado = await atualizarCaixa(CONTA_RESERVA, valorEditadoCaixa);
            setCaixas(caixas.some((caixa) => caixa.conta === CONTA_RESERVA)
                ? caixas.map((caixa) => (caixa.conta === CONTA_RESERVA ? atualizado : caixa))
                : [...caixas, atualizado]);
            setEditandoReserva(false);
            if (recarregarContas) await recarregarContas();
        } catch (e) {
            setErroSalvarCaixa(e.message);
        } finally {
            setSalvandoCaixa(false);
        }
    }

    function aoTeclarReserva(evento) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            salvarReserva();
        } else if (evento.key === 'Escape') {
            evento.preventDefault();
            cancelarEdicaoReserva();
        }
    }

    /* Sem registro carregado (falha ou ainda carregando) não se afirma nada
       sobre a data — só depois de ter o dado em mãos. */
    const notaReserva = !caixaReserva
        ? 'Reserva de emergência'
        : caixaReserva.dataAtualizacao
          ? `Reserva de emergência — atualizada em ${formatarData(caixaReserva.dataAtualizacao)}`
          : 'Reserva de emergência — nunca atualizada';

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
                        {totalTaxaCartaoInscricoes > 0 && (
                            <span className="notaSaldoResumo notaTaxaCartaoResumo">
                                Já fora {formatarCentavos(totalTaxaCartaoInscricoes)} retidos pela
                                maquininha nas inscrições pagas no cartão
                            </span>
                        )}
                    </section>

                    <section className="blocoCaixaAnteriorResumo" aria-label="Arrecadação da Comissão">
                        <span className="rotuloBlocoResumo">A Comissão tem</span>
                        <strong className="valorCaixaAnteriorResumo">
                            {entradasResumo ? formatarCentavos(entradasResumo.total) : '—'}
                        </strong>

                        {/* As três fontes abertas: é daqui que sai o teto da
                            aba de Previsão, então mostrar a composição evita
                            a pergunta "de onde veio esse número?". */}
                        <ul className="parcelasContaSaldoResumo">
                            <li className="parcelaContaSaldoResumo">
                                <span className="rotuloParcelaContaSaldoResumo">Patrocínios recebidos</span>
                                <span className="valorParcelaContaSaldoResumo">
                                    {formatarCentavos(entradasResumo?.patrocinios ?? 0)}
                                </span>
                            </li>
                            <li className="parcelaContaSaldoResumo">
                                <span className="rotuloParcelaContaSaldoResumo">Doações</span>
                                <span className="valorParcelaContaSaldoResumo">
                                    {formatarCentavos(entradasResumo?.doacoes ?? 0)}
                                </span>
                            </li>
                            <li className="parcelaContaSaldoResumo">
                                <span className="rotuloParcelaContaSaldoResumo">Inscrições confirmadas</span>
                                <span className="valorParcelaContaSaldoResumo">
                                    {formatarCentavos(entradasResumo?.inscricoesConfirmadas ?? 0)}
                                </span>
                            </li>
                            <li className="parcelaContaSaldoResumo">
                                <span className="rotuloParcelaContaSaldoResumo">Inscrições aguardando confirmação</span>
                                <span className="valorParcelaContaSaldoResumo">
                                    {formatarCentavos(entradasResumo?.inscricoesPendentes ?? 0)}
                                </span>
                            </li>
                        </ul>
                        
                    </section>

                    <section className="blocoCaixaAnteriorResumo" aria-label="Reserva da FUNDUNESP">
                        <span className="rotuloBlocoResumo">Reserva FUNDUNESP</span>

                        <div className="linhaValorCaixaAnteriorResumo">
                            {editandoReserva ? (
                                <CampoMoeda
                                    valorCentavos={valorEditadoCaixa}
                                    aoMudar={setValorEditadoCaixa}
                                    desabilitado={salvandoCaixa}
                                    classeExtra="entradaCaixaAnteriorResumo"
                                    aoTeclar={aoTeclarReserva}
                                    rotuloAcessivel="Valor da reserva da FUNDUNESP"
                                    autoFoco
                                />
                            ) : (
                                <strong className="valorCaixaAnteriorResumo">
                                    {caixaReserva ? formatarCentavos(caixaReserva.valor) : '—'}
                                </strong>
                            )}

                            <button
                                type="button"
                                className={
                                    editandoReserva
                                        ? 'botaoAcaoLinhaFinancas botaoEditarCaixaAnteriorResumo botaoSalvarCaixaAnteriorResumo'
                                        : 'botaoAcaoLinhaFinancas botaoEditarCaixaAnteriorResumo'
                                }
                                aria-label={
                                    editandoReserva
                                        ? 'Salvar reserva da FUNDUNESP'
                                        : 'Editar reserva da FUNDUNESP'
                                }
                                title={editandoReserva ? 'Salvar' : 'Editar'}
                                disabled={salvandoCaixa}
                                onClick={editandoReserva ? salvarReserva : abrirEdicaoReserva}
                            >
                                {editandoReserva ? (
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

                        <span className="notaSaldoResumo">{notaReserva}</span>
                        <span className="notaSaldoResumo">
                            Valor fixo, só para emergência — não entra no saldo nem no teto.
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
                        <span className="notaSaldoResumo">
                            Entra no teto da previsão de gastos, não no saldo — dá lastro
                            para planejar, mas ainda não é dinheiro sacável.
                        </span>
                    </section>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useMemo, useState } from 'preact/hooks';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import PainelLateral from '../components/PainelLateral.jsx';
import CampoMoeda from '../components/CampoMoeda.jsx';
import { formatarCentavos, normalizar } from '../utils/moeda.js';
import {
    listarCategoriasPrevisao, criarCategoriaPrevisao,
    atualizarCategoriaPrevisao, excluirCategoriaPrevisao,
} from '../data/apiPrevisaoCategorias.js';
import { lerOrcamento } from '../data/apiOrcamento.js';
import {
    listarPrevisoes, lerResumoPrevisao, criarPrevisao, atualizarPrevisao,
    excluirPrevisao as excluirPrevisaoApi, converterPrevisaoEmCompra,
} from '../data/apiPrevisao.js';
import { criarFornecedor } from '../data/apiFornecedores.js';
import './previsao.css';

/* ── Paleta dos gráficos ─────────────────────────────────────────
   Validada contra a superfície do módulo (#730835) com o validador da
   skill de dataviz: banda de luminosidade, piso de croma, separação sob
   daltonismo e contraste. A ORDEM importa — as checagens são feitas em
   pares adjacentes, e foi nesta ordem que os conjuntos passaram.

   Nenhum gráfico aqui codifica CATEGORIA por cor: com 10 categorias não
   existe paleta categórica que passe nesta superfície. As categorias são
   sempre rótulos diretos (linhas do gráfico de barras, coluna da tabela),
   e a cor da categoria serve só de reforço no selo, ao lado do próprio
   texto. */
const COR_PREVISTO = '#cb7f00';
const COR_REALIZADO = '#0097ce';
const CORES_STATUS = {
    PREVISTO: '#0097ce',
    COTADO: '#cb7f00',
    CONTRATADO: '#a366cd',
    PAGO: '#20a04e',
};

const STATUS = ['PREVISTO', 'COTADO', 'CONTRATADO', 'PAGO'];
const ROTULO_STATUS = {
    PREVISTO: 'Previsto',
    COTADO: 'Cotado',
    CONTRATADO: 'Contratado',
    PAGO: 'Pago',
};

const ESCALAS = ['FIXA', 'POR_INSCRITO', 'POR_COMISSAO', 'POR_PALESTRANTE'];
const ROTULO_ESCALA = {
    FIXA: 'Valor fechado',
    POR_INSCRITO: 'Por inscrito',
    POR_COMISSAO: 'Por membro da comissão',
    POR_PALESTRANTE: 'Por palestrante',
};

const FORMULARIO_VAZIO = {
    descricao: '',
    categoriaId: '',
    fornecedorId: '',
    quantidade: 1,
    valorUnitario: 0,
    frete: 0,
    escala: 'FIXA',
    status: 'PREVISTO',
    dataPrevista: '',
    observacao: '',
};

const NOVO_FORNECEDOR_VAZIO = { nome: '', contato: '', observacao: '' };

/* Cor de partida de uma categoria nova. Fica dentro da banda de
   luminosidade validada para a superfície do módulo — quem trocar pelo
   seletor assume a escolha. */
const CATEGORIA_VAZIA = { nome: '', cor: '#0097ce', teto: 0, ordem: 0 };

/* Eixo de valor: rótulo curto, senão "R$ 19.196,60" empilhado em cada
   tick estoura a largura do gráfico. */
const formatarEixoValor = (centavos) => {
    const reais = (centavos ?? 0) / 100;
    if (Math.abs(reais) >= 1000) return `${Math.round(reais / 1000)} mil`;
    return String(Math.round(reais));
};

/* Cartão escuro compartilhado pelos três gráficos. Os valores usam tokens
   de texto, nunca a cor da série — a bolinha ao lado é que carrega a
   identidade. */
function TooltipPrevisao({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    /* Gráficos cartesianos mandam `label` (a categoria do eixo); a rosca
       não manda nenhum — aí o título é o nome da própria fatia. */
    const titulo = label ?? payload[0]?.name;
    return (
        <div className="tooltipGraficoPrevisao">
            <strong className="tituloTooltipGraficoPrevisao">{titulo}</strong>
            {payload.map((serie) => (
                <span key={serie.name} className="linhaTooltipGraficoPrevisao">
                    <span
                        className="marcadorTooltipGraficoPrevisao"
                        style={{ background: serie.color ?? serie.payload?.cor }}
                        aria-hidden="true"
                    />
                    {serie.name}: {formatarCentavos(serie.value)}
                </span>
            ))}
        </div>
    );
}

/* Previsão de gastos — o elo entre a cotação (preço pesquisado) e a
   compra (dinheiro que já saiu).

   Os totais NÃO são somados aqui: vêm do /api/previsao/resumo, que tem o
   orçamento em mãos para aplicar as escalas. Recalcular no cliente daria
   um segundo lugar para a mesma regra divergir. */
export default function Previsao({ fornecedores, setFornecedores }) {
    const [itens, setItens] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [resumo, setResumo] = useState(null);
    const [orcamento, setOrcamento] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [erroAcao, setErroAcao] = useState('');

    const [filtro, setFiltro] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');

    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [novoFornecedor, setNovoFornecedor] = useState(NOVO_FORNECEDOR_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [salvando, setSalvando] = useState(false);

    /* Detalhe de uma categoria, aberto pelo gráfico. Guarda o NOME e não
       o id: é o que o recharts devolve no clique (activeLabel), e o nome
       é único por categoria no banco. */
    const [nomeCategoriaDetalhe, setNomeCategoriaDetalhe] = useState(null);

    const [painelCategoriasAberto, setPainelCategoriasAberto] = useState(false);
    const [formCategoria, setFormCategoria] = useState(CATEGORIA_VAZIA);
    const [idCategoriaEmEdicao, setIdCategoriaEmEdicao] = useState(null);
    const [salvandoCategoria, setSalvandoCategoria] = useState(false);
    const [idCategoriaConfirmandoExclusao, setIdCategoriaConfirmandoExclusao] = useState(null);

    const [painelOrcamentoAberto, setPainelOrcamentoAberto] = useState(false);

    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [idConfirmandoConversao, setIdConfirmandoConversao] = useState(null);

    const cadastrandoFornecedor = formulario.fornecedorId === 'novo';

    /* Recarrega itens e resumo juntos: mexer num item muda os totais, e
       deixá-los buscar em momentos diferentes mostraria números que não
       se explicam entre si. */
    async function recarregar() {
        const [listaItens, resumoNovo] = await Promise.all([listarPrevisoes(), lerResumoPrevisao()]);
        setItens(listaItens);
        setResumo(resumoNovo);
    }

    useEffect(() => {
        let ativo = true;
        Promise.all([listarPrevisoes(), lerResumoPrevisao(), listarCategoriasPrevisao(), lerOrcamento()])
            .then(([listaItens, resumoNovo, listaCategorias, orcamentoNovo]) => {
                if (!ativo) return;
                setItens(listaItens);
                setResumo(resumoNovo);
                setCategorias(listaCategorias);
                setOrcamento(orcamentoNovo);
            })
            .catch((e) => {
                if (ativo) setErro(e.message);
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => { ativo = false; };
    }, []);

    /* ── Dados dos gráficos ─────────────────────────────────── */

    const dadosCategorias = useMemo(() => {
        if (!resumo) return [];
        return resumo.categorias
            .filter((categoria) => categoria.totalPrevisto > 0 || categoria.totalRealizado > 0)
            .map((categoria) => ({
                nome: categoria.nome,
                cor: categoria.cor,
                Previsto: categoria.totalPrevisto,
                Realizado: categoria.totalRealizado,
            }));
    }, [resumo]);

    /* Distribuição por estágio — só itens em aberto: um item PAGO já virou
       compra e aparece no realizado, não aqui. */
    const dadosStatus = useMemo(() => {
        const soma = {};
        itens.filter((item) => item.status !== 'PAGO').forEach((item) => {
            soma[item.status] = (soma[item.status] ?? 0) + item.valorTotal;
        });
        return STATUS.filter((status) => status !== 'PAGO' && soma[status])
            .map((status) => ({ nome: ROTULO_STATUS[status], valor: soma[status], cor: CORES_STATUS[status] }));
    }, [itens]);

    /* Tudo que o painel mostra sai do que já está em memória: a linha da
       categoria no resumo (previsto/realizado/teto) e os itens filtrados
       por ela. Nenhuma busca nova. */
    const detalheCategoria = useMemo(() => {
        if (!nomeCategoriaDetalhe || !resumo) return null;
        const linha = resumo.categorias.find((c) => c.nome === nomeCategoriaDetalhe);
        if (!linha) return null;
        const itensDaCategoria = itens.filter((item) => item.categoriaId === linha.id);
        const projecao = linha.totalPrevisto + linha.totalRealizado;
        return {
            ...linha,
            itens: itensDaCategoria,
            projecao,
            // Sem teto próprio a margem não existe: a categoria responde
            // só ao saldo da Comissão, e inventar um número aqui seria
            // pior que não mostrar nada.
            margem: linha.teto ? linha.teto - projecao : null,
            percentual: linha.teto ? Math.min(100, (projecao / linha.teto) * 100) : null,
        };
    }, [nomeCategoriaDetalhe, resumo, itens]);

    const percentualTeto = resumo && resumo.teto > 0
        ? Math.min(100, (resumo.projecaoTotal / resumo.teto) * 100)
        : 0;
    const estourouTeto = resumo ? resumo.margem < 0 : false;
    /* Quando a projeção passa do teto, o trilho passa a ser medido pela
       projeção — senão as faixas ultrapassariam 100% e o overflow cortaria
       exatamente o caso que mais importa enxergar. */
    const baseTrilhoTeto = resumo ? Math.max(resumo.teto, resumo.projecaoTotal) || 1 : 1;

    const itensFiltrados = itens.filter((item) => {
        const bateTexto = !filtro.trim() || normalizar(item.descricao).includes(normalizar(filtro));
        const bateCategoria = !filtroCategoria || String(item.categoriaId) === filtroCategoria;
        const bateStatus = !filtroStatus || item.status === filtroStatus;
        return bateTexto && bateCategoria && bateStatus;
    });

    const totalFiltrado = itensFiltrados.reduce((soma, item) => soma + item.valorTotal, 0);

    /* ── Ações ──────────────────────────────────────────────── */

    const abrirNovaPrevisao = () => {
        setFormulario({ ...FORMULARIO_VAZIO, categoriaId: categorias[0]?.id ?? '' });
        setNovoFornecedor(NOVO_FORNECEDOR_VAZIO);
        setIdEmEdicao(null);
        setErroAcao('');
        setPainelAberto(true);
    };

    const abrirEdicaoPrevisao = (item) => {
        setFormulario({
            descricao: item.descricao,
            categoriaId: item.categoriaId,
            fornecedorId: item.fornecedorId ?? '',
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            frete: item.frete,
            escala: item.escala,
            status: item.status,
            dataPrevista: item.dataPrevista ?? '',
            observacao: item.observacao ?? '',
        });
        setNovoFornecedor(NOVO_FORNECEDOR_VAZIO);
        setIdEmEdicao(item.id);
        setErroAcao('');
        setPainelAberto(true);
    };

    const salvar = async (evento) => {
        evento.preventDefault();
        setErroAcao('');

        let fornecedorId = formulario.fornecedorId;
        if (cadastrandoFornecedor) {
            try {
                const criado = await criarFornecedor(novoFornecedor);
                setFornecedores([...fornecedores, criado]);
                fornecedorId = criado.id;
            } catch (e) {
                setErroAcao(e.message);
                return;
            }
        }

        setSalvando(true);
        try {
            const registro = { ...formulario, fornecedorId: fornecedorId || null };
            if (idEmEdicao !== null) {
                await atualizarPrevisao(idEmEdicao, registro);
            } else {
                await criarPrevisao(registro);
            }
            await recarregar();
            setPainelAberto(false);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const excluir = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErroAcao('');
        try {
            await excluirPrevisaoApi(id);
            await recarregar();
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    /* Converter é irreversível (cria a compra e fecha a previsão), por
       isso pede a segunda confirmação como a exclusão. */
    const converter = async (id) => {
        if (idConfirmandoConversao !== id) {
            setIdConfirmandoConversao(id);
            return;
        }
        setErroAcao('');
        try {
            await converterPrevisaoEmCompra(id);
            await recarregar();
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdConfirmandoConversao(null);
        }
    };

    /* ── Categorias ──────────────────────────────────────────
       Sem nenhuma categoria não há como lançar previsão: o item exige
       uma. Por isso a criação vive aqui dentro da própria aba, e não
       só na API. */
    const abrirCategorias = () => {
        setFormCategoria(CATEGORIA_VAZIA);
        setIdCategoriaEmEdicao(null);
        setErroAcao('');
        setPainelCategoriasAberto(true);
    };

    const editarCategoria = (categoria) => {
        setFormCategoria({
            nome: categoria.nome,
            cor: categoria.cor,
            teto: categoria.teto ?? 0,
            ordem: categoria.ordem ?? 0,
        });
        setIdCategoriaEmEdicao(categoria.id);
        setErroAcao('');
    };

    const salvarCategoria = async (evento) => {
        evento.preventDefault();
        setSalvandoCategoria(true);
        setErroAcao('');
        try {
            if (idCategoriaEmEdicao !== null) {
                await atualizarCategoriaPrevisao(idCategoriaEmEdicao, formCategoria);
            } else {
                await criarCategoriaPrevisao(formCategoria);
            }
            setCategorias(await listarCategoriasPrevisao());
            await recarregar();
            setFormCategoria(CATEGORIA_VAZIA);
            setIdCategoriaEmEdicao(null);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setSalvandoCategoria(false);
        }
    };

    /* O backend recusa com 409 categoria que tenha itens; a mensagem
       dele é o que aparece para quem clicou. */
    const removerCategoria = async (id) => {
        if (idCategoriaConfirmandoExclusao !== id) {
            setIdCategoriaConfirmandoExclusao(id);
            return;
        }
        setErroAcao('');
        try {
            await excluirCategoriaPrevisao(id);
            setCategorias(await listarCategoriasPrevisao());
            await recarregar();
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdCategoriaConfirmandoExclusao(null);
        }
    };

    const abrirOrcamento = () => {
        setErroAcao('');
        setPainelOrcamentoAberto(true);
    };

    const buscarCategoria = (id) => categorias.find((categoria) => categoria.id === id);

    return (
        <div className="conteudoPrevisaoFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Previsão de gastos</h1>
                    <p className="subtituloSecaoFinancas">
                        {resumo
                            ? `Projeção de ${formatarCentavos(resumo.projecaoTotal)} sobre o teto de gasto de ${formatarCentavos(resumo.teto)}`
                            : 'Carregando projeção…'}
                    </p>
                </div>
                <div className="controlesCabecalhoFinancas">
                    <button type="button" className="botaoFantasmaFinancas" onClick={abrirCategorias}>
                        Categorias
                    </button>
                    <button type="button" className="botaoFantasmaFinancas" onClick={abrirOrcamento} disabled={!orcamento}>
                        Orçamento
                    </button>
                    <button
                        type="button"
                        className="botaoPrimarioFinancas"
                        onClick={abrirNovaPrevisao}
                        disabled={categorias.length === 0}
                        title={categorias.length === 0 ? 'Crie uma categoria antes de lançar a primeira previsão' : undefined}
                    >
                        + Nova previsão
                    </button>
                </div>
            </header>

            {(erro || erroAcao) && (
                <p className="avisoErroPrevisao" role="alert">{erro || erroAcao}</p>
            )}

            {/* ── Indicadores ─────────────────────────────── */}
            {resumo && (
                <section className="gradeIndicadoresPrevisao" aria-label="Indicadores da previsão">
                    <article className="cartaoIndicadorPrevisao">
                        <span className="rotuloIndicadorPrevisao">Projeção total</span>
                        <strong className="valorIndicadorPrevisao">{formatarCentavos(resumo.projecaoTotal)}</strong>
                        <span className="notaIndicadorPrevisao">Previsto em aberto + compras já registradas</span>
                    </article>
                    <article className="cartaoIndicadorPrevisao">
                        <span className="rotuloIndicadorPrevisao">Previsto em aberto</span>
                        <strong className="valorIndicadorPrevisao">{formatarCentavos(resumo.previstoAberto)}</strong>
                        <span className="notaIndicadorPrevisao">O que ainda falta gastar</span>
                    </article>
                    <article className="cartaoIndicadorPrevisao">
                        <span className="rotuloIndicadorPrevisao">Realizado</span>
                        <strong className="valorIndicadorPrevisao">{formatarCentavos(resumo.realizado)}</strong>
                        <span className="notaIndicadorPrevisao">Compras registradas</span>
                    </article>
                    <article className={estourouTeto ? 'cartaoIndicadorPrevisao cartaoIndicadorEstouroPrevisao' : 'cartaoIndicadorPrevisao'}>
                        <span className="rotuloIndicadorPrevisao">
                            {estourouTeto ? 'Estouro do teto' : 'Margem até o teto'}
                        </span>
                        <strong className="valorIndicadorPrevisao">
                            {formatarCentavos(Math.abs(resumo.margem))}
                        </strong>
                        {/* O teto não é o saldo: soma o que está em caixa com os
                            patrocínios de contrato assinado ainda não pagos. Abrir
                            as duas parcelas evita a leitura de que há mais dinheiro
                            disponível do que realmente há. */}
                        <span className="notaIndicadorPrevisao">
                            Teto de gasto: {formatarCentavos(resumo.teto)}
                        </span>
                        <span className="notaIndicadorPrevisao">
                            {formatarCentavos(resumo.entradas?.total ?? 0)} em caixa
                            {resumo.patrociniosAReceber > 0
                                ? ` + ${formatarCentavos(resumo.patrociniosAReceber)} de patrocínio a receber`
                                : ''}
                        </span>
                    </article>
                </section>
            )}

            {/* ── Consumo do teto ─────────────────────────── */}
            {resumo && resumo.teto > 0 && (
                <section className="blocoConsumoTetoPrevisao" aria-label="Consumo do teto orçamentário">
                    <div className="cabecalhoConsumoTetoPrevisao">
                        <span className="rotuloBlocoPrevisao">Consumo do teto de gasto</span>
                        <span className="percentualConsumoTetoPrevisao">
                            {percentualTeto.toFixed(1).replace('.', ',')}%
                        </span>
                    </div>
                    <div
                        className="trilhoConsumoTetoPrevisao"
                        role="progressbar"
                        aria-valuenow={Math.round(percentualTeto)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Percentual do teto orçamentário já comprometido"
                    >
                        {/* Realizado e previsto empilhados, com 2px de respiro
                            entre eles para as faixas não se fundirem. */}
                        <div
                            className="faixaRealizadoConsumoTetoPrevisao"
                            style={{ width: `${(resumo.realizado / baseTrilhoTeto) * 100}%` }}
                        />
                        <div
                            className="faixaPrevistoConsumoTetoPrevisao"
                            style={{ width: `${(resumo.previstoAberto / baseTrilhoTeto) * 100}%` }}
                        />
                    </div>
                    <div className="legendaConsumoTetoPrevisao">
                        <span className="itemLegendaPrevisao">
                            <span className="marcadorLegendaPrevisao" style={{ background: COR_REALIZADO }} aria-hidden="true" />
                            Realizado {formatarCentavos(resumo.realizado)}
                        </span>
                        <span className="itemLegendaPrevisao">
                            <span className="marcadorLegendaPrevisao" style={{ background: COR_PREVISTO }} aria-hidden="true" />
                            Previsto {formatarCentavos(resumo.previstoAberto)}
                        </span>
                    </div>
                </section>
            )}

            {/* ── Gráficos ────────────────────────────────── */}
            {resumo && (
                <section className="gradeGraficosPrevisao" aria-label="Gráficos da previsão">
                    <article className="cartaoGraficoPrevisao cartaoGraficoLargoPrevisao">
                        <h2 className="tituloGraficoPrevisao">Previsto × realizado por categoria</h2>
                        <p className="notaGraficoPrevisao">
                            Cada linha é uma categoria; o comprimento é o valor.
                            Clique numa categoria para ver o detalhe.
                        </p>
                        <div className="areaGraficoPrevisao" style={{ height: `${Math.max(240, dadosCategorias.length * 42)}px` }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={dadosCategorias}
                                    layout="vertical"
                                    margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                                    barCategoryGap="22%"
                                    className="graficoClicavelPrevisao"
                                    /* O clique é na linha inteira, não só na
                                       barra: alvo maior e funciona também nas
                                       categorias de valor baixo, cuja barra é
                                       curta demais para acertar. */
                                    onClick={(estado) => {
                                        if (estado?.activeLabel) setNomeCategoriaDetalhe(estado.activeLabel);
                                    }}
                                >
                                    <CartesianGrid horizontal={false} stroke="rgba(252,248,245,0.10)" />
                                    <XAxis
                                        type="number"
                                        tickFormatter={formatarEixoValor}
                                        stroke="rgba(237,236,236,0.45)"
                                        tick={{ fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="nome"
                                        width={132}
                                        stroke="rgba(237,236,236,0.72)"
                                        tick={{ fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<TooltipPrevisao />} cursor={{ fill: 'rgba(252,248,245,0.06)' }} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                    <Bar dataKey="Previsto" fill={COR_PREVISTO} radius={[0, 4, 4, 0]} maxBarSize={13} />
                                    <Bar dataKey="Realizado" fill={COR_REALIZADO} radius={[0, 4, 4, 0]} maxBarSize={13} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </article>

                    <article className="cartaoGraficoPrevisao">
                        <h2 className="tituloGraficoPrevisao">Previsão por estágio</h2>
                        <p className="notaGraficoPrevisao">
                            Só o que está em aberto — item pago já virou compra.
                        </p>
                        <div className="areaGraficoPrevisao">
                            {dadosStatus.length === 0 ? (
                                <p className="vazioGraficoPrevisao">Nenhum item em aberto.</p>
                            ) : dadosStatus.length === 1 ? (
                                /* Uma fatia só não é uma rosca — é um anel cheio, que
                                   não compara nada. Enquanto tudo estiver no mesmo
                                   estágio, o número diz mais que o desenho. */
                                <div className="estagioUnicoGraficoPrevisao">
                                    <span
                                        className="marcadorLegendaPrevisao"
                                        style={{ background: dadosStatus[0].cor }}
                                        aria-hidden="true"
                                    />
                                    <strong className="valorEstagioUnicoPrevisao">
                                        {formatarCentavos(dadosStatus[0].valor)}
                                    </strong>
                                    <span className="notaEstagioUnicoPrevisao">
                                        Todo o valor em aberto está em “{dadosStatus[0].nome}”.
                                        A divisão aparece aqui conforme os itens avançarem de estágio.
                                    </span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dadosStatus}
                                            dataKey="valor"
                                            nameKey="nome"
                                            innerRadius="55%"
                                            outerRadius="80%"
                                            paddingAngle={2}
                                            stroke="#730835"
                                            strokeWidth={2}
                                        >
                                            {dadosStatus.map((fatia) => (
                                                <Cell key={fatia.nome} fill={fatia.cor} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<TooltipPrevisao />} />
                                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </article>
                </section>
            )}

            {/* ── Filtros ─────────────────────────────────── */}
            <div className="linhaFiltrosPrevisao">
                <div className="filtroTabelaFinancas">
                    <span className="iconeFiltroFinancas">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </span>
                    <input
                        className="entradaFiltroFinancas"
                        type="search"
                        placeholder="Filtrar por descrição…"
                        value={filtro}
                        onInput={(e) => setFiltro(e.currentTarget.value)}
                        aria-label="Filtrar previsões por descrição"
                    />
                </div>
                <select className="selectFiltroFinancas" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.currentTarget.value)} aria-label="Filtrar por categoria">
                    <option value="">Todas as categorias</option>
                    {categorias.map((categoria) => (
                        <option key={categoria.id} value={String(categoria.id)}>{categoria.nome}</option>
                    ))}
                </select>
                <select className="selectFiltroFinancas" value={filtroStatus} onChange={(e) => setFiltroStatus(e.currentTarget.value)} aria-label="Filtrar por estágio">
                    <option value="">Todos os estágios</option>
                    {STATUS.map((status) => (
                        <option key={status} value={status}>{ROTULO_STATUS[status]}</option>
                    ))}
                </select>
            </div>

            {/* ── Tabela ──────────────────────────────────── */}
            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Fornecedor</th>
                            <th>Cálculo</th>
                            <th>Total</th>
                            <th>Estágio</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr><td colSpan={6} className="celulaVaziaFinancas">Carregando previsão…</td></tr>
                        )}
                        {!carregando && itensFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={6} className="celulaVaziaFinancas">
                                    {filtro.trim() || filtroCategoria || filtroStatus
                                        ? 'Nenhuma previsão encontrada para esse filtro.'
                                        : categorias.length === 0
                                            ? 'Nenhuma categoria cadastrada — crie a primeira em “Categorias” para poder lançar previsões.'
                                            : 'Nenhuma previsão registrada ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && itensFiltrados.map((item) => (
                            <tr key={item.id} className={item.status === 'PAGO' ? 'linhaConvertidaPrevisao' : undefined}>
                                <td>
                                    <div className="celulaItemPrevisao">
                                        <span className="nomeItemPrevisao">{item.descricao}</span>
                                        <span
                                            className="seloCategoriaPrevisao"
                                            style={{ background: `${item.categoriaCor}26`, color: item.categoriaCor }}
                                        >
                                            {item.categoriaNome}
                                        </span>
                                        {item.observacao && (
                                            <span className="observacaoItemPrevisao" title={item.observacao}>
                                                {item.observacao}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>{item.fornecedorNome ?? '—'}</td>
                                <td className="celulaCalculoPrevisao">
                                    {formatarCentavos(item.valorUnitario)} × {item.quantidade}
                                    {item.frete > 0 && ` + ${formatarCentavos(item.frete)} frete`}
                                    {item.fator > 1 && (
                                        <span className="fatorEscalaPrevisao">
                                            × {item.fator} ({ROTULO_ESCALA[item.escala].toLowerCase()})
                                        </span>
                                    )}
                                </td>
                                <td className="celulaValorFinancas celulaValorTotalPrevisao">
                                    {formatarCentavos(item.valorTotal)}
                                </td>
                                <td>
                                    <span
                                        className="seloStatusPrevisao"
                                        style={{ background: `${CORES_STATUS[item.status]}26`, color: CORES_STATUS[item.status] }}
                                    >
                                        {ROTULO_STATUS[item.status]}
                                    </span>
                                </td>
                                <td>
                                    <div className="grupoAcoesLinhaFinancas">
                                        {item.status !== 'PAGO' && (
                                            <button
                                                type="button"
                                                className={
                                                    idConfirmandoConversao === item.id
                                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarConversaoPrevisao'
                                                        : 'botaoAcaoLinhaFinancas'
                                                }
                                                aria-label={
                                                    idConfirmandoConversao === item.id
                                                        ? `Confirmar conversão de ${item.descricao} em compra`
                                                        : `Converter ${item.descricao} em compra`
                                                }
                                                title={
                                                    idConfirmandoConversao === item.id
                                                        ? 'Clique novamente para confirmar — cria a compra e fecha a previsão'
                                                        : 'Converter em compra'
                                                }
                                                onClick={() => converter(item.id)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="botaoAcaoLinhaFinancas"
                                            aria-label={`Editar ${item.descricao}`}
                                            title="Editar"
                                            onClick={() => abrirEdicaoPrevisao(item)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                idConfirmandoExclusao === item.id
                                                    ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                    : 'botaoAcaoLinhaFinancas'
                                            }
                                            aria-label={
                                                idConfirmandoExclusao === item.id
                                                    ? `Confirmar exclusão de ${item.descricao}`
                                                    : `Excluir ${item.descricao}`
                                            }
                                            title={
                                                idConfirmandoExclusao === item.id
                                                    ? 'Clique novamente para confirmar'
                                                    : 'Excluir'
                                            }
                                            onClick={() => excluir(item.id)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {!carregando && itensFiltrados.length > 0 && (
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="rotuloTotalPrevisao">
                                    {itensFiltrados.length} {itensFiltrados.length === 1 ? 'item' : 'itens'}
                                </td>
                                <td className="celulaValorFinancas celulaValorTotalPrevisao">
                                    {formatarCentavos(totalFiltrado)}
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* ── Formulário do item ──────────────────────── */}
            <PainelLateral
                aberto={painelAberto}
                titulo={idEmEdicao !== null ? 'Editar previsão' : 'Nova previsão'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvar}>
                    <h3 className="divisorFormularioFinancas">Item</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDescricaoPrevisao">Descrição *</label>
                        <input
                            id="campoDescricaoPrevisao"
                            className="entradaFormularioFinancas"
                            required
                            placeholder="Ex: camiseta, coffee break de segunda, passagem…"
                            value={formulario.descricao}
                            onInput={(e) => setFormulario({ ...formulario, descricao: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoCategoriaPrevisao">Categoria *</label>
                        <select
                            id="campoCategoriaPrevisao"
                            className="entradaFormularioFinancas"
                            required
                            value={String(formulario.categoriaId)}
                            onChange={(e) => setFormulario({ ...formulario, categoriaId: e.currentTarget.value })}
                        >
                            <option value="" disabled>Selecione a categoria</option>
                            {categorias.map((categoria) => (
                                <option key={categoria.id} value={String(categoria.id)}>{categoria.nome}</option>
                            ))}
                        </select>
                    </div>

                    <h3 className="divisorFormularioFinancas">Valor</h3>

                    <div className="linhaDuplaFormularioFinancas">
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoValorUnitarioPrevisao">Valor unitário *</label>
                            <CampoMoeda
                                id="campoValorUnitarioPrevisao"
                                valorCentavos={formulario.valorUnitario}
                                aoMudar={(centavos) => setFormulario({ ...formulario, valorUnitario: centavos })}
                            />
                        </div>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoQuantidadePrevisao">Quantidade *</label>
                            <input
                                id="campoQuantidadePrevisao"
                                className="entradaFormularioFinancas"
                                type="number"
                                min={0}
                                required
                                value={formulario.quantidade}
                                onInput={(e) => setFormulario({ ...formulario, quantidade: parseInt(e.currentTarget.value, 10) || 0 })}
                            />
                            <span className="ajudaCampoPrevisao">
                                Pode ser 0 — preço já pesquisado, quantidade a decidir.
                            </span>
                        </div>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoFretePrevisao">Frete</label>
                        <CampoMoeda
                            id="campoFretePrevisao"
                            valorCentavos={formulario.frete}
                            aoMudar={(centavos) => setFormulario({ ...formulario, frete: centavos })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoEscalaPrevisao">Escala *</label>
                        <select
                            id="campoEscalaPrevisao"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.escala}
                            onChange={(e) => setFormulario({ ...formulario, escala: e.currentTarget.value })}
                        >
                            {ESCALAS.map((escala) => (
                                <option key={escala} value={escala}>{ROTULO_ESCALA[escala]}</option>
                            ))}
                        </select>
                        <span className="ajudaCampoPrevisao">
                            Escalas por cabeça multiplicam pelo contador do orçamento e se
                            recalculam sozinhas quando a estimativa muda.
                        </span>
                    </div>

                    <h3 className="divisorFormularioFinancas">Situação</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoStatusPrevisao">Estágio *</label>
                        <select
                            id="campoStatusPrevisao"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.status}
                            onChange={(e) => setFormulario({ ...formulario, status: e.currentTarget.value })}
                        >
                            {STATUS.filter((status) => status !== 'PAGO').map((status) => (
                                <option key={status} value={status}>{ROTULO_STATUS[status]}</option>
                            ))}
                        </select>
                        <span className="ajudaCampoPrevisao">
                            Pago não se escolhe aqui — vem de converter em compra.
                        </span>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDataPrevistaPrevisao">Data prevista</label>
                        <input
                            id="campoDataPrevistaPrevisao"
                            className="entradaFormularioFinancas"
                            type="date"
                            value={formulario.dataPrevista}
                            onInput={(e) => setFormulario({ ...formulario, dataPrevista: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoObservacaoPrevisao">Observação</label>
                        <textarea
                            id="campoObservacaoPrevisao"
                            className="entradaFormularioFinancas areaTextoFinancas"
                            rows={2}
                            maxLength={500}
                            value={formulario.observacao}
                            onInput={(e) => setFormulario({ ...formulario, observacao: e.currentTarget.value })}
                        />
                    </div>

                    <h3 className="divisorFormularioFinancas">Fornecedor</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoFornecedorPrevisao">Fornecedor</label>
                        <select
                            id="campoFornecedorPrevisao"
                            className="entradaFormularioFinancas"
                            value={String(formulario.fornecedorId)}
                            onChange={(e) => setFormulario({ ...formulario, fornecedorId: e.currentTarget.value })}
                        >
                            <option value="">Ainda não definido</option>
                            {fornecedores.map((fornecedor) => (
                                <option key={fornecedor.id} value={String(fornecedor.id)}>{fornecedor.nome}</option>
                            ))}
                            <option value="novo">+ Cadastrar novo fornecedor</option>
                        </select>
                        <span className="ajudaCampoPrevisao">
                            Obrigatório só na hora de converter em compra.
                        </span>
                    </div>

                    {cadastrandoFornecedor && (
                        <div className="blocoNovoFornecedorPrevisao">
                            <div className="campoFormularioFinancas">
                                <label className="rotuloCampoFinancas" htmlFor="campoNovoFornecedorNomePrevisao">
                                    Nome do fornecedor *
                                </label>
                                <input
                                    id="campoNovoFornecedorNomePrevisao"
                                    className="entradaFormularioFinancas"
                                    required
                                    value={novoFornecedor.nome}
                                    onInput={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.currentTarget.value })}
                                />
                            </div>
                            <div className="campoFormularioFinancas">
                                <label className="rotuloCampoFinancas" htmlFor="campoNovoFornecedorContatoPrevisao">Contato</label>
                                <input
                                    id="campoNovoFornecedorContatoPrevisao"
                                    className="entradaFormularioFinancas"
                                    placeholder="Telefone ou e-mail"
                                    value={novoFornecedor.contato}
                                    onInput={(e) => setNovoFornecedor({ ...novoFornecedor, contato: e.currentTarget.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="rodapeFormularioFinancas">
                        <button type="button" className="botaoFantasmaFinancas" onClick={() => setPainelAberto(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvando}>
                            {salvando ? 'Salvando…' : idEmEdicao !== null ? 'Salvar alterações' : 'Registrar previsão'}
                        </button>
                    </div>
                </form>
            </PainelLateral>

            {/* ── Detalhe de uma categoria ────────────────── */}
            <PainelLateral
                aberto={Boolean(detalheCategoria)}
                titulo={detalheCategoria ? detalheCategoria.nome : 'Categoria'}
                aoFechar={() => setNomeCategoriaDetalhe(null)}
            >
                {detalheCategoria && (
                    <div className="detalheCategoriaPrevisao">
                        <ul className="listaNumerosDetalheCategoriaPrevisao">
                            <li className="numeroDetalheCategoriaPrevisao">
                                <span className="rotuloNumeroDetalhePrevisao">Já gastou</span>
                                <strong className="valorNumeroDetalhePrevisao">
                                    {formatarCentavos(detalheCategoria.totalRealizado)}
                                </strong>
                                <span className="notaNumeroDetalhePrevisao">Compras registradas</span>
                            </li>
                            <li className="numeroDetalheCategoriaPrevisao">
                                <span className="rotuloNumeroDetalhePrevisao">Previsto em aberto</span>
                                <strong className="valorNumeroDetalhePrevisao">
                                    {formatarCentavos(detalheCategoria.totalPrevisto)}
                                </strong>
                                <span className="notaNumeroDetalhePrevisao">Ainda não pago</span>
                            </li>
                            <li className="numeroDetalheCategoriaPrevisao">
                                <span className="rotuloNumeroDetalhePrevisao">Teto da categoria</span>
                                <strong className="valorNumeroDetalhePrevisao">
                                    {detalheCategoria.teto ? formatarCentavos(detalheCategoria.teto) : '—'}
                                </strong>
                                <span className="notaNumeroDetalhePrevisao">
                                    {detalheCategoria.teto
                                        ? 'Limite próprio desta categoria'
                                        : 'Sem teto próprio — responde só ao saldo da Comissão'}
                                </span>
                            </li>
                            <li className="numeroDetalheCategoriaPrevisao">
                                <span className="rotuloNumeroDetalhePrevisao">
                                    {detalheCategoria.margem !== null && detalheCategoria.margem < 0
                                        ? 'Passou do teto em'
                                        : 'Falta para o teto'}
                                </span>
                                <strong
                                    className={
                                        detalheCategoria.margem !== null && detalheCategoria.margem < 0
                                            ? 'valorNumeroDetalhePrevisao valorEstouroDetalhePrevisao'
                                            : 'valorNumeroDetalhePrevisao'
                                    }
                                >
                                    {detalheCategoria.margem === null
                                        ? '—'
                                        : formatarCentavos(Math.abs(detalheCategoria.margem))}
                                </strong>
                                <span className="notaNumeroDetalhePrevisao">
                                    {detalheCategoria.margem === null
                                        ? 'Defina um teto em “Categorias” para acompanhar'
                                        : `Teto menos a projeção de ${formatarCentavos(detalheCategoria.projecao)}`}
                                </span>
                            </li>
                        </ul>

                        {/* A barra só aparece com teto: sem ele não há
                            proporção a mostrar. */}
                        {detalheCategoria.percentual !== null && (
                            <div className="consumoDetalheCategoriaPrevisao">
                                <div className="cabecalhoConsumoTetoPrevisao">
                                    <span className="rotuloBlocoPrevisao">Consumo do teto</span>
                                    <span className="percentualConsumoTetoPrevisao">
                                        {detalheCategoria.percentual.toFixed(1).replace('.', ',')}%
                                    </span>
                                </div>
                                <div
                                    className="trilhoConsumoTetoPrevisao"
                                    role="progressbar"
                                    aria-valuenow={Math.round(detalheCategoria.percentual)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`Percentual do teto de ${detalheCategoria.nome} já comprometido`}
                                >
                                    <div
                                        className="faixaRealizadoConsumoTetoPrevisao"
                                        style={{ width: `${(detalheCategoria.totalRealizado / Math.max(detalheCategoria.teto, detalheCategoria.projecao)) * 100}%` }}
                                    />
                                    <div
                                        className="faixaPrevistoConsumoTetoPrevisao"
                                        style={{ width: `${(detalheCategoria.totalPrevisto / Math.max(detalheCategoria.teto, detalheCategoria.projecao)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <h3 className="divisorFormularioFinancas">
                            Itens cadastrados ({detalheCategoria.itens.length})
                        </h3>

                        {detalheCategoria.itens.length === 0 ? (
                            <p className="vazioItensDetalhePrevisao">
                                Nenhum item nesta categoria ainda.
                            </p>
                        ) : (
                            <ul className="listaItensDetalheCategoriaPrevisao">
                                {detalheCategoria.itens.map((item) => (
                                    <li key={item.id} className="itemDetalheCategoriaPrevisao">
                                        <div className="topoItemDetalhePrevisao">
                                            <span className="nomeItemDetalhePrevisao">{item.descricao}</span>
                                            <strong className="valorItemDetalhePrevisao">
                                                {formatarCentavos(item.valorTotal)}
                                            </strong>
                                        </div>
                                        <div className="baseItemDetalhePrevisao">
                                            <span
                                                className="seloStatusPrevisao"
                                                style={{ background: `${CORES_STATUS[item.status]}26`, color: CORES_STATUS[item.status] }}
                                            >
                                                {ROTULO_STATUS[item.status]}
                                            </span>
                                            <span className="calculoItemDetalhePrevisao">
                                                {formatarCentavos(item.valorUnitario)} × {item.quantidade}
                                                {item.fator !== 1 && ` × ${item.fator}`}
                                                {item.fornecedorNome && ` · ${item.fornecedorNome}`}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="rodapeFormularioFinancas">
                            <button
                                type="button"
                                className="botaoFantasmaFinancas"
                                onClick={() => {
                                    setFiltroCategoria(String(detalheCategoria.id));
                                    setNomeCategoriaDetalhe(null);
                                }}
                            >
                                Filtrar a tabela por esta categoria
                            </button>
                        </div>
                    </div>
                )}
            </PainelLateral>

            {/* ── Categorias ──────────────────────────────── */}
            <PainelLateral
                aberto={painelCategoriasAberto}
                titulo="Categorias de gasto"
                aoFechar={() => setPainelCategoriasAberto(false)}
            >
                <p className="textoAjudaPainelPrevisao">
                    Cada categoria agrupa um tipo de gasto e dá a cor do selo na tabela.
                    O teto por categoria é opcional — sem ele, vale só o teto geral do orçamento.
                </p>

                <ul className="listaCategoriasPrevisao">
                    {categorias.length === 0 && (
                        <li className="vazioListaCategoriasPrevisao">Nenhuma categoria cadastrada ainda.</li>
                    )}
                    {categorias.map((categoria) => (
                        <li key={categoria.id} className="itemListaCategoriasPrevisao">
                            <span
                                className="amostraCorCategoriaPrevisao"
                                style={{ background: categoria.cor }}
                                aria-hidden="true"
                            />
                            <span className="nomeCategoriaListaPrevisao">{categoria.nome}</span>
                            {categoria.teto > 0 && (
                                <span className="tetoCategoriaListaPrevisao">
                                    teto {formatarCentavos(categoria.teto)}
                                </span>
                            )}
                            <div className="grupoAcoesLinhaFinancas">
                                <button
                                    type="button"
                                    className="botaoAcaoLinhaFinancas"
                                    aria-label={`Editar categoria ${categoria.nome}`}
                                    title="Editar"
                                    onClick={() => editarCategoria(categoria)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className={
                                        idCategoriaConfirmandoExclusao === categoria.id
                                            ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                            : 'botaoAcaoLinhaFinancas'
                                    }
                                    aria-label={
                                        idCategoriaConfirmandoExclusao === categoria.id
                                            ? `Confirmar exclusão da categoria ${categoria.nome}`
                                            : `Excluir categoria ${categoria.nome}`
                                    }
                                    title={
                                        idCategoriaConfirmandoExclusao === categoria.id
                                            ? 'Clique novamente para confirmar'
                                            : 'Excluir'
                                    }
                                    onClick={() => removerCategoria(categoria.id)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <form className="formularioFinancas" onSubmit={salvarCategoria}>
                    <h3 className="divisorFormularioFinancas">
                        {idCategoriaEmEdicao !== null ? 'Editar categoria' : 'Nova categoria'}
                    </h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeCategoriaPrevisao">Nome *</label>
                        <input
                            id="campoNomeCategoriaPrevisao"
                            className="entradaFormularioFinancas"
                            required
                            maxLength={80}
                            placeholder="Ex: Coffee Break, Kit do Participante…"
                            value={formCategoria.nome}
                            onInput={(e) => setFormCategoria({ ...formCategoria, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="linhaDuplaFormularioFinancas">
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoCorCategoriaPrevisao">Cor *</label>
                            <input
                                id="campoCorCategoriaPrevisao"
                                className="entradaCorCategoriaPrevisao"
                                type="color"
                                required
                                value={formCategoria.cor}
                                onInput={(e) => setFormCategoria({ ...formCategoria, cor: e.currentTarget.value })}
                            />
                            <span className="ajudaCampoPrevisao">
                                Tons médios leem melhor sobre o fundo escuro do módulo.
                            </span>
                        </div>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoOrdemCategoriaPrevisao">Ordem</label>
                            <input
                                id="campoOrdemCategoriaPrevisao"
                                className="entradaFormularioFinancas"
                                type="number"
                                min={0}
                                value={formCategoria.ordem}
                                onInput={(e) => setFormCategoria({ ...formCategoria, ordem: parseInt(e.currentTarget.value, 10) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoTetoCategoriaPrevisao">Teto da categoria</label>
                        <CampoMoeda
                            id="campoTetoCategoriaPrevisao"
                            valorCentavos={formCategoria.teto}
                            aoMudar={(centavos) => setFormCategoria({ ...formCategoria, teto: centavos })}
                        />
                        <span className="ajudaCampoPrevisao">Deixe zerado para não ter limite próprio.</span>
                    </div>

                    <div className="rodapeFormularioFinancas">
                        {idCategoriaEmEdicao !== null && (
                            <button
                                type="button"
                                className="botaoFantasmaFinancas"
                                onClick={() => { setFormCategoria(CATEGORIA_VAZIA); setIdCategoriaEmEdicao(null); }}
                            >
                                Cancelar edição
                            </button>
                        )}
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoCategoria}>
                            {salvandoCategoria
                                ? 'Salvando…'
                                : idCategoriaEmEdicao !== null ? 'Salvar categoria' : 'Adicionar categoria'}
                        </button>
                    </div>
                </form>
            </PainelLateral>

            {/* ── Parâmetros do orçamento (leitura) ───────── */}
            <PainelLateral
                aberto={painelOrcamentoAberto}
                titulo="Parâmetros do orçamento"
                aoFechar={() => setPainelOrcamentoAberto(false)}
            >

                <ul className="listaParametrosOrcamentoPrevisao">
                    <li className="parametroOrcamentoPrevisao">
                        <span className="rotuloParametroOrcamentoPrevisao">Teto de gastos</span>
                        <strong className="valorParametroOrcamentoPrevisao">
                            {resumo ? formatarCentavos(resumo.teto) : '—'}
                        </strong>
                        <span className="ajudaCampoPrevisao">
                            O que a Comissão arrecadou: patrocínios recebidos, doações e
                            inscrições. Sobe a cada entrada nova.
                        </span>
                    </li>
                    <li className="parametroOrcamentoPrevisao">
                        <span className="rotuloParametroOrcamentoPrevisao">Inscritos</span>
                        <strong className="valorParametroOrcamentoPrevisao">
                            {orcamento?.inscritosPrevistos ?? 0}
                        </strong>
                        <span className="ajudaCampoPrevisao">
                            Pessoas inscritas, confirmadas ou aguardando confirmação.
                            Multiplica os itens com escala “Por inscrito”.
                        </span>
                    </li>
                    <li className="parametroOrcamentoPrevisao">
                        <span className="rotuloParametroOrcamentoPrevisao">Membros da comissão</span>
                        <strong className="valorParametroOrcamentoPrevisao">
                            {orcamento?.membrosComissao ?? 0}
                        </strong>
                        <span className="ajudaCampoPrevisao">
                            Pessoas da comissão organizadora — todo papel que não seja
                            participante. Multiplica a escala “Por membro da comissão”.
                        </span>
                    </li>
                    <li className="parametroOrcamentoPrevisao">
                        <span className="rotuloParametroOrcamentoPrevisao">Palestrantes</span>
                        <strong className="valorParametroOrcamentoPrevisao">
                            {orcamento?.palestrantesPrevistos ?? 0}
                        </strong>
                        <span className="ajudaCampoPrevisao">
                            Palestrantes cadastrados. Multiplica a escala “Por palestrante”.
                        </span>
                    </li>
                </ul>

                {/* Escala por cabeça com contador em zero dá total R$ 0,00.
                    Antes isso acontecia em silêncio; agora o painel diz. */}
                {orcamento && (orcamento.membrosComissao === 0 || orcamento.palestrantesPrevistos === 0 || orcamento.inscritosPrevistos === 0) && (
                    <p className="avisoParametroZeradoPrevisao" role="status">
                        Contador em zero faz os itens daquela escala valerem R$ 0,00.
                        Cadastre as pessoas correspondentes, ou use “Valor fechado” no item.
                    </p>
                )}
            </PainelLateral>
        </div>
    );
}
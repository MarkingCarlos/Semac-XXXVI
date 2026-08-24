import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation, useParams } from 'wouter';
import { formatarCentavos } from '../utils/moeda.js';
import { listarCotacoes } from '../data/apiCotacoes.js';
import { listarFornecedores } from '../data/apiFornecedores.js';
import { buscarConjunto, renomearConjunto, excluirConjunto as excluirConjuntoApi } from '../data/apiConjuntos.js';
import { criarVariacao, atualizarVariacao, excluirVariacao as excluirVariacaoApi } from '../data/apiVariacoes.js';
import BuscaItensConjunto from './BuscaItensConjunto.jsx';
import { menorFornecedor } from './melhorPreco.js';
import '../financas.css';
import './conjuntosCotacao.css';
import './conjuntoDetalhe.css';

/* Grade de comparação de um conjunto (ex.: "Coffee"): cada variação (ex.:
   "Coffee Cheio") tem sua PRÓPRIA tabela — uma linha por produto (não por
   produto+fornecedor), com um dropdown pra escolher o fornecedor daquela
   variação e a quantidade. As escolhas ficam em estado local (`edicoes`)
   pra recalcular totais em tempo real e só são persistidas (por variação)
   ao sair do campo.

   As tabelas não listam o catálogo inteiro de cotações: só os itens
   escolhidos na busca (BuscaItensConjunto) entram na grade. */
export default function ConjuntoDetalhe() {
    const { id } = useParams();
    const [, navegar] = useLocation();

    const [conjunto, setConjunto] = useState(null);
    const [cotacoes, setCotacoes] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    /* Ids das cotações que compõem este conjunto — a seleção não é
       persistida: ao recarregar, ela é remontada a partir dos itens que
       já têm quantidade em alguma variação. */
    const [itensSelecionados, setItensSelecionados] = useState([]);

    // edicoes[variacaoId][cotacaoId] = { fornecedorId, quantidade }
    const [edicoes, setEdicoes] = useState({});

    const [renomeando, setRenomeando] = useState(false);
    const [nomeEditado, setNomeEditado] = useState('');

    const [criandoVariacao, setCriandoVariacao] = useState(false);
    const [nomeNovaVariacao, setNomeNovaVariacao] = useState('');

    useEffect(() => {
        let ativo = true;
        Promise.all([buscarConjunto(id), listarCotacoes(), listarFornecedores()])
            .then(([conjuntoCarregado, listaCotacoes, listaFornecedores]) => {
                if (!ativo) return;
                setConjunto(conjuntoCarregado);
                setNomeEditado(conjuntoCarregado.nome);
                setEdicoes(
                    Object.fromEntries(
                        conjuntoCarregado.variacoes.map((variacao) => [
                            variacao.id,
                            Object.fromEntries(
                                variacao.itens.map((item) => [
                                    item.cotacaoId,
                                    { fornecedorId: item.fornecedorId, quantidade: item.quantidade },
                                ]),
                            ),
                        ]),
                    ),
                );
                setItensSelecionados(
                    Array.from(
                        new Set(
                            conjuntoCarregado.variacoes.flatMap((variacao) =>
                                variacao.itens.filter((item) => item.quantidade > 0).map((item) => item.cotacaoId),
                            ),
                        ),
                    ),
                );
                setCotacoes(listaCotacoes);
                setFornecedores(listaFornecedores);
            })
            .catch((e) => {
                if (ativo) setErro(e.message);
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, [id]);

    const cotacaoPorId = useMemo(() => Object.fromEntries(cotacoes.map((c) => [c.id, c])), [cotacoes]);
    const buscarFornecedor = (fornecedorId) => fornecedores.find((f) => f.id === fornecedorId);

    /* Produtos (não linhas de fornecedor) agrupados por categoria — a
       mesma lista de linhas aparece em todas as tabelas de variação.
       Só entram os itens escolhidos na busca. */
    const produtosPorCategoria = useMemo(() => {
        const escolhidos = new Set(itensSelecionados);
        const porCategoria = new Map();
        for (const cotacao of cotacoes) {
            if (cotacao.fornecedores.length === 0) continue;
            if (!escolhidos.has(cotacao.id)) continue;
            const lista = porCategoria.get(cotacao.categoria) ?? [];
            lista.push(cotacao);
            porCategoria.set(cotacao.categoria, lista);
        }
        return Array.from(porCategoria.entries());
    }, [cotacoes, itensSelecionados]);

    const fornecedorEscolhidoEm = (variacaoId, cotacao) =>
        edicoes[variacaoId]?.[cotacao.id]?.fornecedorId ?? menorFornecedor(cotacao)?.fornecedorId ?? '';

    const quantidadeEm = (variacaoId, cotacaoId) => edicoes[variacaoId]?.[cotacaoId]?.quantidade ?? 0;

    const valorUnitarioEm = (variacaoId, cotacao) => {
        const fornecedorId = fornecedorEscolhidoEm(variacaoId, cotacao);
        return cotacao.fornecedores.find((linha) => linha.fornecedorId === fornecedorId)?.valorUnitario ?? 0;
    };

    const definirQuantidade = (variacaoId, cotacao, quantidade) => {
        setEdicoes((atual) => ({
            ...atual,
            [variacaoId]: {
                ...atual[variacaoId],
                [cotacao.id]: {
                    fornecedorId: atual[variacaoId]?.[cotacao.id]?.fornecedorId ?? menorFornecedor(cotacao)?.fornecedorId,
                    quantidade,
                },
            },
        }));
    };

    /* Persiste um mapa de escolhas explícito (em vez de ler de `edicoes`)
       — necessário pro dropdown de fornecedor, que precisa salvar no mesmo
       evento em que muda a escolha: como setEdicoes é assíncrono, ler
       `edicoes` logo em seguida ainda pegaria o valor antigo. */
    const persistirMapa = async (variacao, mapa) => {
        const itens = Object.entries(mapa)
            .filter(([, escolha]) => escolha.quantidade > 0)
            .map(([cotacaoId, escolha]) => ({
                cotacaoId: Number(cotacaoId),
                fornecedorId: escolha.fornecedorId,
                quantidade: escolha.quantidade,
            }));
        try {
            const atualizada = await atualizarVariacao(variacao.id, variacao.nome, itens);
            setConjunto((atual) => ({
                ...atual,
                variacoes: atual.variacoes.map((v) => (v.id === variacao.id ? atualizada : v)),
            }));
        } catch (e) {
            setErro(e.message);
        }
    };

    const escolherFornecedor = (variacao, cotacao, fornecedorId) => {
        const mapa = {
            ...(edicoes[variacao.id] ?? {}),
            [cotacao.id]: { fornecedorId, quantidade: edicoes[variacao.id]?.[cotacao.id]?.quantidade ?? 0 },
        };
        setEdicoes((atual) => ({ ...atual, [variacao.id]: mapa }));
        persistirMapa(variacao, mapa);
    };

    /* Só a mercadoria — o frete entra separado, em freteVariacao(). */
    const totalMercadoriaVariacao = (variacaoId) => {
        let soma = 0;
        for (const [cotacaoId, escolha] of Object.entries(edicoes[variacaoId] ?? {})) {
            if (!escolha.quantidade) continue;
            const cotacao = cotacaoPorId[cotacaoId];
            const linha = cotacao?.fornecedores.find((l) => l.fornecedorId === escolha.fornecedorId);
            soma += (linha?.valorUnitario ?? 0) * escolha.quantidade;
        }
        return soma;
    };

    /* Frete é cobrado UMA VEZ por fornecedor na variação — assume entrega
       única, então dois produtos do mesmo fornecedor não pagam frete
       dobrado. Quando os fretes cotados divergem entre os produtos desse
       fornecedor, vale o maior (cenário mais caro). */
    const fretesPorFornecedorVariacao = (variacaoId) => {
        const porFornecedor = new Map();
        for (const [cotacaoId, escolha] of Object.entries(edicoes[variacaoId] ?? {})) {
            if (!escolha.quantidade) continue;
            const cotacao = cotacaoPorId[cotacaoId];
            const linha = cotacao?.fornecedores.find((l) => l.fornecedorId === escolha.fornecedorId);
            const frete = linha?.frete ?? 0;
            if (frete <= 0) continue;
            porFornecedor.set(escolha.fornecedorId, Math.max(porFornecedor.get(escolha.fornecedorId) ?? 0, frete));
        }
        return porFornecedor;
    };

    const freteVariacao = (variacaoId) =>
        Array.from(fretesPorFornecedorVariacao(variacaoId).values()).reduce((soma, frete) => soma + frete, 0);

    const totalVariacao = (variacaoId) => totalMercadoriaVariacao(variacaoId) + freteVariacao(variacaoId);

    const itensComQuantidade = (variacaoId) =>
        Object.values(edicoes[variacaoId] ?? {}).filter((escolha) => escolha.quantidade > 0).length;

    const quantidadeTotalVariacao = (variacaoId) =>
        Object.values(edicoes[variacaoId] ?? {}).reduce((soma, escolha) => soma + (escolha.quantidade > 0 ? escolha.quantidade : 0), 0);

    /* Subtotal por categoria é só mercadoria: o frete é por fornecedor e
       pode atravessar categorias, então aparece só no total da variação. */
    const totalCategoriaVariacao = (produtosCategoria, variacaoId) =>
        produtosCategoria.reduce(
            (soma, cotacao) => soma + valorUnitarioEm(variacaoId, cotacao) * quantidadeEm(variacaoId, cotacao.id),
            0,
        );

    /* Persiste as escolhas atuais de uma variação (lê de `edicoes`) — usado
       pelo onBlur da quantidade, onde o estado já está atualizado. */
    const persistirVariacao = (variacao) => persistirMapa(variacao, edicoes[variacao.id] ?? {});

    /* ── Itens que compõem o conjunto ───────────────────────────────
       Adicionar só amplia a grade. Remover precisa zerar a quantidade
       do item em cada variação: senão ele continuaria somando no total
       sem aparecer em tabela nenhuma. */

    const adicionarItem = (cotacao) =>
        setItensSelecionados((atual) => (atual.includes(cotacao.id) ? atual : [...atual, cotacao.id]));

    const variacoesComItem = (cotacaoId) =>
        conjunto.variacoes.filter((variacao) => (edicoes[variacao.id]?.[cotacaoId]?.quantidade ?? 0) > 0);

    const removerItem = (cotacao) => {
        const afetadas = variacoesComItem(cotacao.id);
        if (afetadas.length > 0) {
            const aviso =
                afetadas.length === 1
                    ? `"${cotacao.descricao}" tem quantidade em 1 variação. Remover zera essa quantidade.`
                    : `"${cotacao.descricao}" tem quantidade em ${afetadas.length} variações. Remover zera essas quantidades.`;
            if (!window.confirm(aviso)) return;
        }
        const edicoesSemItem = Object.fromEntries(
            Object.entries(edicoes).map(([variacaoId, escolhas]) => {
                const { [cotacao.id]: _removida, ...resto } = escolhas;
                return [variacaoId, resto];
            }),
        );
        setEdicoes(edicoesSemItem);
        setItensSelecionados((atual) => atual.filter((id) => id !== cotacao.id));
        afetadas.forEach((variacao) => persistirMapa(variacao, edicoesSemItem[variacao.id] ?? {}));
    };

    const limparItens = () => {
        const temQuantidade = itensSelecionados.some((cotacaoId) => variacoesComItem(cotacaoId).length > 0);
        if (temQuantidade) {
            if (!window.confirm('Remover todos os itens do conjunto? As quantidades lançadas nas variações serão zeradas.')) return;
            setEdicoes(Object.fromEntries(conjunto.variacoes.map((variacao) => [variacao.id, {}])));
            conjunto.variacoes.forEach((variacao) => persistirMapa(variacao, {}));
        }
        setItensSelecionados([]);
    };

    const salvarNomeConjunto = async () => {
        setRenomeando(false);
        if (!nomeEditado.trim() || nomeEditado === conjunto.nome) {
            setNomeEditado(conjunto.nome);
            return;
        }
        try {
            const atualizado = await renomearConjunto(id, nomeEditado);
            setConjunto((atual) => ({ ...atual, nome: atualizado.nome }));
        } catch (e) {
            setErro(e.message);
            setNomeEditado(conjunto.nome);
        }
    };

    const adicionarVariacao = async (evento) => {
        evento.preventDefault();
        if (!nomeNovaVariacao.trim()) return;
        try {
            const nova = await criarVariacao(conjunto.id, nomeNovaVariacao);
            setConjunto((atual) => ({ ...atual, variacoes: [...atual.variacoes, nova] }));
            setEdicoes((atual) => ({ ...atual, [nova.id]: {} }));
            setNomeNovaVariacao('');
            setCriandoVariacao(false);
        } catch (e) {
            setErro(e.message);
        }
    };

    const removerVariacao = async (variacao) => {
        if (!window.confirm(`Remover a variação "${variacao.nome}"?`)) return;
        try {
            await excluirVariacaoApi(variacao.id);
            setConjunto((atual) => ({
                ...atual,
                variacoes: atual.variacoes.filter((v) => v.id !== variacao.id),
            }));
            setEdicoes((atual) => {
                const { [variacao.id]: _removida, ...resto } = atual;
                return resto;
            });
        } catch (e) {
            setErro(e.message);
        }
    };

    const zerarTodasQuantidades = async () => {
        if (!conjunto.variacoes.length) return;
        if (!window.confirm('Zerar as quantidades de todas as variações deste conjunto?')) return;
        setEdicoes(Object.fromEntries(conjunto.variacoes.map((v) => [v.id, {}])));
        try {
            const atualizadas = await Promise.all(
                conjunto.variacoes.map((v) => atualizarVariacao(v.id, v.nome, [])),
            );
            setConjunto((atual) => ({ ...atual, variacoes: atualizadas }));
        } catch (e) {
            setErro(e.message);
        }
    };

    const excluirConjunto = async () => {
        if (!window.confirm(`Excluir o conjunto "${conjunto.nome}" e todas as suas variações?`)) return;
        try {
            await excluirConjuntoApi(id);
            navegar('/financeiro/conjuntos');
        } catch (e) {
            setErro(e.message);
        }
    };

    return (
        <div className="paginaFinancas">
            <header className="cabecalhoFinancas">
                <button
                    type="button"
                    className="botaoVoltarConjuntosCotacao"
                    onClick={() => navegar('/financeiro/conjuntos')}
                    aria-label="Voltar para conjuntos"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <span className="marcaCabecalhoFinancas">SEMAC</span>
                <span className="moduloCabecalhoFinancas">Financeiro · Conjuntos de cotação</span>
            </header>

            <main className="conteudoFinancas">
                <section className="secaoFinancas">
                    {carregando && <p className="celulaVaziaFinancas">Carregando conjunto…</p>}
                    {!carregando && erro && !conjunto && (
                        <p className="avisoErroConjuntosCotacao" role="alert">{erro}</p>
                    )}

                    {!carregando && conjunto && (
                        <div className="conteudoConjuntoDetalhe">
                            <div className="cabecalhoTituloConjuntoDetalhe">
                                {renomeando ? (
                                    <input
                                        className="entradaFormularioFinancas entradaNomeConjuntoDetalhe"
                                        value={nomeEditado}
                                        autofocus
                                        onInput={(e) => setNomeEditado(e.currentTarget.value)}
                                        onBlur={salvarNomeConjunto}
                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        aria-label="Nome do conjunto"
                                    />
                                ) : (
                                    <h1 className="tituloConjuntoDetalhe">
                                        <button
                                            type="button"
                                            className="botaoRenomearConjuntoDetalhe"
                                            aria-label="Renomear conjunto"
                                            title="Renomear"
                                            onClick={() => setRenomeando(true)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            </svg>
                                        </button>
                                        Cotação de <span className="destaqueTituloConjuntoDetalhe">{conjunto.nome}</span>
                                    </h1>
                                )}
                                <p className="subtituloSecaoFinancas">
                                    SEMAC — compare diferentes variações deste conjunto, cada uma com sua própria tabela
                                </p>
                            </div>

                            {erro && <p className="avisoErroConjuntosCotacao" role="alert">{erro}</p>}

                            <div className="linhaVariacoesConjuntoDetalhe">
                                {conjunto.variacoes.map((variacao) => (
                                    <div className="cartaoVariacaoConjuntoDetalhe" key={variacao.id}>
                                        <div className="cabecalhoCartaoVariacaoConjuntoDetalhe">
                                            <h2 className="nomeVariacaoConjuntoDetalhe">{variacao.nome}</h2>
                                            <button
                                                type="button"
                                                className="botaoRemoverVariacaoConjuntoDetalhe"
                                                aria-label={`Remover variação ${variacao.nome}`}
                                                title="Remover variação"
                                                onClick={() => removerVariacao(variacao)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <dl className="listaMetricasVariacaoConjuntoDetalhe">
                                            <div className="metricaVariacaoConjuntoDetalhe">
                                                <dt>Total geral</dt>
                                                <dd className="valorTotalVariacaoConjuntoDetalhe">
                                                    {formatarCentavos(totalVariacao(variacao.id))}
                                                </dd>
                                            </div>
                                            <div className="metricaVariacaoConjuntoDetalhe">
                                                <dt>Mercadoria</dt>
                                                <dd>{formatarCentavos(totalMercadoriaVariacao(variacao.id))}</dd>
                                            </div>
                                            <div className="metricaVariacaoConjuntoDetalhe">
                                                <dt>
                                                    Frete
                                                    {fretesPorFornecedorVariacao(variacao.id).size > 0 && (
                                                        <span className="detalheFreteVariacaoConjuntoDetalhe">
                                                            {' '}· {fretesPorFornecedorVariacao(variacao.id).size} fornecedor
                                                            {fretesPorFornecedorVariacao(variacao.id).size === 1 ? '' : 'es'}
                                                        </span>
                                                    )}
                                                </dt>
                                                <dd>{formatarCentavos(freteVariacao(variacao.id))}</dd>
                                            </div>
                                            <div className="metricaVariacaoConjuntoDetalhe">
                                                <dt>Itens com quantidade</dt>
                                                <dd>{itensComQuantidade(variacao.id)}</dd>
                                            </div>
                                            <div className="metricaVariacaoConjuntoDetalhe">
                                                <dt>Quantidade total</dt>
                                                <dd>{quantidadeTotalVariacao(variacao.id)}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                ))}

                                <div className="cartaoAdicionarVariacaoConjuntoDetalhe">
                                    {criandoVariacao ? (
                                        <form onSubmit={adicionarVariacao} className="formNovaVariacaoConjuntoDetalhe">
                                            <input
                                                className="entradaFormularioFinancas"
                                                placeholder="Nome da variação"
                                                value={nomeNovaVariacao}
                                                autofocus
                                                onInput={(e) => setNomeNovaVariacao(e.currentTarget.value)}
                                                aria-label="Nome da nova variação"
                                            />
                                            <div className="acoesNovaVariacaoConjuntoDetalhe">
                                                <button
                                                    type="button"
                                                    className="botaoFantasmaFinancas"
                                                    onClick={() => {
                                                        setCriandoVariacao(false);
                                                        setNomeNovaVariacao('');
                                                    }}
                                                >
                                                    Cancelar
                                                </button>
                                                <button type="submit" className="botaoPrimarioFinancas">
                                                    Criar
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button
                                            type="button"
                                            className="botaoAbrirNovaVariacaoConjuntoDetalhe"
                                            onClick={() => setCriandoVariacao(true)}
                                        >
                                            + Adicionar variação
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="controlesGradeConjuntoDetalhe">
                                <button type="button" className="botaoFantasmaFinancas" onClick={zerarTodasQuantidades}>
                                    ↺ Zerar todas as quantidades
                                </button>
                                <button type="button" className="botaoFantasmaFinancas" onClick={excluirConjunto}>
                                    Excluir conjunto
                                </button>
                            </div>

                            <BuscaItensConjunto
                                cotacoes={cotacoes}
                                fornecedores={fornecedores}
                                selecionados={itensSelecionados}
                                aoAdicionar={adicionarItem}
                                aoRemover={removerItem}
                                aoLimpar={limparItens}
                            />

                            {conjunto.variacoes.length === 0 && (
                                <p className="celulaVaziaFinancas">
                                    Adicione uma variação acima pra começar a montar a tabela.
                                </p>
                            )}

                            <div className="linhaTabelasVariacaoConjuntoDetalhe">
                            {conjunto.variacoes.map((variacao) => (
                                <div className="blocoTabelaVariacaoConjuntoDetalhe" key={variacao.id}>
                                    <h3 className="tituloTabelaVariacaoConjuntoDetalhe">{variacao.nome}</h3>

                                    {produtosPorCategoria.length === 0 && (
                                        <p className="celulaVaziaFinancas">
                                            {cotacoes.length === 0
                                                ? 'Nenhum item cotado ainda — cadastre em Cotação primeiro.'
                                                : 'Nenhum item no conjunto ainda — busque acima para adicionar.'}
                                        </p>
                                    )}

                                    {produtosPorCategoria.map(([categoria, produtosCategoria]) => (
                                        <div className="grupoCategoriaVariacaoConjuntoDetalhe" key={categoria}>
                                            <div className="cabecalhoCategoriaVariacaoConjuntoDetalhe">
                                                <span className="tituloCategoriaVariacaoConjuntoDetalhe">
                                                    {categoria}
                                                    <span className="contagemCategoriaVariacaoConjuntoDetalhe">
                                                        {' '}· {produtosCategoria.length} opção{produtosCategoria.length === 1 ? '' : 'ões'}
                                                    </span>
                                                </span>
                                                <span className="subtotalCategoriaVariacaoConjuntoDetalhe">
                                                    {formatarCentavos(totalCategoriaVariacao(produtosCategoria, variacao.id))}
                                                </span>
                                            </div>

                                            {produtosCategoria.map((cotacao) => {
                                                const fornecedorId = fornecedorEscolhidoEm(variacao.id, cotacao);
                                                const valorUnitario = valorUnitarioEm(variacao.id, cotacao);
                                                const quantidade = quantidadeEm(variacao.id, cotacao.id);
                                                const fornecedorAtual = buscarFornecedor(fornecedorId);
                                                const freteFornecedorItem =
                                                    cotacao.fornecedores.find((linha) => linha.fornecedorId === fornecedorId)?.frete ?? 0;
                                                return (
                                                    <div className="itemVariacaoConjuntoDetalhe" key={cotacao.id}>
                                                        <div className="linhaProdutoItemVariacaoConjuntoDetalhe">
                                                            <span className="nomeProdutoItemVariacaoConjuntoDetalhe">{cotacao.descricao}</span>
                                                            <select
                                                                className="entradaFormularioFinancas seletorFornecedorItemVariacaoConjuntoDetalhe"
                                                                value={fornecedorId}
                                                                aria-label={`Fornecedor de ${cotacao.descricao} em ${variacao.nome}`}
                                                                onChange={(e) =>
                                                                    escolherFornecedor(variacao, cotacao, Number(e.currentTarget.value))
                                                                }
                                                            >
                                                                {cotacao.fornecedores.map((linha) => (
                                                                    <option key={linha.fornecedorId} value={linha.fornecedorId}>
                                                                        {buscarFornecedor(linha.fornecedorId)?.nome ?? '—'}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <span className="precoItemVariacaoConjuntoDetalhe">
                                                                {formatarCentavos(valorUnitario)}
                                                                <span className="unidadePrecoGradeConjuntoDetalhe"> / un</span>
                                                            </span>
                                                        </div>
                                                        {fornecedorAtual?.observacao && (
                                                            <span className="observacaoFornecedorGradeConjuntoDetalhe">
                                                                {fornecedorAtual.observacao}
                                                            </span>
                                                        )}
                                                        <div className="linhaQuantidadeItemVariacaoConjuntoDetalhe">
                                                            <label htmlFor={`qtd-${variacao.id}-${cotacao.id}`}>Quantidade</label>
                                                            <input
                                                                id={`qtd-${variacao.id}-${cotacao.id}`}
                                                                type="number"
                                                                min={0}
                                                                className="entradaFormularioFinancas entradaQuantidadeGradeConjuntoDetalhe"
                                                                value={quantidade || ''}
                                                                placeholder="0"
                                                                onInput={(e) =>
                                                                    definirQuantidade(
                                                                        variacao.id,
                                                                        cotacao,
                                                                        parseInt(e.currentTarget.value, 10) || 0,
                                                                    )
                                                                }
                                                                onBlur={() => persistirVariacao(variacao)}
                                                            />
                                                        </div>
                                                        <div className="linhaSubtotalItemVariacaoConjuntoDetalhe">
                                                            <span>Subtotal</span>
                                                            <strong>{formatarCentavos(valorUnitario * quantidade)}</strong>
                                                        </div>
                                                        {freteFornecedorItem > 0 && (
                                                            <span className="avisoFreteItemVariacaoConjuntoDetalhe">
                                                                Frete de {formatarCentavos(freteFornecedorItem)} — cobrado
                                                                uma vez por fornecedor, somado no total da variação
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

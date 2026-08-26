import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation, useParams } from 'wouter';
import { formatarCentavos } from '../utils/moeda.js';
import { listarCotacoes } from '../data/apiCotacoes.js';
import { listarFornecedores } from '../data/apiFornecedores.js';
import { buscarConjunto, renomearConjunto, excluirConjunto as excluirConjuntoApi } from '../data/apiConjuntos.js';
import { criarVariacao, atualizarVariacao, excluirVariacao as excluirVariacaoApi } from '../data/apiVariacoes.js';
import BuscaItemVariacao from './BuscaItemVariacao.jsx';
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

   Nenhuma tabela lista o catálogo inteiro de cotações: cada variação
   monta a PRÓPRIA lista pela busca do seu topo (BuscaItemVariacao), então
   "Coffee Cheio" pode ter itens que "Coffee Reduzido" nem enxerga. */
export default function ConjuntoDetalhe() {
    const { id } = useParams();
    const [, navegar] = useLocation();

    const [conjunto, setConjunto] = useState(null);
    const [cotacoes, setCotacoes] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    /* itensPorVariacao[variacaoId] = [cotacaoId] — a lista de itens é de
       cada variação, não do conjunto. A seleção não é persistida: ao
       recarregar, é remontada a partir dos itens que já têm quantidade
       naquela variação. */
    const [itensPorVariacao, setItensPorVariacao] = useState({});

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
                setItensPorVariacao(
                    Object.fromEntries(
                        conjuntoCarregado.variacoes.map((variacao) => [
                            variacao.id,
                            variacao.itens.filter((item) => item.quantidade > 0).map((item) => item.cotacaoId),
                        ]),
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

    /* Produtos (não linhas de fornecedor) de UMA variação, agrupados por
       categoria. Percorre o catálogo na ordem em que veio da API pra que
       duas variações que compartilham um item o mostrem na mesma posição
       relativa — facilita comparar as colunas lado a lado. */
    const produtosPorCategoriaDe = (variacaoId) => {
        const escolhidos = new Set(itensPorVariacao[variacaoId] ?? []);
        const porCategoria = new Map();
        for (const cotacao of cotacoes) {
            if (cotacao.fornecedores.length === 0) continue;
            if (!escolhidos.has(cotacao.id)) continue;
            const lista = porCategoria.get(cotacao.categoria) ?? [];
            lista.push(cotacao);
            porCategoria.set(cotacao.categoria, lista);
        }
        return Array.from(porCategoria.entries());
    };

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

    /* ── Itens de cada variação ─────────────────────────────────────
       Adicionar só amplia a tabela daquela variação. Remover precisa
       zerar a quantidade junto: senão o item continuaria somando no
       total sem aparecer na tabela. */

    const adicionarItem = (variacaoId, cotacao) =>
        setItensPorVariacao((atual) => {
            const lista = atual[variacaoId] ?? [];
            if (lista.includes(cotacao.id)) return atual;
            return { ...atual, [variacaoId]: [...lista, cotacao.id] };
        });

    const removerItem = (variacao, cotacao) => {
        const temQuantidade = quantidadeEm(variacao.id, cotacao.id) > 0;
        if (temQuantidade) {
            const aviso = `Remover "${cotacao.descricao}" de "${variacao.nome}"? A quantidade lançada será zerada.`;
            if (!window.confirm(aviso)) return;
        }
        const { [cotacao.id]: _removida, ...escolhasRestantes } = edicoes[variacao.id] ?? {};
        setEdicoes((atual) => ({ ...atual, [variacao.id]: escolhasRestantes }));
        setItensPorVariacao((atual) => ({
            ...atual,
            [variacao.id]: (atual[variacao.id] ?? []).filter((id) => id !== cotacao.id),
        }));
        if (temQuantidade) persistirMapa(variacao, escolhasRestantes);
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
            setItensPorVariacao((atual) => ({ ...atual, [nova.id]: [] }));
            setNomeNovaVariacao('');
            setCriandoVariacao(false);
        } catch (e) {
            setErro(e.message);
        }
    };

    /* Nome livre de colisão: "Coffee Cheio (cópia)", depois "(cópia 2)"… */
    const nomeParaCopia = (nomeBase) => {
        const existentes = new Set(conjunto.variacoes.map((variacao) => variacao.nome));
        let candidato = `${nomeBase} (cópia)`;
        let contador = 2;
        while (existentes.has(candidato)) {
            candidato = `${nomeBase} (cópia ${contador})`;
            contador += 1;
        }
        return candidato;
    };

    /* Duplica uma variação inteira: a lista de itens, o fornecedor
       escolhido em cada um e as quantidades. Como as variações de um
       conjunto costumam partir da mesma lista, é daqui que se monta a
       segunda: duplica e ajusta as quantidades.

       A lista local é copiada por inteiro — itens ainda sem quantidade
       vão junto, mesmo que o backend só guarde os que têm quantidade. */
    const duplicarVariacao = async (variacao) => {
        const escolhas = edicoes[variacao.id] ?? {};
        const itens = Object.entries(escolhas)
            .filter(([, escolha]) => escolha.quantidade > 0)
            .map(([cotacaoId, escolha]) => ({
                cotacaoId: Number(cotacaoId),
                fornecedorId: escolha.fornecedorId,
                quantidade: escolha.quantidade,
            }));
        try {
            const nova = await criarVariacao(conjunto.id, nomeParaCopia(variacao.nome));
            const criada = itens.length > 0 ? await atualizarVariacao(nova.id, nova.nome, itens) : nova;
            setConjunto((atual) => ({ ...atual, variacoes: [...atual.variacoes, criada] }));
            setEdicoes((atual) => ({ ...atual, [criada.id]: { ...escolhas } }));
            setItensPorVariacao((atual) => ({ ...atual, [criada.id]: [...(atual[variacao.id] ?? [])] }));
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
            setItensPorVariacao((atual) => {
                const { [variacao.id]: _removidos, ...resto } = atual;
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
                                            <div className="acoesCartaoVariacaoConjuntoDetalhe">
                                                <button
                                                    type="button"
                                                    className="botaoDuplicarVariacaoConjuntoDetalhe"
                                                    aria-label={`Duplicar variação ${variacao.nome}`}
                                                    title="Duplicar variação"
                                                    onClick={() => duplicarVariacao(variacao)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" />
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                </button>
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

                            {conjunto.variacoes.length === 0 && (
                                <p className="celulaVaziaFinancas">
                                    Adicione uma variação acima pra começar a montar a tabela.
                                </p>
                            )}

                            <div className="linhaTabelasVariacaoConjuntoDetalhe">
                            {conjunto.variacoes.map((variacao) => {
                                const produtosDaVariacao = produtosPorCategoriaDe(variacao.id);
                                return (
                                <div className="blocoTabelaVariacaoConjuntoDetalhe" key={variacao.id}>
                                    <h3 className="tituloTabelaVariacaoConjuntoDetalhe">{variacao.nome}</h3>

                                    <BuscaItemVariacao
                                        variacaoId={variacao.id}
                                        variacaoNome={variacao.nome}
                                        cotacoes={cotacoes}
                                        fornecedores={fornecedores}
                                        selecionados={itensPorVariacao[variacao.id] ?? []}
                                        aoAdicionar={(cotacao) => adicionarItem(variacao.id, cotacao)}
                                    />

                                    {produtosDaVariacao.length === 0 && (
                                        <p className="celulaVaziaFinancas">
                                            {cotacoes.length === 0
                                                ? 'Nenhum item cotado ainda — cadastre em Cotação primeiro.'
                                                : 'Nenhum item nesta variação — busque acima para adicionar.'}
                                        </p>
                                    )}

                                    {produtosDaVariacao.map(([categoria, produtosCategoria]) => (
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
                                                        <div className="cabecalhoItemVariacaoConjuntoDetalhe">
                                                            <span className="nomeProdutoItemVariacaoConjuntoDetalhe">{cotacao.descricao}</span>
                                                            <button
                                                                type="button"
                                                                className="botaoRemoverItemVariacaoConjuntoDetalhe"
                                                                aria-label={`Remover ${cotacao.descricao} de ${variacao.nome}`}
                                                                title="Remover desta variação"
                                                                onClick={() => removerItem(variacao, cotacao)}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                        <div className="linhaProdutoItemVariacaoConjuntoDetalhe">
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
                                );
                            })}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

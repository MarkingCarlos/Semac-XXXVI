import { useState } from 'preact/hooks';
import { useLocation } from 'wouter';
import PainelLateral from '../components/PainelLateral.jsx';
import CampoMoeda from '../components/CampoMoeda.jsx';
import { formatarCentavos, normalizar } from '../utils/moeda.js';
import { CATEGORIAS_COMPRA, CORES_CATEGORIA } from '../data/mockFinancas.js';
import { criarFornecedor } from '../data/apiFornecedores.js';
import { criarCotacao, atualizarCotacao, excluirCotacao as excluirCotacaoApi } from '../data/apiCotacoes.js';
import './cotacoes.css';

const criarNovoFornecedorVazio = () => ({ nome: '', contato: '', observacao: '' });

const criarLinhaFornecedorVazia = () => ({
    fornecedorId: '',
    valorUnitario: 0,
    frete: 0,
    novoFornecedor: criarNovoFornecedorVazio(),
});

/* Custo total de uma linha de fornecedor para a quantidade cotada: nem
   todo fornecedor cobra frete, mas quando cobra ele entra uma vez no
   fechamento do item. */
const custoTotalLinha = (linha, quantidade) =>
    linha.valorUnitario * quantidade + (linha.frete ?? 0);

const criarFormularioVazio = () => ({
    descricao: '',
    categoria: '',
    quantidade: 1,
    fornecedores: [criarLinhaFornecedorVazia()],
});

/* Cotações — itens sendo cotados, ainda não comprados. Cada item pode ter
   várias linhas de fornecedor com preços diferentes; o fornecedor de cada
   linha vem do cadastro central ou pode ser criado ali mesmo, como em
   Compras. Sem conversão automática para Compras — quando fechado, o
   registro é cadastrado manualmente lá e removido daqui. */
export default function Cotacoes({ cotacoes, setCotacoes, fornecedores, setFornecedores, carregando, erro }) {
    const [, navegar] = useLocation();
    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(criarFormularioVazio());
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [erroAcao, setErroAcao] = useState('');
    const [salvando, setSalvando] = useState(false);

    const cotacoesFiltradas = cotacoes.filter((cotacao) => {
        const bateTexto = !filtro.trim() || normalizar(cotacao.descricao).includes(normalizar(filtro));
        const bateCategoria = !filtroCategoria || cotacao.categoria === filtroCategoria;
        return bateTexto && bateCategoria;
    });

    const buscarFornecedor = (id) => fornecedores.find((fornecedor) => fornecedor.id === id);

    /* Melhor fornecedor é o de menor custo TOTAL (unitário × quantidade
       cotada + frete) — um unitário baixo com frete alto pode sair mais
       caro que o contrário. */
    const melhorLinha = (cotacao) =>
        cotacao.fornecedores.reduce(
            (menor, linha) =>
                !menor || custoTotalLinha(linha, cotacao.quantidade) < custoTotalLinha(menor, cotacao.quantidade)
                    ? linha
                    : menor,
            null,
        );

    const abrirNovaCotacao = () => {
        setFormulario(criarFormularioVazio());
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicaoCotacao = (cotacao) => {
        setFormulario({
            descricao: cotacao.descricao,
            categoria: cotacao.categoria,
            quantidade: cotacao.quantidade,
            fornecedores: cotacao.fornecedores.map((linha) => ({
                fornecedorId: String(linha.fornecedorId),
                valorUnitario: linha.valorUnitario,
                frete: linha.frete ?? 0,
                novoFornecedor: criarNovoFornecedorVazio(),
            })),
        });
        setIdEmEdicao(cotacao.id);
        setPainelAberto(true);
    };

    const atualizarLinha = (indice, mudanca) => {
        setFormulario({
            ...formulario,
            fornecedores: formulario.fornecedores.map((linha, i) =>
                i === indice ? { ...linha, ...mudanca } : linha,
            ),
        });
    };

    const adicionarLinhaFornecedor = () => {
        setFormulario({
            ...formulario,
            fornecedores: [...formulario.fornecedores, criarLinhaFornecedorVazia()],
        });
    };

    const removerLinhaFornecedor = (indice) => {
        setFormulario({
            ...formulario,
            fornecedores: formulario.fornecedores.filter((_, i) => i !== indice),
        });
    };

    /* Um fornecedor não pode ser escolhido em duas linhas do mesmo item. */
    const fornecedoresDisponiveisNaLinha = (indice) => {
        const escolhidosEmOutrasLinhas = formulario.fornecedores
            .filter((_, i) => i !== indice)
            .map((linha) => linha.fornecedorId);
        return fornecedores.filter((fornecedor) => !escolhidosEmOutrasLinhas.includes(String(fornecedor.id)));
    };

    const salvarCotacao = async (evento) => {
        evento.preventDefault();
        setErroAcao('');

        /* Linhas marcadas como "novo fornecedor" precisam ser persistidas
           na API primeiro, para usar o id retornado pelo backend. */
        const linhasResolvidas = [];
        const fornecedoresCriados = [];
        for (const linha of formulario.fornecedores) {
            if (linha.fornecedorId === 'novo') {
                try {
                    const criado = await criarFornecedor(linha.novoFornecedor);
                    fornecedoresCriados.push(criado);
                    linhasResolvidas.push({
                        fornecedorId: criado.id,
                        valorUnitario: linha.valorUnitario,
                        frete: linha.frete,
                    });
                } catch (e) {
                    setErroAcao(e.message);
                    return;
                }
            } else {
                linhasResolvidas.push({
                    fornecedorId: parseInt(linha.fornecedorId, 10),
                    valorUnitario: linha.valorUnitario,
                    frete: linha.frete,
                });
            }
        }
        if (fornecedoresCriados.length > 0) {
            setFornecedores([...fornecedores, ...fornecedoresCriados]);
        }

        const registro = {
            descricao: formulario.descricao,
            categoria: formulario.categoria,
            quantidade: formulario.quantidade,
            fornecedores: linhasResolvidas,
        };

        setSalvando(true);
        try {
            if (idEmEdicao !== null) {
                const atualizada = await atualizarCotacao(idEmEdicao, registro);
                setCotacoes(cotacoes.map((cotacao) => (cotacao.id === idEmEdicao ? atualizada : cotacao)));
            } else {
                const criada = await criarCotacao(registro);
                setCotacoes([criada, ...cotacoes]);
            }
            setPainelAberto(false);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const excluirCotacao = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErroAcao('');
        try {
            await excluirCotacaoApi(id);
            setCotacoes(cotacoes.filter((cotacao) => cotacao.id !== id));
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    return (
        <div className="conteudoCotacoesFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Cotação</h1>
                    <p className="subtituloSecaoFinancas">
                        Itens em cotação — ainda não comprados
                    </p>
                </div>
                <div className="controlesCabecalhoFinancas">
                    <div className="filtroTabelaFinancas">
                        <span className="iconeFiltroFinancas">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </span>
                        <input
                            className="entradaFiltroFinancas"
                            type="search"
                            placeholder="Filtrar por produto…"
                            value={filtro}
                            onInput={(e) => setFiltro(e.currentTarget.value)}
                            aria-label="Filtrar cotações por produto"
                        />
                    </div>
                    <select
                        className="selectFiltroFinancas"
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.currentTarget.value)}
                        aria-label="Filtrar por categoria"
                    >
                        <option value="">Todas as categorias</option>
                        {CATEGORIAS_COMPRA.map((categoria) => (
                            <option key={categoria} value={categoria}>{categoria}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="botaoFantasmaFinancas"
                        onClick={() => navegar('/financeiro/conjuntos')}
                    >
                        Conjuntos
                    </button>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovaCotacao}>
                        + Nova cotação
                    </button>
                </div>
            </header>

            {(erro || erroAcao) && (
                <p className="avisoErroCotacoes" role="alert">{erro || erroAcao}</p>
            )}

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Fornecedores e preços</th>
                            <th>Qtd cotada</th>
                            <th>Melhor custo total</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={5} className="celulaVaziaFinancas">
                                    Carregando cotações…
                                </td>
                            </tr>
                        )}
                        {!carregando && cotacoesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan={5} className="celulaVaziaFinancas">
                                    {filtro.trim() || filtroCategoria
                                        ? 'Nenhuma cotação encontrada para esse filtro.'
                                        : 'Nenhum item em cotação ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && cotacoesFiltradas.map((cotacao) => {
                            const linhaMelhorPreco = melhorLinha(cotacao);
                            return (
                                <tr key={cotacao.id}>
                                    <td>
                                        <div className="celulaProdutoCotacoes">
                                            <span className="nomeProdutoCotacoes">{cotacao.descricao}</span>
                                            {cotacao.categoria && (() => {
                                                const cor = CORES_CATEGORIA[cotacao.categoria] ?? CORES_CATEGORIA['Outros'];
                                                return (
                                                    <span
                                                        className="seloCategoriaCotacoes"
                                                        style={{ background: cor.bg, color: cor.color }}
                                                    >
                                                        {cotacao.categoria}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td>
                                        <ul className="listaFornecedoresPrecosCotacoes">
                                            {cotacao.fornecedores.map((linha) => {
                                                const fornecedor = buscarFornecedor(linha.fornecedorId);
                                                const ehMelhorPreco = linha === linhaMelhorPreco;
                                                return (
                                                    <li
                                                        key={linha.id}
                                                        className={
                                                            ehMelhorPreco
                                                                ? 'itemFornecedorPrecoCotacoes itemMelhorPrecoCotacoes'
                                                                : 'itemFornecedorPrecoCotacoes'
                                                        }
                                                    >
                                                        <span className="nomeFornecedorPrecoCotacoes">
                                                            {fornecedor ? fornecedor.nome : '—'}
                                                        </span>
                                                        <span className="valorFornecedorPrecoCotacoes">
                                                            {formatarCentavos(linha.valorUnitario)}
                                                            {linha.frete > 0 && (
                                                                <span className="freteFornecedorPrecoCotacoes">
                                                                    {' '}+ frete {formatarCentavos(linha.frete)}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </td>
                                    <td className="celulaQuantidadeCotacoes">{cotacao.quantidade}</td>
                                    <td className="celulaValorFinancas celulaValorMelhorPrecoCotacoes">
                                        {linhaMelhorPreco ? (
                                            <>
                                                {formatarCentavos(custoTotalLinha(linhaMelhorPreco, cotacao.quantidade))}
                                                <span className="detalheMelhorPrecoCotacoes">
                                                    {formatarCentavos(linhaMelhorPreco.valorUnitario)} / un
                                                    {linhaMelhorPreco.frete > 0
                                                        ? ` + frete ${formatarCentavos(linhaMelhorPreco.frete)}`
                                                        : ' · sem frete'}
                                                </span>
                                            </>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <div className="grupoAcoesLinhaFinancas">
                                            <button
                                                type="button"
                                                className="botaoAcaoLinhaFinancas"
                                                aria-label={`Editar ${cotacao.descricao}`}
                                                title="Editar"
                                                onClick={() => abrirEdicaoCotacao(cotacao)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                className={
                                                    idConfirmandoExclusao === cotacao.id
                                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                        : 'botaoAcaoLinhaFinancas'
                                                }
                                                aria-label={
                                                    idConfirmandoExclusao === cotacao.id
                                                        ? `Confirmar exclusão de ${cotacao.descricao}`
                                                        : `Excluir ${cotacao.descricao}`
                                                }
                                                title={
                                                    idConfirmandoExclusao === cotacao.id
                                                        ? 'Clique novamente para confirmar'
                                                        : 'Excluir'
                                                }
                                                onClick={() => excluirCotacao(cotacao.id)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <PainelLateral
                aberto={painelAberto}
                titulo={idEmEdicao !== null ? 'Editar cotação' : 'Nova cotação'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarCotacao}>
                    <h3 className="divisorFormularioFinancas">Produto</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDescricaoCotacao">
                            Produto *
                        </label>
                        <input
                            id="campoDescricaoCotacao"
                            className="entradaFormularioFinancas"
                            required
                            placeholder="Ex: camiseta, comida, brinde…"
                            value={formulario.descricao}
                            onInput={(e) =>
                                setFormulario({ ...formulario, descricao: e.currentTarget.value })
                            }
                        />
                    </div>

                    <div className="linhaDuplaFormularioFinancas">
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoCategoriaCotacao">
                                Categoria *
                            </label>
                            <select
                                id="campoCategoriaCotacao"
                                className="entradaFormularioFinancas"
                                required
                                value={formulario.categoria}
                                onChange={(e) =>
                                    setFormulario({ ...formulario, categoria: e.currentTarget.value })
                                }
                            >
                                <option value="" disabled>Selecione a categoria</option>
                                {CATEGORIAS_COMPRA.map((categoria) => (
                                    <option key={categoria} value={categoria}>{categoria}</option>
                                ))}
                            </select>
                        </div>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoQuantidadeCotacao">
                                Quantidade cotada *
                            </label>
                            <input
                                id="campoQuantidadeCotacao"
                                className="entradaFormularioFinancas"
                                type="number"
                                min={1}
                                required
                                value={formulario.quantidade}
                                onInput={(e) =>
                                    setFormulario({
                                        ...formulario,
                                        quantidade: parseInt(e.currentTarget.value, 10) || 0,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <h3 className="divisorFormularioFinancas">Fornecedores e preços</h3>

                    {formulario.fornecedores.map((linha, indice) => {
                        const cadastrandoFornecedorNaLinha = linha.fornecedorId === 'novo';
                        return (
                            <div className="linhaFornecedorFormCotacao" key={indice}>
                                <div className="camposLinhaFornecedorFormCotacao">
                                    <div className="campoFormularioFinancas">
                                        <label
                                            className="rotuloCampoFinancas"
                                            htmlFor={`campoFornecedorCotacao-${indice}`}
                                        >
                                            Fornecedor *
                                        </label>
                                        <select
                                            id={`campoFornecedorCotacao-${indice}`}
                                            className="entradaFormularioFinancas"
                                            required
                                            value={linha.fornecedorId}
                                            onChange={(e) =>
                                                atualizarLinha(indice, { fornecedorId: e.currentTarget.value })
                                            }
                                        >
                                            <option value="" disabled>
                                                Selecione o fornecedor
                                            </option>
                                            {fornecedoresDisponiveisNaLinha(indice).map((fornecedor) => (
                                                <option key={fornecedor.id} value={String(fornecedor.id)}>
                                                    {fornecedor.nome}
                                                </option>
                                            ))}
                                            <option value="novo">+ Cadastrar novo fornecedor</option>
                                        </select>
                                    </div>
                                    <div className="campoFormularioFinancas">
                                        <label
                                            className="rotuloCampoFinancas"
                                            htmlFor={`campoValorUnitarioCotacao-${indice}`}
                                        >
                                            Valor unitário *
                                        </label>
                                        <CampoMoeda
                                            id={`campoValorUnitarioCotacao-${indice}`}
                                            valorCentavos={linha.valorUnitario}
                                            aoMudar={(centavos) => atualizarLinha(indice, { valorUnitario: centavos })}
                                        />
                                    </div>
                                    <div className="campoFormularioFinancas">
                                        <label
                                            className="rotuloCampoFinancas"
                                            htmlFor={`campoFreteCotacao-${indice}`}
                                        >
                                            Frete
                                            <span className="dicaRotuloCampoFinancas"> (deixe zerado se não cobra)</span>
                                        </label>
                                        <CampoMoeda
                                            id={`campoFreteCotacao-${indice}`}
                                            valorCentavos={linha.frete}
                                            aoMudar={(centavos) => atualizarLinha(indice, { frete: centavos })}
                                        />
                                    </div>
                                    {formulario.fornecedores.length > 1 && (
                                        <button
                                            type="button"
                                            className="botaoAcaoLinhaFinancas botaoRemoverLinhaFornecedorCotacao"
                                            aria-label="Remover este fornecedor"
                                            title="Remover"
                                            onClick={() => removerLinhaFornecedor(indice)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Cadastro de fornecedor inline — sem sair da cotação */}
                                {cadastrandoFornecedorNaLinha && (
                                    <div className="blocoNovoFornecedorCotacao">
                                        <div className="campoFormularioFinancas">
                                            <label
                                                className="rotuloCampoFinancas"
                                                htmlFor={`campoNovoFornecedorNomeCotacao-${indice}`}
                                            >
                                                Nome do fornecedor *
                                            </label>
                                            <input
                                                id={`campoNovoFornecedorNomeCotacao-${indice}`}
                                                className="entradaFormularioFinancas"
                                                required
                                                value={linha.novoFornecedor.nome}
                                                onInput={(e) =>
                                                    atualizarLinha(indice, {
                                                        novoFornecedor: { ...linha.novoFornecedor, nome: e.currentTarget.value },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="campoFormularioFinancas">
                                            <label
                                                className="rotuloCampoFinancas"
                                                htmlFor={`campoNovoFornecedorContatoCotacao-${indice}`}
                                            >
                                                Contato
                                            </label>
                                            <input
                                                id={`campoNovoFornecedorContatoCotacao-${indice}`}
                                                className="entradaFormularioFinancas"
                                                placeholder="Telefone ou e-mail"
                                                value={linha.novoFornecedor.contato}
                                                onInput={(e) =>
                                                    atualizarLinha(indice, {
                                                        novoFornecedor: { ...linha.novoFornecedor, contato: e.currentTarget.value },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="campoFormularioFinancas">
                                            <label
                                                className="rotuloCampoFinancas"
                                                htmlFor={`campoNovoFornecedorObservacaoCotacao-${indice}`}
                                            >
                                                Observação
                                            </label>
                                            <textarea
                                                id={`campoNovoFornecedorObservacaoCotacao-${indice}`}
                                                className="entradaFormularioFinancas areaTextoFinancas"
                                                rows={2}
                                                value={linha.novoFornecedor.observacao}
                                                onInput={(e) =>
                                                    atualizarLinha(indice, {
                                                        novoFornecedor: { ...linha.novoFornecedor, observacao: e.currentTarget.value },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <button
                        type="button"
                        className="botaoFantasmaFinancas botaoAdicionarFornecedorCotacao"
                        onClick={adicionarLinhaFornecedor}
                    >
                        + Adicionar fornecedor
                    </button>

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvando}>
                            {salvando
                                ? 'Salvando…'
                                : idEmEdicao !== null
                                    ? 'Salvar alterações'
                                    : 'Registrar cotação'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

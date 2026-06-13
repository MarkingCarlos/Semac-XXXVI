import { useState } from 'preact/hooks';
import PainelLateral from '../components/PainelLateral.jsx';
import CampoMoeda from '../components/CampoMoeda.jsx';
import { formatarCentavos, formatarData, normalizar } from '../utils/moeda.js';
import { CATEGORIAS_COMPRA, CORES_CATEGORIA } from '../data/mockFinancas.js';
import './compras.css';

const FORMULARIO_VAZIO = {
    descricao: '',
    categoria: '',
    fornecedorId: '',
    valorUnitario: 0,
    quantidade: 1,
};

const NOVO_FORNECEDOR_VAZIO = {
    nome: '',
    contato: '',
    observacao: '',
};

/* Compras — saídas financeiras. O fornecedor é selecionado do cadastro
   central (FK fornecedor_id); também é possível cadastrar um novo
   fornecedor sem sair do formulário da compra. */
export default function Compras({ compras, setCompras, fornecedores, setFornecedores }) {
    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [novoFornecedor, setNovoFornecedor] = useState(NOVO_FORNECEDOR_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');

    const cadastrandoFornecedor = formulario.fornecedorId === 'novo';
    const valorTotal = formulario.valorUnitario * (formulario.quantidade || 0);
    const totalSaidas = compras.reduce((soma, compra) => soma + compra.valorTotal, 0);
    const comprasFiltradas = compras.filter((compra) => {
        const bateTexto = !filtro.trim() || normalizar(compra.descricao).includes(normalizar(filtro));
        const bateCategoria = !filtroCategoria || compra.categoria === filtroCategoria;
        return bateTexto && bateCategoria;
    });

    const buscarFornecedor = (id) => fornecedores.find((fornecedor) => fornecedor.id === id);

    const abrirNovaCompra = () => {
        setFormulario(FORMULARIO_VAZIO);
        setNovoFornecedor(NOVO_FORNECEDOR_VAZIO);
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicaoCompra = (compra) => {
        setFormulario({ ...compra });
        setNovoFornecedor(NOVO_FORNECEDOR_VAZIO);
        setIdEmEdicao(compra.id);
        setPainelAberto(true);
    };

    const salvarCompra = (evento) => {
        evento.preventDefault();

        /* Se o usuário optou por cadastrar fornecedor na hora,
           cria o registro primeiro e usa o id recém-gerado */
        let fornecedorId = formulario.fornecedorId;
        if (cadastrandoFornecedor) {
            const proximoIdFornecedor = Math.max(0, ...fornecedores.map((fornecedor) => fornecedor.id)) + 1;
            setFornecedores([...fornecedores, { ...novoFornecedor, id: proximoIdFornecedor }]);
            fornecedorId = proximoIdFornecedor;
        } else {
            fornecedorId = parseInt(fornecedorId, 10);
        }

        const registro = {
            descricao: formulario.descricao,
            categoria: formulario.categoria,
            fornecedorId,
            valorUnitario: formulario.valorUnitario,
            quantidade: formulario.quantidade,
            valorTotal,
        };

        if (idEmEdicao !== null) {
            setCompras(
                compras.map((compra) =>
                    compra.id === idEmEdicao
                        ? { ...registro, id: idEmEdicao, dataCompra: compra.dataCompra }
                        : compra,
                ),
            );
        } else {
            const proximoId = Math.max(0, ...compras.map((compra) => compra.id)) + 1;
            setCompras([
                ...compras,
                { ...registro, id: proximoId, dataCompra: new Date().toISOString() },
            ]);
        }
        setPainelAberto(false);
    };

    const excluirCompra = (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setCompras(compras.filter((compra) => compra.id !== id));
        setIdConfirmandoExclusao(null);
    };

    return (
        <div className="conteudoComprasFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Compras</h1>
                    <p className="subtituloSecaoFinancas">
                        Saídas registradas — total de {formatarCentavos(totalSaidas)}
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
                            aria-label="Filtrar compras por produto"
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
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovaCompra}>
                        + Nova compra
                    </button>
                </div>
            </header>

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Fornecedor</th>
                            <th>Valor unit.</th>
                            <th>Qtd</th>
                            <th>Total</th>
                            <th>Data</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {comprasFiltradas.length === 0 && (
                            <tr>
                                <td colSpan={7} className="celulaVaziaFinancas">
                                    {filtro.trim() || filtroCategoria
                                        ? 'Nenhuma compra encontrada para esse filtro.'
                                        : 'Nenhuma compra registrada ainda.'}
                                </td>
                            </tr>
                        )}
                        {comprasFiltradas.map((compra) => {
                            const fornecedor = buscarFornecedor(compra.fornecedorId);
                            return (
                                <tr key={compra.id}>
                                    <td>
                                        <div className="celulaProdutoCompras">
                                            <span className="nomeProdutoCompras">{compra.descricao}</span>
                                            {compra.categoria && (() => {
                                                const cor = CORES_CATEGORIA[compra.categoria] ?? CORES_CATEGORIA['Outros'];
                                                return (
                                                    <span
                                                        className="seloCategoriaCompras"
                                                        style={{ background: cor.bg, color: cor.color }}
                                                    >
                                                        {compra.categoria}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="celulaFornecedorCompras">
                                            <span className="nomeFornecedorCompras">
                                                {fornecedor ? fornecedor.nome : '—'}
                                            </span>
                                            {fornecedor?.contato && (
                                                <span className="contatoFornecedorCompras">
                                                    {fornecedor.contato}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="celulaValorFinancas">
                                        {formatarCentavos(compra.valorUnitario)}
                                    </td>
                                    <td className="celulaQuantidadeCompras">{compra.quantidade}</td>
                                    <td className="celulaValorFinancas celulaValorSaidaCompras">
                                        {formatarCentavos(compra.valorTotal)}
                                    </td>
                                    <td className="celulaDataFinancas">{formatarData(compra.dataCompra)}</td>
                                    <td>
                                        <div className="grupoAcoesLinhaFinancas">
                                            <button
                                                type="button"
                                                className="botaoAcaoLinhaFinancas"
                                                aria-label={`Editar ${compra.descricao}`}
                                                title="Editar"
                                                onClick={() => abrirEdicaoCompra(compra)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                className={
                                                    idConfirmandoExclusao === compra.id
                                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                        : 'botaoAcaoLinhaFinancas'
                                                }
                                                aria-label={
                                                    idConfirmandoExclusao === compra.id
                                                        ? `Confirmar exclusão de ${compra.descricao}`
                                                        : `Excluir ${compra.descricao}`
                                                }
                                                title={
                                                    idConfirmandoExclusao === compra.id
                                                        ? 'Clique novamente para confirmar'
                                                        : 'Excluir'
                                                }
                                                onClick={() => excluirCompra(compra.id)}
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
                titulo={idEmEdicao !== null ? 'Editar compra' : 'Nova compra'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarCompra}>
                    <h3 className="divisorFormularioFinancas">Produto</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDescricaoCompra">
                            Produto *
                        </label>
                        <input
                            id="campoDescricaoCompra"
                            className="entradaFormularioFinancas"
                            required
                            placeholder="Ex: camiseta, chaveiro, refrigerante…"
                            value={formulario.descricao}
                            onInput={(e) =>
                                setFormulario({ ...formulario, descricao: e.currentTarget.value })
                            }
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoCategoriaCompra">
                            Categoria *
                        </label>
                        <select
                            id="campoCategoriaCompra"
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

                    <div className="linhaDuplaFormularioFinancas">
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoValorUnitarioCompra">
                                Valor unitário *
                            </label>
                            <CampoMoeda
                                id="campoValorUnitarioCompra"
                                valorCentavos={formulario.valorUnitario}
                                aoMudar={(centavos) =>
                                    setFormulario({ ...formulario, valorUnitario: centavos })
                                }
                            />
                        </div>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoQuantidadeCompra">
                                Quantidade *
                            </label>
                            <input
                                id="campoQuantidadeCompra"
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

                    <div className="blocoValorFinalFinancas">
                        <span className="rotuloCampoFinancas">Valor total</span>
                        <strong className="valorCalculadoFinancas">{formatarCentavos(valorTotal)}</strong>
                    </div>

                    <h3 className="divisorFormularioFinancas">Fornecedor</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoFornecedorCompra">
                            Fornecedor *
                        </label>
                        <select
                            id="campoFornecedorCompra"
                            className="entradaFormularioFinancas"
                            required
                            value={String(formulario.fornecedorId)}
                            onChange={(e) =>
                                setFormulario({ ...formulario, fornecedorId: e.currentTarget.value })
                            }
                        >
                            <option value="" disabled>
                                Selecione o fornecedor
                            </option>
                            {fornecedores.map((fornecedor) => (
                                <option key={fornecedor.id} value={String(fornecedor.id)}>
                                    {fornecedor.nome}
                                </option>
                            ))}
                            <option value="novo">+ Cadastrar novo fornecedor</option>
                        </select>
                    </div>

                    {/* Cadastro de fornecedor inline — sem sair da compra */}
                    {cadastrandoFornecedor && (
                        <div className="blocoNovoFornecedorCompras">
                            <div className="campoFormularioFinancas">
                                <label className="rotuloCampoFinancas" htmlFor="campoNovoFornecedorNome">
                                    Nome do fornecedor *
                                </label>
                                <input
                                    id="campoNovoFornecedorNome"
                                    className="entradaFormularioFinancas"
                                    required
                                    value={novoFornecedor.nome}
                                    onInput={(e) =>
                                        setNovoFornecedor({ ...novoFornecedor, nome: e.currentTarget.value })
                                    }
                                />
                            </div>
                            <div className="campoFormularioFinancas">
                                <label className="rotuloCampoFinancas" htmlFor="campoNovoFornecedorContato">
                                    Contato
                                </label>
                                <input
                                    id="campoNovoFornecedorContato"
                                    className="entradaFormularioFinancas"
                                    placeholder="Telefone ou e-mail"
                                    value={novoFornecedor.contato}
                                    onInput={(e) =>
                                        setNovoFornecedor({
                                            ...novoFornecedor,
                                            contato: e.currentTarget.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="campoFormularioFinancas">
                                <label
                                    className="rotuloCampoFinancas"
                                    htmlFor="campoNovoFornecedorObservacao"
                                >
                                    Observação
                                </label>
                                <textarea
                                    id="campoNovoFornecedorObservacao"
                                    className="entradaFormularioFinancas areaTextoFinancas"
                                    rows={2}
                                    value={novoFornecedor.observacao}
                                    onInput={(e) =>
                                        setNovoFornecedor({
                                            ...novoFornecedor,
                                            observacao: e.currentTarget.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    )}

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas">
                            {idEmEdicao !== null ? 'Salvar alterações' : 'Registrar compra'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

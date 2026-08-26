import { useState } from 'preact/hooks';
import PainelLateral from '../components/PainelLateral.jsx';
import { normalizar } from '../utils/moeda.js';
import {
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor as excluirFornecedorApi,
} from '../data/apiFornecedores.js';
import './fornecedores.css';

const FORMULARIO_VAZIO = {
    nome: '',
    contato: '',
    observacao: '',
};

/* Fornecedores — cadastro central. Compras e cotações referenciam
   fornecedores por id (FK fornecedor_id no banco); por isso um fornecedor
   com compras ou cotações vinculadas não pode ser excluído. */
export default function Fornecedores({ fornecedores, setFornecedores, compras, cotacoes, carregando, erro }) {
    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erroAcao, setErroAcao] = useState('');

    const contarComprasVinculadas = (fornecedorId) =>
        compras.filter((compra) => compra.fornecedorId === fornecedorId).length;

    const contarCotacoesVinculadas = (fornecedorId) =>
        cotacoes.filter((cotacao) =>
            cotacao.fornecedores.some((linha) => linha.fornecedorId === fornecedorId),
        ).length;

    const fornecedoresFiltrados = filtro.trim()
        ? fornecedores.filter((fornecedor) => normalizar(fornecedor.nome).includes(normalizar(filtro)))
        : fornecedores;

    const abrirNovoFornecedor = () => {
        setFormulario(FORMULARIO_VAZIO);
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicaoFornecedor = (fornecedor) => {
        setFormulario({ ...fornecedor });
        setIdEmEdicao(fornecedor.id);
        setPainelAberto(true);
    };

    const salvarFornecedor = async (evento) => {
        evento.preventDefault();

        setSalvando(true);
        setErroAcao('');
        try {
            if (idEmEdicao !== null) {
                const atualizado = await atualizarFornecedor(idEmEdicao, formulario);
                setFornecedores(
                    fornecedores.map((fornecedor) =>
                        fornecedor.id === idEmEdicao ? atualizado : fornecedor,
                    ),
                );
            } else {
                const criado = await criarFornecedor(formulario);
                setFornecedores([...fornecedores, criado]);
            }
            setPainelAberto(false);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const excluirFornecedor = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErroAcao('');
        try {
            await excluirFornecedorApi(id);
            setFornecedores(fornecedores.filter((fornecedor) => fornecedor.id !== id));
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    return (
        <div className="conteudoFornecedoresFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Fornecedores</h1>
                    <p className="subtituloSecaoFinancas">
                        Cadastro central — referenciados pelas compras
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
                            placeholder="Filtrar por nome…"
                            value={filtro}
                            onInput={(e) => setFiltro(e.currentTarget.value)}
                            aria-label="Filtrar fornecedores por nome"
                        />
                    </div>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoFornecedor}>
                        + Novo fornecedor
                    </button>
                </div>
            </header>

            {(erro || erroAcao) && (
                <p className="avisoErroFornecedores" role="alert">{erro || erroAcao}</p>
            )}

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Contato</th>
                            <th>Observação</th>
                            <th>Compras</th>
                            <th>Cotações</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={6} className="celulaVaziaFinancas">
                                    Carregando fornecedores…
                                </td>
                            </tr>
                        )}
                        {!carregando && fornecedoresFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={6} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum fornecedor encontrado para esse filtro.'
                                        : 'Nenhum fornecedor cadastrado ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && fornecedoresFiltrados.map((fornecedor) => {
                            const comprasVinculadas = contarComprasVinculadas(fornecedor.id);
                            const cotacoesVinculadas = contarCotacoesVinculadas(fornecedor.id);
                            const possuiVinculo = comprasVinculadas > 0 || cotacoesVinculadas > 0;
                            return (
                                <tr key={fornecedor.id}>
                                    <td>
                                        <span className="nomeFornecedorTabelaFornecedores">
                                            {fornecedor.nome}
                                        </span>
                                    </td>
                                    <td className="celulaContatoFornecedores">
                                        {fornecedor.contato || '—'}
                                    </td>
                                    <td className="celulaObservacaoFornecedores">
                                        {fornecedor.observacao || '—'}
                                    </td>
                                    <td className="celulaContagemFornecedores">{comprasVinculadas}</td>
                                    <td className="celulaContagemFornecedores">{cotacoesVinculadas}</td>
                                    <td>
                                        <div className="grupoAcoesLinhaFinancas">
                                            <button
                                                type="button"
                                                className="botaoAcaoLinhaFinancas"
                                                aria-label={`Editar ${fornecedor.nome}`}
                                                title="Editar"
                                                onClick={() => abrirEdicaoFornecedor(fornecedor)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                className={
                                                    idConfirmandoExclusao === fornecedor.id
                                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                        : 'botaoAcaoLinhaFinancas'
                                                }
                                                disabled={possuiVinculo}
                                                aria-label={
                                                    possuiVinculo
                                                        ? `${fornecedor.nome} possui compras ou cotações vinculadas e não pode ser excluído`
                                                        : idConfirmandoExclusao === fornecedor.id
                                                          ? `Confirmar exclusão de ${fornecedor.nome}`
                                                          : `Excluir ${fornecedor.nome}`
                                                }
                                                title={
                                                    possuiVinculo
                                                        ? 'Possui compras ou cotações vinculadas — não pode ser excluído'
                                                        : idConfirmandoExclusao === fornecedor.id
                                                          ? 'Clique novamente para confirmar'
                                                          : 'Excluir'
                                                }
                                                onClick={() => excluirFornecedor(fornecedor.id)}
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
                titulo={idEmEdicao !== null ? 'Editar fornecedor' : 'Novo fornecedor'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarFornecedor}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeFornecedor">
                            Nome *
                        </label>
                        <input
                            id="campoNomeFornecedor"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.nome}
                            onInput={(e) => setFormulario({ ...formulario, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoContatoFornecedor">
                            Contato
                        </label>
                        <input
                            id="campoContatoFornecedor"
                            className="entradaFormularioFinancas"
                            placeholder="Telefone ou e-mail"
                            value={formulario.contato}
                            onInput={(e) =>
                                setFormulario({ ...formulario, contato: e.currentTarget.value })
                            }
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoObservacaoFornecedor">
                            Observação
                        </label>
                        <textarea
                            id="campoObservacaoFornecedor"
                            className="entradaFormularioFinancas areaTextoFinancas"
                            rows={3}
                            value={formulario.observacao}
                            onInput={(e) =>
                                setFormulario({ ...formulario, observacao: e.currentTarget.value })
                            }
                        />
                    </div>

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
                                    : 'Adicionar fornecedor'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

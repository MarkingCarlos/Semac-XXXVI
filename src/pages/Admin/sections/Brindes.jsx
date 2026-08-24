import { useState, useEffect } from 'preact/hooks';
import PainelLateral from '../../Financas/components/PainelLateral.jsx';
import { normalizar } from '../../Financas/utils/moeda.js';
import { listarBrindes, criarBrinde, atualizarBrinde, excluirBrinde } from '../data/apiBrindes.js';

/* Brindes — tabela `brinde` (nome, quantidade). Usados na tela /sorteio:
   `quantidadeEntregue` vem calculada pelo backend (sorteios já
   confirmados para o brinde) e não é editável aqui, só exibida. */

const FORMULARIO_VAZIO = { nome: '', quantidade: '' };

export default function Brindes() {
    const [brindes, setBrindes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        let ativo = true;
        listarBrindes()
            .then((lista) => { if (ativo) setBrindes(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    const brindesFiltrados = filtro.trim()
        ? brindes.filter((brinde) => normalizar(brinde.nome).includes(normalizar(filtro)))
        : brindes;

    const abrirNovoBrinde = () => {
        setFormulario(FORMULARIO_VAZIO);
        setIdEmEdicao(null);
        setErro('');
        setPainelAberto(true);
    };

    const abrirEdicaoBrinde = (brinde) => {
        setFormulario({ nome: brinde.nome, quantidade: brinde.quantidade });
        setIdEmEdicao(brinde.id);
        setErro('');
        setPainelAberto(true);
    };

    const salvarBrinde = async (evento) => {
        evento.preventDefault();
        setSalvando(true);
        setErro('');
        try {
            if (idEmEdicao !== null) {
                const atualizado = await atualizarBrinde(idEmEdicao, formulario);
                setBrindes(brindes.map((b) => (b.id === idEmEdicao ? atualizado : b)));
            } else {
                const criado = await criarBrinde(formulario);
                setBrindes([...brindes, criado]);
            }
            setPainelAberto(false);
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const removerBrinde = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErro('');
        try {
            await excluirBrinde(id);
            setBrindes(brindes.filter((b) => b.id !== id));
        } catch (e) {
            setErro(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    return (
        <div className="conteudoDoacoesAdmin">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Brindes</h1>
                    <p className="subtituloSecaoFinancas">
                        Prêmios disponíveis para o sorteio — nome e quantidade em estoque
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
                            placeholder="Filtrar por brinde…"
                            value={filtro}
                            onInput={(e) => setFiltro(e.currentTarget.value)}
                            aria-label="Filtrar brindes por nome"
                        />
                    </div>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoBrinde}>
                        + Novo brinde
                    </button>
                </div>
            </header>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Brinde</th>
                            <th>Quantidade</th>
                            <th>Entregues</th>
                            <th>Restante</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={5} className="celulaVaziaFinancas">Carregando brindes…</td>
                            </tr>
                        )}
                        {!carregando && brindesFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={5} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum brinde encontrado para esse filtro.'
                                        : 'Nenhum brinde cadastrado ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && brindesFiltrados.map((brinde) => {
                            const restante = brinde.quantidade - brinde.quantidadeEntregue;
                            return (
                                <tr key={brinde.id}>
                                    <td><span className="nomeDoadorDoacoes">{brinde.nome}</span></td>
                                    <td>{brinde.quantidade}</td>
                                    <td>{brinde.quantidadeEntregue}</td>
                                    <td>{restante > 0 ? restante : 'Esgotado'}</td>
                                    <td>
                                        <div className="grupoAcoesLinhaFinancas">
                                            <button
                                                type="button"
                                                className="botaoAcaoLinhaFinancas"
                                                aria-label={`Editar brinde ${brinde.nome}`}
                                                title="Editar"
                                                onClick={() => abrirEdicaoBrinde(brinde)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                className={
                                                    idConfirmandoExclusao === brinde.id
                                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                        : 'botaoAcaoLinhaFinancas'
                                                }
                                                aria-label={
                                                    idConfirmandoExclusao === brinde.id
                                                        ? `Confirmar exclusão do brinde ${brinde.nome}`
                                                        : `Excluir brinde ${brinde.nome}`
                                                }
                                                title={
                                                    idConfirmandoExclusao === brinde.id
                                                        ? 'Clique novamente para confirmar'
                                                        : 'Excluir'
                                                }
                                                onClick={() => removerBrinde(brinde.id)}
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
                titulo={idEmEdicao !== null ? 'Editar brinde' : 'Novo brinde'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarBrinde}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeBrinde">Nome *</label>
                        <input
                            id="campoNomeBrinde"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.nome}
                            onInput={(e) => setFormulario({ ...formulario, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoQuantidadeBrinde">Quantidade *</label>
                        <input
                            id="campoQuantidadeBrinde"
                            className="entradaFormularioFinancas"
                            type="number"
                            min="1"
                            required
                            value={formulario.quantidade}
                            onInput={(e) => setFormulario({ ...formulario, quantidade: e.currentTarget.value })}
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
                                    : 'Adicionar brinde'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

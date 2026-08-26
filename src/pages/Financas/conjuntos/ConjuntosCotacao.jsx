import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'wouter';
import PainelLateral from '../components/PainelLateral.jsx';
import { normalizar } from '../utils/moeda.js';
import { listarConjuntos, criarConjunto, excluirConjunto as excluirConjuntoApi } from '../data/apiConjuntos.js';
import '../financas.css';
import './conjuntosCotacao.css';

/* Lista os conjuntos de cotação já montados (ex.: "Coffee", com variações
   "Coffee Cheio" x "Coffee Reduzido") e permite criar um novo — que nasce
   só com nome e é aberto na página de detalhe (ConjuntoDetalhe) pra
   montar as variações e as quantidades. */
export default function ConjuntosCotacao() {
    const [, navegar] = useLocation();

    const [conjuntos, setConjuntos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [painelAberto, setPainelAberto] = useState(false);
    const [nomeNovoConjunto, setNomeNovoConjunto] = useState('');
    const [criando, setCriando] = useState(false);
    const [erroAcao, setErroAcao] = useState('');
    const [filtro, setFiltro] = useState('');
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);

    useEffect(() => {
        let ativo = true;
        listarConjuntos()
            .then((lista) => {
                if (ativo) setConjuntos(lista);
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
    }, []);

    const conjuntosFiltrados = filtro.trim()
        ? conjuntos.filter((conjunto) => normalizar(conjunto.nome).includes(normalizar(filtro)))
        : conjuntos;

    const abrirNovoConjunto = () => {
        setNomeNovoConjunto('');
        setErroAcao('');
        setPainelAberto(true);
    };

    const salvarNovoConjunto = async (evento) => {
        evento.preventDefault();
        setErroAcao('');
        setCriando(true);
        try {
            const criado = await criarConjunto(nomeNovoConjunto);
            navegar(`/financeiro/conjuntos/${criado.id}`);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setCriando(false);
        }
    };

    const excluirConjunto = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErro('');
        try {
            await excluirConjuntoApi(id);
            setConjuntos(conjuntos.filter((conjunto) => conjunto.id !== id));
        } catch (e) {
            setErro(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    return (
        <div className="paginaFinancas">
            <header className="cabecalhoFinancas">
                <button
                    type="button"
                    className="botaoVoltarConjuntosCotacao"
                    onClick={() => navegar('/financeiro')}
                    aria-label="Voltar para o financeiro"
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
                    <div className="conteudoConjuntosCotacao">
                        <header className="cabecalhoSecaoFinancas">
                            <div>
                                <h1 className="tituloSecaoFinancas">Conjuntos</h1>
                                <p className="subtituloSecaoFinancas">
                                    Cada conjunto pode ter várias variações — monte e compare o custo de cada uma
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
                                        aria-label="Filtrar conjuntos por nome"
                                    />
                                </div>
                                <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoConjunto}>
                                    + Novo conjunto
                                </button>
                            </div>
                        </header>

                        {erro && <p className="avisoErroConjuntosCotacao" role="alert">{erro}</p>}

                        <div className="envelopeTabelaFinancas">
                            <table className="tabelaFinancas">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Variações</th>
                                        <th aria-label="Ações" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {carregando && (
                                        <tr>
                                            <td colSpan={3} className="celulaVaziaFinancas">
                                                Carregando conjuntos…
                                            </td>
                                        </tr>
                                    )}
                                    {!carregando && conjuntosFiltrados.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="celulaVaziaFinancas">
                                                {filtro.trim()
                                                    ? 'Nenhum conjunto encontrado para esse filtro.'
                                                    : 'Nenhum conjunto montado ainda.'}
                                            </td>
                                        </tr>
                                    )}
                                    {!carregando && conjuntosFiltrados.map((conjunto) => (
                                        <tr key={conjunto.id}>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="nomeConjuntoCotacaoLink"
                                                    onClick={() => navegar(`/financeiro/conjuntos/${conjunto.id}`)}
                                                >
                                                    {conjunto.nome}
                                                </button>
                                            </td>
                                            <td className="celulaQuantidadeConjuntosCotacao">
                                                {conjunto.variacoes.length === 0
                                                    ? 'Nenhuma ainda'
                                                    : conjunto.variacoes.map((v) => v.nome).join(', ')}
                                            </td>
                                            <td>
                                                <div className="grupoAcoesLinhaFinancas">
                                                    <button
                                                        type="button"
                                                        className="botaoAcaoLinhaFinancas"
                                                        aria-label={`Abrir ${conjunto.nome}`}
                                                        title="Abrir"
                                                        onClick={() => navegar(`/financeiro/conjuntos/${conjunto.id}`)}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={
                                                            idConfirmandoExclusao === conjunto.id
                                                                ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                                : 'botaoAcaoLinhaFinancas'
                                                        }
                                                        aria-label={
                                                            idConfirmandoExclusao === conjunto.id
                                                                ? `Confirmar exclusão de ${conjunto.nome}`
                                                                : `Excluir ${conjunto.nome}`
                                                        }
                                                        title={
                                                            idConfirmandoExclusao === conjunto.id
                                                                ? 'Clique novamente para confirmar'
                                                                : 'Excluir'
                                                        }
                                                        onClick={() => excluirConjunto(conjunto.id)}
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
                            </table>
                        </div>
                    </div>
                </section>
            </main>

            <PainelLateral aberto={painelAberto} titulo="Novo conjunto" aoFechar={() => setPainelAberto(false)}>
                <form className="formularioFinancas" onSubmit={salvarNovoConjunto}>
                    {erroAcao && <p className="avisoErroConjuntosCotacao" role="alert">{erroAcao}</p>}
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeNovoConjunto">
                            Nome do conjunto *
                        </label>
                        <input
                            id="campoNomeNovoConjunto"
                            className="entradaFormularioFinancas"
                            required
                            autofocus
                            placeholder="Ex: Coffee"
                            value={nomeNovoConjunto}
                            onInput={(e) => setNomeNovoConjunto(e.currentTarget.value)}
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
                        <button type="submit" className="botaoPrimarioFinancas" disabled={criando}>
                            {criando ? 'Criando…' : 'Criar e montar variações'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

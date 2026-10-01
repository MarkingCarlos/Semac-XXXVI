import { useState } from 'preact/hooks';
import PainelLateral from '../components/PainelLateral.jsx';
import CampoMoeda from '../components/CampoMoeda.jsx';
import { formatarCentavos, formatarData, normalizar } from '../utils/moeda.js';
import { criarDoador, atualizarDoador, excluirDoador } from '../data/apiDoacoes.js';
import './doacoes.css';

/* Doações — tabela `doador` (nome, valor, data). Pessoas externas ao
   sistema, sem vínculo com `pessoa`. Único lugar onde as doações são
   cadastradas, editadas e excluídas (antes ficava no /admin). O total
   entra no saldo em caixa (ver Resumo). Valores em centavos.

   A lista mora no Financas.jsx (o Resumo também usa); cada alteração
   volta por `aoAlterarDoadores`, que também recalcula o saldo. */

function formularioVazioDoacao() {
    return {
        nome: '',
        valor: 0,
        data: new Date().toISOString().slice(0, 10),
    };
}

export default function Doacoes({ doadores, carregando, erro, aoAlterarDoadores }) {
    const [filtro, setFiltro] = useState('');
    const [erroOperacaoDoacao, setErroOperacaoDoacao] = useState('');
    const [salvandoDoacao, setSalvandoDoacao] = useState(false);

    const [painelDoacaoAberto, setPainelDoacaoAberto] = useState(false);
    const [formularioDoacao, setFormularioDoacao] = useState(formularioVazioDoacao);
    const [idDoacaoEmEdicao, setIdDoacaoEmEdicao] = useState(null);
    const [idConfirmandoExclusaoDoacao, setIdConfirmandoExclusaoDoacao] = useState(null);

    const totalArrecadado = doadores.reduce((soma, doador) => soma + doador.valor, 0);
    const doadoresFiltrados = filtro.trim()
        ? doadores.filter((doador) => normalizar(doador.nome).includes(normalizar(filtro)))
        : doadores;

    const abrirNovaDoacao = () => {
        setFormularioDoacao(formularioVazioDoacao());
        setIdDoacaoEmEdicao(null);
        setErroOperacaoDoacao('');
        setPainelDoacaoAberto(true);
    };

    const abrirEdicaoDoacao = (doador) => {
        setFormularioDoacao({ ...doador, data: doador.data.slice(0, 10) });
        setIdDoacaoEmEdicao(doador.id);
        setErroOperacaoDoacao('');
        setPainelDoacaoAberto(true);
    };

    const salvarDoacao = async (evento) => {
        evento.preventDefault();
        // Meio-dia evita o deslocamento de fuso que jogaria a data para o dia anterior
        const registro = { ...formularioDoacao, data: `${formularioDoacao.data}T12:00:00` };

        setSalvandoDoacao(true);
        setErroOperacaoDoacao('');
        try {
            if (idDoacaoEmEdicao !== null) {
                const atualizado = await atualizarDoador(idDoacaoEmEdicao, registro);
                aoAlterarDoadores(doadores.map((doador) => (doador.id === idDoacaoEmEdicao ? atualizado : doador)));
            } else {
                const criado = await criarDoador(registro);
                aoAlterarDoadores([criado, ...doadores]);
            }
            setPainelDoacaoAberto(false);
        } catch (e) {
            setErroOperacaoDoacao(e.message);
        } finally {
            setSalvandoDoacao(false);
        }
    };

    const excluirDoacao = async (id) => {
        if (idConfirmandoExclusaoDoacao !== id) {
            setIdConfirmandoExclusaoDoacao(id);
            return;
        }
        setErroOperacaoDoacao('');
        try {
            await excluirDoador(id);
            aoAlterarDoadores(doadores.filter((doador) => doador.id !== id));
        } catch (e) {
            setErroOperacaoDoacao(e.message);
        } finally {
            setIdConfirmandoExclusaoDoacao(null);
        }
    };

    const mensagemErroDoacoes = erroOperacaoDoacao || erro;

    return (
        <div className="conteudoDoacoesFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Doações</h1>
                    <p className="subtituloSecaoFinancas">
                        Doadores externos ao evento — entram no saldo em caixa
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
                            placeholder="Filtrar por doador…"
                            value={filtro}
                            onInput={(e) => setFiltro(e.currentTarget.value)}
                            aria-label="Filtrar doações por doador"
                        />
                    </div>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovaDoacao}>
                        + Nova doação
                    </button>
                </div>
            </header>

            {mensagemErroDoacoes && !painelDoacaoAberto && (
                <p className="avisoErroDoacoesFinancas" role="alert">{mensagemErroDoacoes}</p>
            )}

            {/* ── Faixa de totais ─────────────────────────── */}
            <div className="faixaResumoDoacoesFinancas">
                <div className="itemResumoDoacoesFinancas">
                    <span className="rotuloItemResumoDoacoesFinancas">Total em doações</span>
                    <strong className="valorItemResumoDoacoesFinancas valorDestaqueDoacoesFinancas">
                        {formatarCentavos(totalArrecadado)}
                    </strong>
                </div>
                <div className="itemResumoDoacoesFinancas">
                    <span className="rotuloItemResumoDoacoesFinancas">Doações registradas</span>
                    <strong className="valorItemResumoDoacoesFinancas">{doadores.length}</strong>
                </div>
            </div>

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Doador</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={4} className="celulaVaziaFinancas">
                                    Carregando doações…
                                </td>
                            </tr>
                        )}
                        {!carregando && doadoresFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={4} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum doador encontrado para esse filtro.'
                                        : 'Nenhuma doação registrada ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && doadoresFiltrados.map((doador) => (
                            <tr key={doador.id}>
                                <td>
                                    <span className="nomeDoadorDoacoesFinancas">{doador.nome}</span>
                                </td>
                                <td className="celulaValorFinancas celulaValorEntradaDoacoesFinancas">
                                    {formatarCentavos(doador.valor)}
                                </td>
                                <td className="celulaDataFinancas">{formatarData(doador.data)}</td>
                                <td>
                                    <div className="grupoAcoesLinhaFinancas">
                                        <button
                                            type="button"
                                            className="botaoAcaoLinhaFinancas"
                                            aria-label={`Editar doação de ${doador.nome}`}
                                            title="Editar"
                                            onClick={() => abrirEdicaoDoacao(doador)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                idConfirmandoExclusaoDoacao === doador.id
                                                    ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                    : 'botaoAcaoLinhaFinancas'
                                            }
                                            aria-label={
                                                idConfirmandoExclusaoDoacao === doador.id
                                                    ? `Confirmar exclusão da doação de ${doador.nome}`
                                                    : `Excluir doação de ${doador.nome}`
                                            }
                                            title={
                                                idConfirmandoExclusaoDoacao === doador.id
                                                    ? 'Clique novamente para confirmar'
                                                    : 'Excluir'
                                            }
                                            onClick={() => excluirDoacao(doador.id)}
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

            <PainelLateral
                aberto={painelDoacaoAberto}
                titulo={idDoacaoEmEdicao !== null ? 'Editar doação' : 'Nova doação'}
                aoFechar={() => setPainelDoacaoAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarDoacao}>
                    {erroOperacaoDoacao && (
                        <p className="avisoErroDoacoesFinancas" role="alert">{erroOperacaoDoacao}</p>
                    )}

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeDoacao">
                            Doador *
                        </label>
                        <input
                            id="campoNomeDoacao"
                            className="entradaFormularioFinancas"
                            required
                            value={formularioDoacao.nome}
                            onInput={(e) => setFormularioDoacao({ ...formularioDoacao, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoValorDoacao">
                            Valor doado *
                        </label>
                        <CampoMoeda
                            id="campoValorDoacao"
                            valorCentavos={formularioDoacao.valor}
                            aoMudar={(centavos) => setFormularioDoacao({ ...formularioDoacao, valor: centavos })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDataDoacao">
                            Data da doação *
                        </label>
                        <input
                            id="campoDataDoacao"
                            className="entradaFormularioFinancas"
                            type="date"
                            required
                            value={formularioDoacao.data}
                            onInput={(e) => setFormularioDoacao({ ...formularioDoacao, data: e.currentTarget.value })}
                        />
                    </div>

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelDoacaoAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoDoacao}>
                            {salvandoDoacao
                                ? 'Salvando…'
                                : idDoacaoEmEdicao !== null
                                    ? 'Salvar alterações'
                                    : 'Adicionar doação'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

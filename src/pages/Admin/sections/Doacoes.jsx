import { useState, useEffect } from 'preact/hooks';
import PainelLateral from '../../Financas/components/PainelLateral.jsx';
import CampoMoeda from '../../Financas/components/CampoMoeda.jsx';
import { formatarCentavos, formatarData, normalizar } from '../../Financas/utils/moeda.js';
import {
    listarDoadores,
    criarDoador,
    atualizarDoador,
    excluirDoador,
} from '../../Financas/data/apiDoacoes.js';

/* Doações — tabela `doador` (nome, valor, data). Pessoas externas ao
   sistema, sem vínculo com `pessoa`. Os dados vêm da API (java_api);
   a interface mantém os valores em centavos e converte na borda. */

const FORMULARIO_VAZIO = {
    nome: '',
    valor: 0,
    data: new Date().toISOString().slice(0, 10),
};

export default function Doacoes() {
    const [doadores, setDoadores] = useState([]);
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
        listarDoadores()
            .then((lista) => {
                if (ativo) setDoadores(lista);
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

    const totalArrecadado = doadores.reduce((soma, doador) => soma + doador.valor, 0);
    const doadoresFiltrados = filtro.trim()
        ? doadores.filter((doador) => normalizar(doador.nome).includes(normalizar(filtro)))
        : doadores;

    const abrirNovaDoacao = () => {
        setFormulario(FORMULARIO_VAZIO);
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicaoDoacao = (doador) => {
        setFormulario({ ...doador, data: doador.data.slice(0, 10) });
        setIdEmEdicao(doador.id);
        setPainelAberto(true);
    };

    const salvarDoacao = async (evento) => {
        evento.preventDefault();
        // Meio-dia evita o deslocamento de fuso que jogaria a data para o dia anterior
        const registro = { ...formulario, data: `${formulario.data}T12:00:00` };

        setSalvando(true);
        setErro('');
        try {
            if (idEmEdicao !== null) {
                const atualizado = await atualizarDoador(idEmEdicao, registro);
                setDoadores(
                    doadores.map((doador) => (doador.id === idEmEdicao ? atualizado : doador)),
                );
            } else {
                const criado = await criarDoador(registro);
                setDoadores([criado, ...doadores]);
            }
            setPainelAberto(false);
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const excluirDoacao = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErro('');
        try {
            await excluirDoador(id);
            setDoadores(doadores.filter((doador) => doador.id !== id));
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
                    <h1 className="tituloSecaoFinancas">Doações</h1>
                    <p className="subtituloSecaoFinancas">
                        Doadores externos ao evento — nome e valor doado
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

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

            <div className="faixaResumoAdmin">
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Total arrecadado</span>
                    <strong className="valorItemResumoAdmin valorDestaqueAdmin">
                        {formatarCentavos(totalArrecadado)}
                    </strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Doadores</span>
                    <strong className="valorItemResumoAdmin">{doadores.length}</strong>
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
                                    <span className="nomeDoadorDoacoes">{doador.nome}</span>
                                </td>
                                <td className="celulaValorFinancas">{formatarCentavos(doador.valor)}</td>
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
                                                idConfirmandoExclusao === doador.id
                                                    ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                    : 'botaoAcaoLinhaFinancas'
                                            }
                                            aria-label={
                                                idConfirmandoExclusao === doador.id
                                                    ? `Confirmar exclusão da doação de ${doador.nome}`
                                                    : `Excluir doação de ${doador.nome}`
                                            }
                                            title={
                                                idConfirmandoExclusao === doador.id
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
                aberto={painelAberto}
                titulo={idEmEdicao !== null ? 'Editar doação' : 'Nova doação'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarDoacao}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeDoacao">
                            Doador *
                        </label>
                        <input
                            id="campoNomeDoacao"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.nome}
                            onInput={(e) => setFormulario({ ...formulario, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoValorDoacao">
                            Valor doado *
                        </label>
                        <CampoMoeda
                            id="campoValorDoacao"
                            valorCentavos={formulario.valor}
                            aoMudar={(centavos) => setFormulario({ ...formulario, valor: centavos })}
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
                            value={formulario.data}
                            onInput={(e) => setFormulario({ ...formulario, data: e.currentTarget.value })}
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
                                    : 'Adicionar doação'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

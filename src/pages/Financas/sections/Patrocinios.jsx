import { useState, useEffect } from 'preact/hooks';
import PainelLateral from '../components/PainelLateral.jsx';
import CampoMoeda from '../components/CampoMoeda.jsx';
import { formatarCentavos, formatarData, normalizar } from '../utils/moeda.js';
import { listarCotas } from '../data/apiCotas.js';
import {
    criarPatrocinador,
    atualizarPatrocinador,
    atualizarStatusPagamento,
    excluirPatrocinador,
} from '../data/apiPatrocinios.js';
import './patrocinios.css';

const FORMULARIO_VAZIO = {
    nome: '',
    descricao: '',
    logoUrl: '',
    cotaId: '',
    nivel: '',
    valorCota: 0,
    desconto: 0,
    adicao: 0,
    statusPagamento: 'A_RECEBER',
    observacao: '',
};

/* Patrocínios — mesma entidade exibida no site (nome, descrição, logo)
   estendida com os campos financeiros (cota, desconto, adição, status). */
export default function Patrocinios({ patrocinadores, setPatrocinadores, carregando, erro }) {
    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erroAcao, setErroAcao] = useState('');
    const [cotas, setCotas] = useState([]);

    // Cotas disponíveis para o select (nível + valor vêm do banco).
    useEffect(() => {
        let ativo = true;
        listarCotas()
            .then((lista) => { if (ativo) setCotas(lista); })
            .catch((e) => { if (ativo) setErroAcao(e.message); });
        return () => { ativo = false; };
    }, []);

    const valorFinal = formulario.valorCota - formulario.desconto + formulario.adicao;
    const patrocinadoresFiltrados = filtro.trim()
        ? patrocinadores.filter((patrocinador) => normalizar(patrocinador.nome).includes(normalizar(filtro)))
        : patrocinadores;

    const abrirNovoPatrocinio = () => {
        setFormulario(FORMULARIO_VAZIO);
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicaoPatrocinio = (patrocinador) => {
        setFormulario({ ...patrocinador });
        setIdEmEdicao(patrocinador.id);
        setPainelAberto(true);
    };

    /* Ao trocar a cota, o nível e o valor da cota são preenchidos automaticamente */
    const aoSelecionarCota = (evento) => {
        const cotaId = parseInt(evento.currentTarget.value, 10);
        const cota = cotas.find((item) => item.id === cotaId);
        setFormulario({
            ...formulario,
            cotaId,
            nivel: cota?.nivel ?? '',
            valorCota: cota?.valor ?? 0,
        });
    };

    const salvarPatrocinio = async (evento) => {
        evento.preventDefault();
        const registro = {
            ...formulario,
            dataRecebimento:
                formulario.statusPagamento === 'RECEBIDO'
                    ? formulario.dataRecebimento ?? new Date().toISOString()
                    : null,
        };

        setSalvando(true);
        setErroAcao('');
        try {
            if (idEmEdicao !== null) {
                const atualizado = await atualizarPatrocinador(idEmEdicao, registro);
                setPatrocinadores(
                    patrocinadores.map((patrocinador) =>
                        patrocinador.id === idEmEdicao ? atualizado : patrocinador,
                    ),
                );
            } else {
                const criado = await criarPatrocinador(registro);
                setPatrocinadores([...patrocinadores, criado]);
            }
            setPainelAberto(false);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const alternarStatusPagamento = async (patrocinador) => {
        const novoStatus = patrocinador.statusPagamento === 'RECEBIDO' ? 'A_RECEBER' : 'RECEBIDO';
        setErroAcao('');
        try {
            const atualizado = await atualizarStatusPagamento(patrocinador.id, novoStatus);
            setPatrocinadores(
                patrocinadores.map((patrocinadorItem) =>
                    patrocinadorItem.id === patrocinador.id ? atualizado : patrocinadorItem,
                ),
            );
        } catch (e) {
            setErroAcao(e.message);
        }
    };

    const excluirPatrocinio = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErroAcao('');
        try {
            await excluirPatrocinador(id);
            setPatrocinadores(patrocinadores.filter((patrocinador) => patrocinador.id !== id));
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    return (
        <div className="conteudoPatrociniosFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Patrocínios</h1>
                    <p className="subtituloSecaoFinancas">
                        Contratos assinados — patrocinadores exibidos no site
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
                            placeholder="Filtrar por empresa…"
                            value={filtro}
                            onInput={(e) => setFiltro(e.currentTarget.value)}
                            aria-label="Filtrar patrocínios por empresa"
                        />
                    </div>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoPatrocinio}>
                        + Novo patrocínio
                    </button>
                </div>
            </header>

            {(erro || erroAcao) && (
                <p className="avisoErroPatrocinios" role="alert">{erro || erroAcao}</p>
            )}

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Cota</th>
                            <th>Valor final</th>
                            <th>Status</th>
                            <th>Recebido em</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={6} className="celulaVaziaFinancas">
                                    Carregando patrocinadores…
                                </td>
                            </tr>
                        )}
                        {!carregando && patrocinadoresFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={6} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhuma empresa encontrada para esse filtro.'
                                        : 'Nenhum patrocínio registrado ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && patrocinadoresFiltrados.map((patrocinador) => (
                            <tr key={patrocinador.id}>
                                <td>
                                    <div className="celulaEmpresaPatrocinios">
                                        <span className="nomeEmpresaPatrocinios">{patrocinador.nome}</span>
                                        {patrocinador.observacao && (
                                            <span className="notaEmpresaPatrocinios">
                                                {patrocinador.observacao}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className="seloCotaPatrocinios">{patrocinador.nivel}</span>
                                </td>
                                <td className="celulaValorFinancas">
                                    {formatarCentavos(patrocinador.valorFinal)}
                                </td>
                                <td>
                                    <span
                                        className={
                                            patrocinador.statusPagamento === 'RECEBIDO'
                                                ? 'seloStatusFinancas seloRecebidoFinancas'
                                                : 'seloStatusFinancas seloAReceberFinancas'
                                        }
                                    >
                                        {patrocinador.statusPagamento === 'RECEBIDO' ? 'Recebido' : 'A receber'}
                                    </span>
                                </td>
                                <td className="celulaDataFinancas">
                                    {patrocinador.dataRecebimento
                                        ? formatarData(patrocinador.dataRecebimento)
                                        : '—'}
                                </td>
                                <td>
                                    <div className="grupoAcoesLinhaFinancas">
                                        <button
                                            type="button"
                                            className="botaoStatusLinhaFinancas"
                                            onClick={() => alternarStatusPagamento(patrocinador)}
                                        >
                                            {patrocinador.statusPagamento === 'RECEBIDO' ? 'Desfazer' : 'Receber'}
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoAcaoLinhaFinancas"
                                            aria-label={`Editar ${patrocinador.nome}`}
                                            title="Editar"
                                            onClick={() => abrirEdicaoPatrocinio(patrocinador)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                idConfirmandoExclusao === patrocinador.id
                                                    ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                    : 'botaoAcaoLinhaFinancas'
                                            }
                                            aria-label={
                                                idConfirmandoExclusao === patrocinador.id
                                                    ? `Confirmar exclusão de ${patrocinador.nome}`
                                                    : `Excluir ${patrocinador.nome}`
                                            }
                                            title={
                                                idConfirmandoExclusao === patrocinador.id
                                                    ? 'Clique novamente para confirmar'
                                                    : 'Excluir'
                                            }
                                            onClick={() => excluirPatrocinio(patrocinador.id)}
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
                titulo={idEmEdicao !== null ? 'Editar patrocínio' : 'Novo patrocínio'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarPatrocinio}>
                    <h3 className="divisorFormularioFinancas">Contrato</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomePatrocinio">
                            Empresa *
                        </label>
                        <input
                            id="campoNomePatrocinio"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.nome}
                            onInput={(e) => setFormulario({ ...formulario, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNivelPatrocinio">
                            Nível da cota *
                        </label>
                        <select
                            id="campoNivelPatrocinio"
                            className="entradaFormularioFinancas"
                            required
                            value={String(formulario.cotaId)}
                            onChange={aoSelecionarCota}
                        >
                            <option value="" disabled>
                                Selecione o nível
                            </option>
                            {cotas.map((cota) => (
                                <option key={cota.id} value={String(cota.id)}>
                                    {cota.nivel} — {formatarCentavos(cota.valor)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoValorCotaPatrocinio">
                            Valor da cota
                        </label>
                        <CampoMoeda
                            id="campoValorCotaPatrocinio"
                            valorCentavos={formulario.valorCota}
                            aoMudar={() => {}}
                            desabilitado
                        />
                    </div>

                    <div className="linhaDuplaFormularioFinancas">
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoDescontoPatrocinio">
                                Desconto
                            </label>
                            <CampoMoeda
                                id="campoDescontoPatrocinio"
                                valorCentavos={formulario.desconto}
                                aoMudar={(centavos) => setFormulario({ ...formulario, desconto: centavos })}
                            />
                        </div>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoAdicaoPatrocinio">
                                Adição
                            </label>
                            <CampoMoeda
                                id="campoAdicaoPatrocinio"
                                valorCentavos={formulario.adicao}
                                aoMudar={(centavos) => setFormulario({ ...formulario, adicao: centavos })}
                            />
                        </div>
                    </div>

                    <div className="blocoValorFinalFinancas">
                        <span className="rotuloCampoFinancas">Valor final</span>
                        <strong className="valorCalculadoFinancas">{formatarCentavos(valorFinal)}</strong>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoStatusPatrocinio">
                            Status do pagamento
                        </label>
                        <select
                            id="campoStatusPatrocinio"
                            className="entradaFormularioFinancas"
                            value={formulario.statusPagamento}
                            onChange={(e) =>
                                setFormulario({ ...formulario, statusPagamento: e.currentTarget.value })
                            }
                        >
                            <option value="A_RECEBER">A receber</option>
                            <option value="RECEBIDO">Recebido</option>
                        </select>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoObservacaoPatrocinio">
                            Observação
                        </label>
                        <textarea
                            id="campoObservacaoPatrocinio"
                            className="entradaFormularioFinancas areaTextoFinancas"
                            rows={2}
                            value={formulario.observacao}
                            onInput={(e) =>
                                setFormulario({ ...formulario, observacao: e.currentTarget.value })
                            }
                        />
                    </div>

                    <h3 className="divisorFormularioFinancas">Exibição no site</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDescricaoPatrocinio">
                            Descrição
                        </label>
                        <textarea
                            id="campoDescricaoPatrocinio"
                            className="entradaFormularioFinancas areaTextoFinancas"
                            rows={2}
                            value={formulario.descricao}
                            onInput={(e) =>
                                setFormulario({ ...formulario, descricao: e.currentTarget.value })
                            }
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoLogoPatrocinio">
                            Logo
                        </label>
                        <input
                            id="campoLogoPatrocinio"
                            className="entradaFormularioFinancas"
                            placeholder="ex.: nic-br.png (arquivo em src/assets/patrocinadores)"
                            value={formulario.logoUrl}
                            onInput={(e) => setFormulario({ ...formulario, logoUrl: e.currentTarget.value })}
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
                                    : 'Adicionar patrocínio'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

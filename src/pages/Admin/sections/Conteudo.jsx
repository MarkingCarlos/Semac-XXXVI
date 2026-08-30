import { useState, useEffect } from 'preact/hooks';
import PainelLateral from '../../Financas/components/PainelLateral.jsx';
import { normalizar } from '../../Financas/utils/moeda.js';
import { criarEvento, atualizarEvento, excluirEvento } from '../data/apiEventos.js';
import {
    listarTiposEvento,
    criarTipoEvento,
    atualizarTipoEvento,
    excluirTipoEvento,
} from '../data/apiTipoEvento.js';
import {
    listarTrilhas,
    criarTrilha,
    atualizarTrilha,
    excluirTrilha,
} from '../data/apiTrilha.js';

/* Conteúdo — eventos (tabela `evento`) com seu tipo (`tipo_evento`) e
   palestrantes (`palestrante`, vínculo recriado a cada gravação). A lista
   de eventos é carregada e mantida pelo Admin; aqui ficam o formulário de
   evento e os painéis de gerenciamento dos tipos de evento e das trilhas. */

const EVENTO_VAZIO = {
    nome: '',
    tipoEventoId: '',
    local: '',
    descricao: '',
    trilhaId: '',
    data: '',
    horaInicio: '',
    horaFim: '',
    capacidadeMaxima: '',
    palestrantes: [],
};

const TIPO_VAZIO = { nome: '', pontos: '', exigeInscricao: false };
const TRILHA_VAZIA = { nome: '' };

/* 'YYYY-MM-DD' → 'DD/MM/YYYY' (sem Date para não sofrer com fuso) */
function formatarDataEvento(data) {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

export default function Conteudo({ eventos, setEventos, carregando, erro }) {
    const [filtro, setFiltro] = useState('');
    const [erroAcao, setErroAcao] = useState('');
    const [salvando, setSalvando] = useState(false);

    // Painel do formulário de evento
    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(EVENTO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);

    // Tipos de evento (seletor do formulário + painel de gerenciamento)
    const [tiposEvento, setTiposEvento] = useState([]);
    const [painelTiposAberto, setPainelTiposAberto] = useState(false);
    const [formularioTipo, setFormularioTipo] = useState(TIPO_VAZIO);
    const [idTipoEmEdicao, setIdTipoEmEdicao] = useState(null);
    const [idTipoConfirmandoExclusao, setIdTipoConfirmandoExclusao] = useState(null);
    const [salvandoTipo, setSalvandoTipo] = useState(false);
    const [erroTipo, setErroTipo] = useState('');

    // Trilhas (seletor do formulário + painel de gerenciamento)
    const [trilhas, setTrilhas] = useState([]);
    const [painelTrilhasAberto, setPainelTrilhasAberto] = useState(false);
    const [formularioTrilha, setFormularioTrilha] = useState(TRILHA_VAZIA);
    const [idTrilhaEmEdicao, setIdTrilhaEmEdicao] = useState(null);
    const [idTrilhaConfirmandoExclusao, setIdTrilhaConfirmandoExclusao] = useState(null);
    const [salvandoTrilha, setSalvandoTrilha] = useState(false);
    const [erroTrilha, setErroTrilha] = useState('');

    useEffect(() => {
        let ativo = true;
        listarTiposEvento()
            .then((lista) => { if (ativo) setTiposEvento(lista); })
            .catch(() => { if (ativo) setErroTipo('Não foi possível carregar os tipos de evento.'); });
        listarTrilhas()
            .then((lista) => { if (ativo) setTrilhas(lista); })
            .catch(() => { if (ativo) setErroTrilha('Não foi possível carregar as trilhas.'); });
        return () => { ativo = false; };
    }, []);

    const eventosFiltrados = filtro.trim()
        ? eventos.filter((ev) => normalizar(ev.nome).includes(normalizar(filtro)))
        : eventos;

    // ── Formulário de evento ──────────────────────────────────────
    const abrirNovoEvento = () => {
        setFormulario(EVENTO_VAZIO);
        setIdEmEdicao(null);
        setErroAcao('');
        setPainelAberto(true);
    };

    const abrirEdicaoEvento = (evento) => {
        setFormulario({
            ...EVENTO_VAZIO,
            ...evento,
            tipoEventoId: evento.tipoEventoId ?? '',
            trilhaId: evento.trilhaId ?? '',
            palestrantes: (evento.palestrantes || []).map((p) => ({ ...p })),
        });
        setIdEmEdicao(evento.id);
        setErroAcao('');
        setPainelAberto(true);
    };

    const adicionarPalestrante = () => {
        setFormulario({
            ...formulario,
            palestrantes: [...formulario.palestrantes, { nome: '', descricao: '' }],
        });
    };

    const alterarPalestrante = (indice, campo, valor) => {
        setFormulario({
            ...formulario,
            palestrantes: formulario.palestrantes.map((p, i) =>
                i === indice ? { ...p, [campo]: valor } : p,
            ),
        });
    };

    const removerPalestrante = (indice) => {
        setFormulario({
            ...formulario,
            palestrantes: formulario.palestrantes.filter((_, i) => i !== indice),
        });
    };

    const salvarEvento = async (evento) => {
        evento.preventDefault();
        setSalvando(true);
        setErroAcao('');
        try {
            if (idEmEdicao !== null) {
                const atualizado = await atualizarEvento(idEmEdicao, formulario);
                setEventos(eventos.map((ev) => (ev.id === idEmEdicao ? atualizado : ev)));
            } else {
                const criado = await criarEvento(formulario);
                setEventos([...eventos, criado]);
            }
            setPainelAberto(false);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const removerEvento = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErroAcao('');
        try {
            await excluirEvento(id);
            setEventos(eventos.filter((ev) => ev.id !== id));
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    // ── Painel de tipos de evento ─────────────────────────────────
    const abrirPainelTipos = () => {
        setFormularioTipo(TIPO_VAZIO);
        setIdTipoEmEdicao(null);
        setErroTipo('');
        setPainelTiposAberto(true);
    };

    const editarTipo = (tipo) => {
        setFormularioTipo({ nome: tipo.nome, pontos: tipo.pontos, exigeInscricao: Boolean(tipo.exigeInscricao) });
        setIdTipoEmEdicao(tipo.id);
        setErroTipo('');
    };

    const cancelarEdicaoTipo = () => {
        setFormularioTipo(TIPO_VAZIO);
        setIdTipoEmEdicao(null);
    };

    const salvarTipo = async (evento) => {
        evento.preventDefault();
        setSalvandoTipo(true);
        setErroTipo('');
        try {
            if (idTipoEmEdicao !== null) {
                const atualizado = await atualizarTipoEvento(idTipoEmEdicao, formularioTipo);
                setTiposEvento(tiposEvento.map((t) => (t.id === idTipoEmEdicao ? atualizado : t)));
            } else {
                const criado = await criarTipoEvento(formularioTipo);
                setTiposEvento([...tiposEvento, criado]);
            }
            cancelarEdicaoTipo();
        } catch (e) {
            setErroTipo(e.message);
        } finally {
            setSalvandoTipo(false);
        }
    };

    const removerTipo = async (id) => {
        if (idTipoConfirmandoExclusao !== id) {
            setIdTipoConfirmandoExclusao(id);
            return;
        }
        setErroTipo('');
        try {
            await excluirTipoEvento(id);
            setTiposEvento(tiposEvento.filter((t) => t.id !== id));
        } catch (e) {
            setErroTipo(e.message);
        } finally {
            setIdTipoConfirmandoExclusao(null);
        }
    };

    // ── Painel de trilhas ──────────────────────────────────────────
    const abrirPainelTrilhas = () => {
        setFormularioTrilha(TRILHA_VAZIA);
        setIdTrilhaEmEdicao(null);
        setErroTrilha('');
        setPainelTrilhasAberto(true);
    };

    const editarTrilha = (trilha) => {
        setFormularioTrilha({ nome: trilha.nome });
        setIdTrilhaEmEdicao(trilha.id);
        setErroTrilha('');
    };

    const cancelarEdicaoTrilha = () => {
        setFormularioTrilha(TRILHA_VAZIA);
        setIdTrilhaEmEdicao(null);
    };

    const salvarTrilha = async (evento) => {
        evento.preventDefault();
        setSalvandoTrilha(true);
        setErroTrilha('');
        try {
            if (idTrilhaEmEdicao !== null) {
                const atualizada = await atualizarTrilha(idTrilhaEmEdicao, formularioTrilha);
                setTrilhas(trilhas.map((t) => (t.id === idTrilhaEmEdicao ? atualizada : t)));
            } else {
                const criada = await criarTrilha(formularioTrilha);
                setTrilhas([...trilhas, criada]);
            }
            cancelarEdicaoTrilha();
        } catch (e) {
            setErroTrilha(e.message);
        } finally {
            setSalvandoTrilha(false);
        }
    };

    const removerTrilha = async (id) => {
        if (idTrilhaConfirmandoExclusao !== id) {
            setIdTrilhaConfirmandoExclusao(id);
            return;
        }
        setErroTrilha('');
        try {
            await excluirTrilha(id);
            setTrilhas(trilhas.filter((t) => t.id !== id));
        } catch (e) {
            setErroTrilha(e.message);
        } finally {
            setIdTrilhaConfirmandoExclusao(null);
        }
    };

    return (
        <div className="conteudoConteudoAdmin">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Conteúdo</h1>
                    <p className="subtituloSecaoFinancas">
                        Eventos da programação — palestras, minicursos e atividades
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
                            placeholder="Filtrar por evento…"
                            value={filtro}
                            onInput={(e) => setFiltro(e.currentTarget.value)}
                            aria-label="Filtrar eventos por nome"
                        />
                    </div>
                    <button type="button" className="botaoFantasmaFinancas" onClick={abrirPainelTipos}>
                        Tipos de evento
                    </button>
                    <button type="button" className="botaoFantasmaFinancas" onClick={abrirPainelTrilhas}>
                        Trilhas
                    </button>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoEvento}>
                        + Novo evento
                    </button>
                </div>
            </header>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}
            {erroAcao && <p className="avisoErroAdmin" role="alert">{erroAcao}</p>}

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Tipo</th>
                            <th>Trilha</th>
                            <th>Local</th>
                            <th>Data / horário</th>
                            <th>Capacidade</th>
                            <th>Palestrantes</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={8} className="celulaVaziaFinancas">Carregando eventos…</td>
                            </tr>
                        )}
                        {!carregando && eventosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={8} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum evento encontrado para esse filtro.'
                                        : 'Nenhum evento cadastrado ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && eventosFiltrados.map((evento) => (
                            <tr key={evento.id}>
                                <td><span className="nomeEventoConteudo">{evento.nome}</span></td>
                                <td>
                                    {evento.tipo
                                        ? <span className="seloTipoConteudo">{evento.tipo}</span>
                                        : '—'}
                                </td>
                                <td>{evento.trilhaNome || '—'}</td>
                                <td className="celulaLocalConteudo">{evento.local || '—'}</td>
                                <td className="celulaDataFinancas">
                                    {formatarDataEvento(evento.data)}
                                    {evento.horaInicio && (
                                        <> · {evento.horaInicio}{evento.horaFim ? `–${evento.horaFim}` : ''}</>
                                    )}
                                </td>
                                <td>{evento.capacidadeMaxima ?? '—'}</td>
                                <td className="celulaPalestrantesConteudo">
                                    {evento.palestrantes && evento.palestrantes.length > 0
                                        ? evento.palestrantes.map((p) => p.nome).join(', ')
                                        : '—'}
                                </td>
                                <td>
                                    <div className="grupoAcoesLinhaFinancas">
                                        <button
                                            type="button"
                                            className="botaoAcaoLinhaFinancas"
                                            aria-label={`Editar evento ${evento.nome}`}
                                            title="Editar"
                                            onClick={() => abrirEdicaoEvento(evento)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                idConfirmandoExclusao === evento.id
                                                    ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                    : 'botaoAcaoLinhaFinancas'
                                            }
                                            aria-label={
                                                idConfirmandoExclusao === evento.id
                                                    ? `Confirmar exclusão do evento ${evento.nome}`
                                                    : `Excluir evento ${evento.nome}`
                                            }
                                            title={
                                                idConfirmandoExclusao === evento.id
                                                    ? 'Clique novamente para confirmar'
                                                    : 'Excluir'
                                            }
                                            onClick={() => removerEvento(evento.id)}
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

            {/* ── Painel: formulário de evento ─────────────────────── */}
            <PainelLateral
                aberto={painelAberto}
                titulo={idEmEdicao !== null ? 'Editar evento' : 'Novo evento'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarEvento}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeEvento">Nome *</label>
                        <input
                            id="campoNomeEvento"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.nome}
                            onInput={(e) => setFormulario({ ...formulario, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoTipoEvento">Tipo *</label>
                        <select
                            id="campoTipoEvento"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.tipoEventoId}
                            onChange={(e) => setFormulario({ ...formulario, tipoEventoId: e.currentTarget.value })}
                        >
                            <option value="" disabled>Selecione um tipo…</option>
                            {tiposEvento.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoLocalEvento">Local</label>
                        <input
                            id="campoLocalEvento"
                            className="entradaFormularioFinancas"
                            value={formulario.local}
                            onInput={(e) => setFormulario({ ...formulario, local: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoTrilhaEvento">Trilha</label>
                        <select
                            id="campoTrilhaEvento"
                            className="entradaFormularioFinancas"
                            value={formulario.trilhaId}
                            onChange={(e) => setFormulario({ ...formulario, trilhaId: e.currentTarget.value })}
                        >
                            <option value="">Nenhuma</option>
                            {trilhas.map((trilha) => (
                                <option key={trilha.id} value={trilha.id}>{trilha.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDataEvento">Data *</label>
                        <input
                            id="campoDataEvento"
                            className="entradaFormularioFinancas"
                            type="date"
                            required
                            value={formulario.data}
                            onInput={(e) => setFormulario({ ...formulario, data: e.currentTarget.value })}
                        />
                    </div>

                    <div className="linhaCamposConteudo">
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoHoraInicioEvento">Início *</label>
                            <input
                                id="campoHoraInicioEvento"
                                className="entradaFormularioFinancas"
                                type="time"
                                required
                                value={formulario.horaInicio}
                                onInput={(e) => setFormulario({ ...formulario, horaInicio: e.currentTarget.value })}
                            />
                        </div>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoHoraFimEvento">Término *</label>
                            <input
                                id="campoHoraFimEvento"
                                className="entradaFormularioFinancas"
                                type="time"
                                required
                                value={formulario.horaFim}
                                onInput={(e) => setFormulario({ ...formulario, horaFim: e.currentTarget.value })}
                            />
                        </div>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoCapacidadeEvento">Capacidade máxima *</label>
                        <input
                            id="campoCapacidadeEvento"
                            className="entradaFormularioFinancas"
                            type="number"
                            min="1"
                            required
                            value={formulario.capacidadeMaxima}
                            onInput={(e) => setFormulario({ ...formulario, capacidadeMaxima: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDescricaoEvento">Descrição</label>
                        <textarea
                            id="campoDescricaoEvento"
                            className="entradaFormularioFinancas"
                            rows={3}
                            value={formulario.descricao}
                            onInput={(e) => setFormulario({ ...formulario, descricao: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <div className="cabecalhoPalestrantesConteudo">
                            <label className="rotuloCampoFinancas semMargemInferiorAdmin">Palestrantes</label>
                            <button
                                type="button"
                                className="botaoFantasmaFinancas botaoMiniAdmin"
                                onClick={adicionarPalestrante}
                            >
                                + Adicionar
                            </button>
                        </div>

                        {formulario.palestrantes.length === 0 && (
                            <p className="avisoVazioPalestrantesConteudo">Nenhum palestrante adicionado.</p>
                        )}

                        {formulario.palestrantes.map((palestrante, indice) => (
                            <div key={indice} className="cartaoPalestranteConteudo">
                                <div className="topoCartaoPalestranteConteudo">
                                    <span className="rotuloCampoFinancas semMargemInferiorAdmin">
                                        Palestrante {indice + 1}
                                    </span>
                                    <button
                                        type="button"
                                        className="botaoAcaoLinhaFinancas"
                                        aria-label={`Remover palestrante ${indice + 1}`}
                                        title="Remover"
                                        onClick={() => removerPalestrante(indice)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="campoFormularioFinancas">
                                    <input
                                        className="entradaFormularioFinancas"
                                        placeholder="Nome *"
                                        required
                                        value={palestrante.nome}
                                        onInput={(e) => alterarPalestrante(indice, 'nome', e.currentTarget.value)}
                                    />
                                </div>
                                <div className="campoFormularioFinancas">
                                    <textarea
                                        className="entradaFormularioFinancas"
                                        rows={2}
                                        placeholder="Descrição / minibiografia"
                                        value={palestrante.descricao}
                                        onInput={(e) => alterarPalestrante(indice, 'descricao', e.currentTarget.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rodapeFormularioFinancas">
                        <button type="button" className="botaoFantasmaFinancas" onClick={() => setPainelAberto(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvando}>
                            {salvando
                                ? 'Salvando…'
                                : idEmEdicao !== null
                                    ? 'Salvar alterações'
                                    : 'Adicionar evento'}
                        </button>
                    </div>
                </form>
            </PainelLateral>

            {/* ── Painel: gerenciamento dos tipos de evento ────────── */}
            <PainelLateral
                aberto={painelTiposAberto}
                titulo="Tipos de evento"
                aoFechar={() => setPainelTiposAberto(false)}
            >
                {erroTipo && <p className="avisoErroAdmin" role="alert">{erroTipo}</p>}

                <ul className="listaTiposEventoConteudo">
                    {tiposEvento.length === 0 && (
                        <p className="avisoVazioPalestrantesConteudo">Nenhum tipo cadastrado ainda.</p>
                    )}
                    {tiposEvento.map((tipo) => (
                        <li key={tipo.id} className="itemTipoEventoConteudo">
                            <div className="infoTipoEventoConteudo">
                                <span className="nomeTipoEventoConteudo">{tipo.nome}</span>
                                <span className="pontosTipoEventoConteudo">{tipo.pontos} pts</span>
                                {tipo.exigeInscricao && (
                                    <span className="seloInscricaoTipoEventoConteudo">vaga limitada</span>
                                )}
                            </div>
                            <div className="grupoAcoesLinhaFinancas">
                                <button
                                    type="button"
                                    className="botaoAcaoLinhaFinancas"
                                    aria-label={`Editar tipo ${tipo.nome}`}
                                    title="Editar"
                                    onClick={() => editarTipo(tipo)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className={
                                        idTipoConfirmandoExclusao === tipo.id
                                            ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                            : 'botaoAcaoLinhaFinancas'
                                    }
                                    aria-label={
                                        idTipoConfirmandoExclusao === tipo.id
                                            ? `Confirmar exclusão do tipo ${tipo.nome}`
                                            : `Excluir tipo ${tipo.nome}`
                                    }
                                    title={
                                        idTipoConfirmandoExclusao === tipo.id
                                            ? 'Clique novamente para confirmar'
                                            : 'Excluir'
                                    }
                                    onClick={() => removerTipo(tipo.id)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <form className="formularioFinancas" onSubmit={salvarTipo}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeTipo">
                            {idTipoEmEdicao !== null ? 'Editando tipo' : 'Novo tipo'} *
                        </label>
                        <input
                            id="campoNomeTipo"
                            className="entradaFormularioFinancas"
                            placeholder="Nome do tipo"
                            required
                            value={formularioTipo.nome}
                            onInput={(e) => setFormularioTipo({ ...formularioTipo, nome: e.currentTarget.value })}
                        />
                    </div>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoPontosTipo">Pontos *</label>
                        <input
                            id="campoPontosTipo"
                            className="entradaFormularioFinancas"
                            type="number"
                            min="0"
                            required
                            value={formularioTipo.pontos}
                            onInput={(e) => setFormularioTipo({ ...formularioTipo, pontos: e.currentTarget.value })}
                        />
                    </div>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCheckboxTipoEventoConteudo" htmlFor="campoExigeInscricaoTipo">
                            <input
                                id="campoExigeInscricaoTipo"
                                type="checkbox"
                                checked={formularioTipo.exigeInscricao}
                                onChange={(e) => setFormularioTipo({ ...formularioTipo, exigeInscricao: e.currentTarget.checked })}
                            />
                            <span>
                                Participante escolhe (vagas limitadas)
                                <small className="ajudaCheckboxTipoEventoConteudo">
                                    Marque para minicursos. Desmarcado, todo participante confirmado
                                    é inscrito automaticamente nos eventos desse tipo.
                                </small>
                            </span>
                        </label>
                    </div>
                    <div className="rodapeFormularioFinancas">
                        {idTipoEmEdicao !== null && (
                            <button type="button" className="botaoFantasmaFinancas" onClick={cancelarEdicaoTipo}>
                                Cancelar edição
                            </button>
                        )}
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoTipo}>
                            {salvandoTipo
                                ? 'Salvando…'
                                : idTipoEmEdicao !== null
                                    ? 'Salvar tipo'
                                    : 'Adicionar tipo'}
                        </button>
                    </div>
                </form>
            </PainelLateral>

            {/* ── Painel: gerenciamento das trilhas ─────────────────── */}
            <PainelLateral
                aberto={painelTrilhasAberto}
                titulo="Trilhas"
                aoFechar={() => setPainelTrilhasAberto(false)}
            >
                {erroTrilha && <p className="avisoErroAdmin" role="alert">{erroTrilha}</p>}

                <ul className="listaTiposEventoConteudo">
                    {trilhas.length === 0 && (
                        <p className="avisoVazioPalestrantesConteudo">Nenhuma trilha cadastrada ainda.</p>
                    )}
                    {trilhas.map((trilha) => (
                        <li key={trilha.id} className="itemTipoEventoConteudo">
                            <div className="infoTipoEventoConteudo">
                                <span className="nomeTipoEventoConteudo">{trilha.nome}</span>
                            </div>
                            <div className="grupoAcoesLinhaFinancas">
                                <button
                                    type="button"
                                    className="botaoAcaoLinhaFinancas"
                                    aria-label={`Editar trilha ${trilha.nome}`}
                                    title="Editar"
                                    onClick={() => editarTrilha(trilha)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className={
                                        idTrilhaConfirmandoExclusao === trilha.id
                                            ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                            : 'botaoAcaoLinhaFinancas'
                                    }
                                    aria-label={
                                        idTrilhaConfirmandoExclusao === trilha.id
                                            ? `Confirmar exclusão da trilha ${trilha.nome}`
                                            : `Excluir trilha ${trilha.nome}`
                                    }
                                    title={
                                        idTrilhaConfirmandoExclusao === trilha.id
                                            ? 'Clique novamente para confirmar'
                                            : 'Excluir'
                                    }
                                    onClick={() => removerTrilha(trilha.id)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <form className="formularioFinancas" onSubmit={salvarTrilha}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeTrilha">
                            {idTrilhaEmEdicao !== null ? 'Editando trilha' : 'Nova trilha'} *
                        </label>
                        <input
                            id="campoNomeTrilha"
                            className="entradaFormularioFinancas"
                            placeholder="Nome da trilha"
                            required
                            value={formularioTrilha.nome}
                            onInput={(e) => setFormularioTrilha({ ...formularioTrilha, nome: e.currentTarget.value })}
                        />
                    </div>
                    <div className="rodapeFormularioFinancas">
                        {idTrilhaEmEdicao !== null && (
                            <button type="button" className="botaoFantasmaFinancas" onClick={cancelarEdicaoTrilha}>
                                Cancelar edição
                            </button>
                        )}
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoTrilha}>
                            {salvandoTrilha
                                ? 'Salvando…'
                                : idTrilhaEmEdicao !== null
                                    ? 'Salvar trilha'
                                    : 'Adicionar trilha'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

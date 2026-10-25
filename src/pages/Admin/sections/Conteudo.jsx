import { useState, useEffect } from 'preact/hooks';
import PainelLateral from '../../Financas/components/PainelLateral.jsx';
import { normalizar } from '../../Financas/utils/moeda.js';
import {
    criarEvento,
    atualizarEvento,
    excluirEvento,
    iniciarEvento,
    enviarFotoPalestrante,
    urlFotoPalestrante,
} from '../data/apiEventos.js';
import { listarTiposEvento, atualizarTipoEvento } from '../data/apiTipoEvento.js';
import {
    listarTrilhas,
    criarTrilha,
    atualizarTrilha,
    excluirTrilha,
} from '../data/apiTrilha.js';
import { lerEscolhaMinicursos, salvarEscolhaMinicursos } from '../data/apiEscolhaMinicursos.js';
import ModalPerguntasDebateAdmin from '../ModalPerguntasDebateAdmin.jsx';
import ModalEnquadramentoFotoPalestrante from '../ModalEnquadramentoFotoPalestrante.jsx';
import {
    ENQUADRAMENTO_PADRAO_FOTO_PALESTRANTE,
    estiloEnquadramentoFoto,
} from '../../Debate/enquadramentoFotoPalestrante.js';
import { lerSessao } from '../../../auth/sessao.js';
import { listarSorteios, criarSorteioComBrinde, excluirSorteio } from '../../Sorteio/data/apiSorteio.js';
import Brindes from './Brindes.jsx';
import SeletorModalSubabas from '../../../components/SeletorModalSubabas/SeletorModalSubabas.jsx';
import ListaItensMobileAdmin from '../../../components/ListaItensMobileAdmin/ListaItensMobileAdmin.jsx';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';

/* Conteúdo — duas sub-abas:
   - "Eventos": tabela `evento` com seu tipo (`tipo_evento`) e palestrantes
     (`palestrante`, atualizado no lugar a cada gravação — preserva a
     foto, que sobe à parte logo depois). A lista de eventos
     é carregada e mantida pelo Admin; aqui ficam o formulário de evento e
     os painéis de gerenciamento dos tipos de evento e das trilhas. Os
     sorteios de cada evento são cadastrados no próprio painel de edição.
   - "Brindes": em Brindes.jsx.
   Toda a diretoria vê e edita os eventos; criar, excluir, iniciar e abrir
   a escolha de minicursos ficam com PAPEIS_GESTAO_EVENTOS (mesma regra
   do SecurityConfig). MEMBRO só vê Brindes. */

const PAPEIS_GESTAO_EVENTOS = ['DIRETOR_SITE', 'PRESIDENTE', 'DIRETOR_CONTEUDO'];

const SUBABAS_CONTEUDO = [
    {
        id: 'eventos',
        rotulo: 'Eventos',
        papeis: [...PAPEIS_GESTAO_EVENTOS, 'DIRETOR_PATROCINIO', 'DIRETOR_APOIO', 'DIRETOR_MARKETING'],
    },
    { id: 'brindes', rotulo: 'Brindes' },
];

const NOVO_SORTEIO_EVENTO_VAZIO = { brinde: '' };

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
    debateTempoFalaMin: '3',
    debateAlertaSeg: '30',
    debateTempoReplicaSeg: '30',
};

/* Rota do painel que controla o telão do debate (ver pages/Debate). */
const rotaPainelDebate = (eventoId) => `/debate/${eventoId}`;

const TIPO_VAZIO = { nome: '', pontos: '', exigeInscricao: false };
const TRILHA_VAZIA = { nome: '' };
const ANO_ATUAL = new Date().getFullYear();

/* 'YYYY-MM-DD' → 'DD/MM/YYYY' (sem Date para não sofrer com fuso) */
function formatarDataEvento(data) {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

export default function Conteudo({ eventos, setEventos, carregando, erro }) {
    const roleAtual = lerSessao()?.role;
    const subabasVisiveisConteudo = SUBABAS_CONTEUDO.filter(
        (subaba) => !subaba.papeis || subaba.papeis.includes(roleAtual),
    );
    const podeVerEventos = subabasVisiveisConteudo.some((subaba) => subaba.id === 'eventos');
    const podeGerenciarEventos = PAPEIS_GESTAO_EVENTOS.includes(roleAtual);
    const [subabaAtivaConteudo, setSubabaAtivaConteudo] = useState(subabasVisiveisConteudo[0].id);

    const [filtro, setFiltro] = useState('');
    const [erroAcao, setErroAcao] = useState('');
    const [salvando, setSalvando] = useState(false);

    // Painel do formulário de evento
    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(EVENTO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [idConfirmandoInicio, setIdConfirmandoInicio] = useState(null);

    // Tipos de evento (seletor do formulário + painel de edição; criar e
    // excluir não existem — os tipos são um catálogo fixo do backend)
    const [tiposEvento, setTiposEvento] = useState([]);
    const [painelTiposAberto, setPainelTiposAberto] = useState(false);
    const [formularioTipo, setFormularioTipo] = useState(TIPO_VAZIO);
    const [idTipoEmEdicao, setIdTipoEmEdicao] = useState(null);
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

    // Botão "Escolha de minicursos" do /participantes (null = carregando)
    const [escolhaMinicursosAberta, setEscolhaMinicursosAberta] = useState(null);
    const [salvandoEscolhaMinicursos, setSalvandoEscolhaMinicursos] = useState(false);
    const [erroEscolhaMinicursos, setErroEscolhaMinicursos] = useState('');

    // Palestrante (índice no formulário) com o ajuste de foto aberto
    const [indiceEnquadramentoFotoAberto, setIndiceEnquadramentoFotoAberto] = useState(null);

    // Debate cujas perguntas estão abertas no modal (null = fechado)
    const [eventoPerguntasDebateAberto, setEventoPerguntasDebateAberto] = useState(null);

    /* Mobile: evento aberto no modal de detalhes. Só o id, buscado na
       lista a cada render: o modal reflete na hora o "iniciado" e some
       sozinho depois de uma exclusão. */
    /* Sorteios do evento aberto no painel de edição. Cada um é salvo na
       hora, com sua própria chamada — não espera o "Salvar alterações". */
    const [sorteiosEvento, setSorteiosEvento] = useState([]);
    const [carregandoSorteiosEvento, setCarregandoSorteiosEvento] = useState(false);
    const [novoSorteioEvento, setNovoSorteioEvento] = useState(null);
    const [salvandoSorteioEvento, setSalvandoSorteioEvento] = useState(false);
    const [erroSorteioEvento, setErroSorteioEvento] = useState('');
    const [idSorteioConfirmandoExclusao, setIdSorteioConfirmandoExclusao] = useState(null);

    const [idEventoDetalhado, setIdEventoDetalhado] = useState(null);
    const eventoDetalhado = eventos.find((ev) => ev.id === idEventoDetalhado) ?? null;

    // Fechar o modal descarta um "toque de novo para confirmar" pendente.
    const fecharDetalhesEvento = () => {
        setIdEventoDetalhado(null);
        setIdConfirmandoExclusao(null);
        setIdConfirmandoInicio(null);
    };

    /* Tipos, trilhas e escolha de minicursos só servem à sub-aba Eventos —
       quem não a vê nem chega a buscá-los. */
    useEffect(() => {
        if (!podeVerEventos) return undefined;
        let ativo = true;
        listarTiposEvento()
            .then((lista) => { if (ativo) setTiposEvento(lista); })
            .catch(() => { if (ativo) setErroTipo('Não foi possível carregar os tipos de evento.'); });
        listarTrilhas()
            .then((lista) => { if (ativo) setTrilhas(lista); })
            .catch(() => { if (ativo) setErroTrilha('Não foi possível carregar as trilhas.'); });
        if (podeGerenciarEventos) {
            lerEscolhaMinicursos(ANO_ATUAL)
                .then((aberta) => { if (ativo) setEscolhaMinicursosAberta(aberta); })
                .catch((e) => { if (ativo) setErroEscolhaMinicursos(e.message); });
        }
        return () => { ativo = false; };
    }, []);

    /* ── Escolha de minicursos ───────────────────────────────── */

    const alternarEscolhaMinicursos = async (novoValor) => {
        setSalvandoEscolhaMinicursos(true);
        setErroEscolhaMinicursos('');
        try {
            setEscolhaMinicursosAberta(await salvarEscolhaMinicursos(ANO_ATUAL, novoValor));
        } catch (e) {
            setErroEscolhaMinicursos(e.message);
        } finally {
            setSalvandoEscolhaMinicursos(false);
        }
    };

    const eventosFiltrados = filtro.trim()
        ? eventos.filter((ev) => normalizar(ev.nome).includes(normalizar(filtro)))
        : eventos;

    /* O bloco "Telão do debate" do formulário aparece pelo tipo
       selecionado agora, não pelo salvo — trocar o tipo já mostra. */
    const ehDebateFormulario = tiposEvento.some(
        (tipo) => String(tipo.id) === String(formulario.tipoEventoId) && tipo.codigo === 'DEBATE',
    );

    // ── Formulário de evento ──────────────────────────────────────
    const abrirNovoEvento = () => {
        setFormulario(EVENTO_VAZIO);
        setIdEmEdicao(null);
        setErroAcao('');
        limparSorteiosEvento();
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
        carregarSorteiosEvento(evento.id);
        setPainelAberto(true);
    };

    // ── Sorteios do evento em edição ──────────────────────────────
    const limparSorteiosEvento = () => {
        setSorteiosEvento([]);
        setNovoSorteioEvento(null);
        setErroSorteioEvento('');
        setIdSorteioConfirmandoExclusao(null);
    };

    /* A API lista todos os sorteios; aqui ficam só os deste evento. */
    const carregarSorteiosEvento = (eventoId) => {
        limparSorteiosEvento();
        setCarregandoSorteiosEvento(true);
        listarSorteios()
            .then((lista) => setSorteiosEvento(lista.filter((sorteio) => sorteio.eventoId === eventoId)))
            .catch((e) => setErroSorteioEvento(e.message))
            .finally(() => setCarregandoSorteiosEvento(false));
    };

    const salvarSorteioEvento = async () => {
        const brinde = novoSorteioEvento.brinde.trim();
        if (!brinde) {
            setErroSorteioEvento('Informe o que vai ser sorteado.');
            return;
        }
        setSalvandoSorteioEvento(true);
        setErroSorteioEvento('');
        try {
            const criado = await criarSorteioComBrinde({ eventoId: idEmEdicao, brinde });
            setSorteiosEvento((anteriores) => [...anteriores, criado]);
            setNovoSorteioEvento(null);
        } catch (e) {
            setErroSorteioEvento(e.message);
        } finally {
            setSalvandoSorteioEvento(false);
        }
    };

    /* O campo do sorteio está dentro do formulário do evento: Enter nele
       salvaria o evento. Aqui ele salva o sorteio. */
    const teclaCampoSorteioEvento = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        salvarSorteioEvento();
    };

    const removerSorteioEvento = async (id) => {
        if (idSorteioConfirmandoExclusao !== id) {
            setIdSorteioConfirmandoExclusao(id);
            return;
        }
        setErroSorteioEvento('');
        try {
            await excluirSorteio(id);
            setSorteiosEvento((anteriores) => anteriores.filter((sorteio) => sorteio.id !== id));
        } catch (e) {
            setErroSorteioEvento(e.message);
        } finally {
            setIdSorteioConfirmandoExclusao(null);
        }
    };

    const adicionarPalestrante = () => {
        setFormulario({
            ...formulario,
            palestrantes: [...formulario.palestrantes, { nome: '', descricao: '', cargo: '' }],
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

    /* A foto escolhida fica guardada no palestrante (arquivoFoto) e só
       sobe depois de "Salvar alterações": o palestrante novo ainda não tem
       id no banco para receber o arquivo. */
    const escolherFotoPalestrante = (indice, arquivo) => {
        if (!arquivo) return;
        setFormulario({
            ...formulario,
            palestrantes: formulario.palestrantes.map((p, i) => {
                if (i !== indice) return p;
                if (p.previaFoto) URL.revokeObjectURL(p.previaFoto);
                // Foto nova começa centralizada: o ajuste da anterior não serve para ela
                return {
                    ...p,
                    ...ENQUADRAMENTO_PADRAO_FOTO_PALESTRANTE,
                    arquivoFoto: arquivo,
                    previaFoto: URL.createObjectURL(arquivo),
                };
            }),
        });
    };

    /* Sobe as fotos pendentes. A resposta do salvar traz os palestrantes
       na mesma ordem do formulário, então o índice casa os dois. Falha de
       upload não desfaz o evento já salvo: vira aviso. */
    const enviarFotosPendentes = async (salvo) => {
        const falhas = [];
        const palestrantes = await Promise.all(salvo.palestrantes.map(async (palestrante, indice) => {
            const arquivo = formulario.palestrantes[indice]?.arquivoFoto;
            if (!arquivo) return palestrante;
            try {
                await enviarFotoPalestrante(palestrante.id, arquivo);
                return { ...palestrante, temFoto: true, versaoFoto: Date.now() };
            } catch (e) {
                falhas.push(`${palestrante.nome}: ${e.message}`);
                return palestrante;
            }
        }));
        return { evento: { ...salvo, palestrantes }, falhas };
    };

    const aplicarEnquadramentoFoto = (indice, enquadramento) => {
        setFormulario({
            ...formulario,
            palestrantes: formulario.palestrantes.map((p, i) => (i === indice ? { ...p, ...enquadramento } : p)),
        });
        setIndiceEnquadramentoFotoAberto(null);
    };

    const srcFotoFormulario = (palestrante) =>
        palestrante.previaFoto || urlFotoPalestrante(palestrante.id, palestrante.versaoFoto);

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
            const salvo = idEmEdicao !== null
                ? await atualizarEvento(idEmEdicao, formulario)
                : await criarEvento(formulario);
            const { evento: comFotos, falhas } = await enviarFotosPendentes(salvo);
            setEventos(idEmEdicao !== null
                ? eventos.map((ev) => (ev.id === idEmEdicao ? comFotos : ev))
                : [...eventos, comFotos]);
            if (falhas.length > 0) {
                // Evento salvo; o painel continua aberto (agora em modo
                // edição) para tentar a foto de novo.
                setIdEmEdicao(comFotos.id);
                setFormulario({
                    ...formulario,
                    ...comFotos,
                    palestrantes: comFotos.palestrantes.map((p, i) => ({
                        ...p,
                        arquivoFoto: formulario.palestrantes[i]?.arquivoFoto,
                        previaFoto: formulario.palestrantes[i]?.previaFoto,
                    })),
                });
                setErroAcao(`Evento salvo, mas a foto não subiu — ${falhas.join(' · ')}`);
                return;
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

    /* Marca o início real do evento. Confirmação em dois cliques, igual à
       exclusão, porque o marco não se desfaz: uma vez gravado, ele passa a
       valer como referência do atraso de todo mundo que fizer check-in.

       A hora vem da resposta, e não de um `new Date()` local — num segundo
       clique o backend devolve a do primeiro. */
    const marcarEventoIniciado = async (id) => {
        if (idConfirmandoInicio !== id) {
            setIdConfirmandoInicio(id);
            return;
        }
        setErroAcao('');
        try {
            const horaIniciado = await iniciarEvento(id);
            setEventos(eventos.map((ev) => (ev.id === id ? { ...ev, horaIniciado } : ev)));
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setIdConfirmandoInicio(null);
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
        if (idTipoEmEdicao === null) return;
        setSalvandoTipo(true);
        setErroTipo('');
        try {
            const atualizado = await atualizarTipoEvento(idTipoEmEdicao, formularioTipo);
            setTiposEvento(tiposEvento.map((t) => (t.id === idTipoEmEdicao ? atualizado : t)));
            cancelarEdicaoTipo();
        } catch (e) {
            setErroTipo(e.message);
        } finally {
            setSalvandoTipo(false);
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
                        Programação, brindes e os sorteios de cada evento
                    </p>
                </div>
            </header>

            {/* Pílulas no desktop; no mobile, uma pílula só que abre um modal de baixo para cima. */}
            <SeletorModalSubabas
                subabas={subabasVisiveisConteudo}
                subabaAtiva={subabaAtivaConteudo}
                aoTrocar={setSubabaAtivaConteudo}
                tituloModal="Conteúdo"
                rotuloAcessivel="Sub-abas de Conteúdo"
            />

            {subabaAtivaConteudo === 'brindes' && <Brindes />}

            {subabaAtivaConteudo === 'eventos' && (<>
                <div className="controlesCabecalhoFinancas barraFerramentasEventosConteudo">
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
                    <div class="btnFiltroConteudo">
                        <button type="button" className="botaoFantasmaFinancas" onClick={abrirPainelTipos}>
                            Tipos de evento
                        </button>
                        <button type="button" className="botaoFantasmaFinancas" onClick={abrirPainelTrilhas}>
                            Trilhas
                        </button>
                    </div>

                    {podeGerenciarEventos && (
                        <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoEvento}>
                            + Novo evento
                        </button>
                    )}
                </div>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}
            {erroAcao && <p className="avisoErroAdmin" role="alert">{erroAcao}</p>}

            {podeGerenciarEventos && erroEscolhaMinicursos && <p className="avisoErroAdmin" role="alert">{erroEscolhaMinicursos}</p>}
            {podeGerenciarEventos && (
                <section className="cartaoEscolhaMinicursosConteudo" aria-label="Escolha de minicursos">
                    <div className="textoEscolhaMinicursosConteudo">
                        <span className="rotuloEscolhaMinicursosConteudo">Escolha de minicursos</span>
                        <p className="notaEscolhaMinicursosConteudo">
                            Fechada, ninguém entra nem sai de minicurso no /participantes — quem já está inscrito continua inscrito.
                        </p>
                    </div>
                    <label className="campoCheckboxEscolhaMinicursosConteudo">
                        <input
                            type="checkbox"
                            checked={Boolean(escolhaMinicursosAberta)}
                            disabled={escolhaMinicursosAberta === null || salvandoEscolhaMinicursos}
                            onInput={(e) => alternarEscolhaMinicursos(e.currentTarget.checked)}
                        />
                        <span>
                            {escolhaMinicursosAberta === null
                                ? 'Carregando…'
                                : escolhaMinicursosAberta ? 'Liberada' : 'Fechada'}
                        </span>
                    </label>
                </section>
            )}

            <div className="envelopeTabelaFinancas">
                {/* Mobile: só os nomes; o toque abre o modal de detalhes. */}
                <ListaItensMobileAdmin
                    itens={carregando ? [] : eventosFiltrados}
                    textoVazio={
                        carregando
                            ? 'Carregando eventos…'
                            : filtro.trim()
                                ? 'Nenhum evento encontrado para esse filtro.'
                                : 'Nenhum evento cadastrado ainda.'
                    }
                    aoSelecionar={(evento) => { setErroAcao(''); setIdEventoDetalhado(evento.id); }}
                />

                <table className="tabelaFinancas tabelaOcultaMobileAdmin">
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
                                    {/* O horário agendado continua sendo o principal; o início
                                        real entra embaixo, como anotação, porque é ele que
                                        vale pro cálculo do atraso no check-in. */}
                                    {evento.horaIniciado && (
                                        <span className="seloEventoIniciadoConteudo">
                                            iniciado {evento.horaIniciado}
                                        </span>
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
                                        {/* Some depois de iniciado: o marco não se desfaz, então
                                            oferecer o clique de novo seria oferecer nada. A hora
                                            fica visível na coluna de data. */}
                                        {podeGerenciarEventos && !evento.horaIniciado && (
                                            <button
                                                type="button"
                                                className={
                                                    idConfirmandoInicio === evento.id
                                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarInicioConteudo'
                                                        : 'botaoAcaoLinhaFinancas'
                                                }
                                                aria-label={
                                                    idConfirmandoInicio === evento.id
                                                        ? `Confirmar início do evento ${evento.nome}`
                                                        : `Iniciar evento ${evento.nome}`
                                                }
                                                title={
                                                    idConfirmandoInicio === evento.id
                                                        ? 'Clique novamente para confirmar'
                                                        : 'Iniciar evento (marca o início real para o cálculo de atraso)'
                                                }
                                                onClick={() => marcarEventoIniciado(evento.id)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M6 4l12 8-12 8Z" />
                                                </svg>
                                            </button>
                                        )}
                                        {evento.ehDebate && (
                                            <a
                                                className="botaoAcaoLinhaFinancas"
                                                href={rotaPainelDebate(evento.id)}
                                                target="_blank"
                                                rel="noopener"
                                                aria-label={`Abrir o painel do telão do debate ${evento.nome}`}
                                                title="Abrir o painel do telão do debate"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                                    <path d="M8 21h8M12 17v4" />
                                                </svg>
                                            </a>
                                        )}
                                        {evento.ehDebate && (
                                            <button
                                                type="button"
                                                className="botaoAcaoLinhaFinancas"
                                                aria-label={`Ver perguntas do debate ${evento.nome}`}
                                                title="Ver perguntas dos participantes"
                                                onClick={() => setEventoPerguntasDebateAberto(evento)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
                                                    <path d="M9.5 8.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5" />
                                                    <path d="M12 14.5h.01" />
                                                </svg>
                                            </button>
                                        )}
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
                                        {podeGerenciarEventos && (
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
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </>)}

            {eventoDetalhado && (
                <ModalDetalhesEvento
                    evento={eventoDetalhado}
                    aoFechar={fecharDetalhesEvento}
                    erro={erroAcao}
                    aoEditar={abrirEdicaoEvento}
                    aoVerPerguntas={setEventoPerguntasDebateAberto}
                    aoIniciar={marcarEventoIniciado}
                    confirmandoInicio={idConfirmandoInicio === eventoDetalhado.id}
                    aoExcluir={removerEvento}
                    confirmandoExclusao={idConfirmandoExclusao === eventoDetalhado.id}
                    podeGerenciar={podeGerenciarEventos}
                />
            )}

            {eventoPerguntasDebateAberto && (
                <ModalPerguntasDebateAdmin
                    evento={eventoPerguntasDebateAberto}
                    aoFechar={() => setEventoPerguntasDebateAberto(null)}
                />
            )}

            {indiceEnquadramentoFotoAberto !== null && formulario.palestrantes[indiceEnquadramentoFotoAberto] && (
                <ModalEnquadramentoFotoPalestrante
                    srcFoto={srcFotoFormulario(formulario.palestrantes[indiceEnquadramentoFotoAberto])}
                    nomePalestrante={formulario.palestrantes[indiceEnquadramentoFotoAberto].nome}
                    enquadramento={formulario.palestrantes[indiceEnquadramentoFotoAberto]}
                    aoAplicar={(enquadramento) => aplicarEnquadramentoFoto(indiceEnquadramentoFotoAberto, enquadramento)}
                    aoFechar={() => setIndiceEnquadramentoFotoAberto(null)}
                />
            )}

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
                                    <input
                                        className="entradaFormularioFinancas"
                                        placeholder="Cargo ou instituição"
                                        maxLength={150}
                                        value={palestrante.cargo}
                                        onInput={(e) => alterarPalestrante(indice, 'cargo', e.currentTarget.value)}
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
                                <div className="linhaFotoPalestranteConteudo">
                                    {palestrante.previaFoto || palestrante.temFoto ? (
                                        <span className="spanMolduraFotoPalestranteConteudo">
                                            <img
                                                className="imgFotoPalestranteConteudo"
                                                src={srcFotoFormulario(palestrante)}
                                                alt={`Foto de ${palestrante.nome || `palestrante ${indice + 1}`}`}
                                                style={estiloEnquadramentoFoto(palestrante)}
                                            />
                                        </span>
                                    ) : (
                                        <span className="spanSemFotoPalestranteConteudo">Sem foto</span>
                                    )}
                                    <label className="botaoFantasmaFinancas botaoMiniAdmin labelBotaoFotoPalestranteConteudo">
                                        {palestrante.previaFoto || palestrante.temFoto ? 'Trocar foto' : 'Enviar foto'}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="inputArquivoFotoPalestranteConteudo"
                                            onChange={(e) => {
                                                escolherFotoPalestrante(indice, e.currentTarget.files?.[0]);
                                                e.currentTarget.value = '';
                                            }}
                                        />
                                    </label>
                                    {(palestrante.previaFoto || palestrante.temFoto) && (
                                        <button
                                            type="button"
                                            className="botaoFantasmaFinancas botaoMiniAdmin"
                                            onClick={() => setIndiceEnquadramentoFotoAberto(indice)}
                                        >
                                            Ajustar enquadramento
                                        </button>
                                    )}
                                    {palestrante.arquivoFoto && (
                                        <span className="spanFotoPendentePalestranteConteudo">sobe ao salvar</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Timer do telão do debate (/debate/<id>/telao). O 1º
                        palestrante é o participante A (esquerda), o 2º o B. */}
                    {ehDebateFormulario && (
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas">Telão do debate</label>
                            <div className="linhaCamposConteudo">
                                <div className="campoFormularioFinancas">
                                    <label className="rotuloCampoFinancas" htmlFor="campoTempoFalaDebate">Tempo de fala (min) *</label>
                                    <input
                                        id="campoTempoFalaDebate"
                                        className="entradaFormularioFinancas"
                                        type="number"
                                        min="0.5"
                                        max="60"
                                        step="0.5"
                                        required
                                        value={formulario.debateTempoFalaMin}
                                        onInput={(e) => setFormulario({ ...formulario, debateTempoFalaMin: e.currentTarget.value })}
                                    />
                                </div>
                                <div className="campoFormularioFinancas">
                                    <label className="rotuloCampoFinancas" htmlFor="campoTempoReplicaDebate">Tempo de réplica (s) *</label>
                                    <input
                                        id="campoTempoReplicaDebate"
                                        className="entradaFormularioFinancas"
                                        type="number"
                                        min="5"
                                        max="3600"
                                        step="5"
                                        required
                                        value={formulario.debateTempoReplicaSeg}
                                        onInput={(e) => setFormulario({ ...formulario, debateTempoReplicaSeg: e.currentTarget.value })}
                                    />
                                </div>
                                <div className="campoFormularioFinancas">
                                    <label className="rotuloCampoFinancas" htmlFor="campoAlertaDebate">Alerta (s antes do fim) *</label>
                                    <input
                                        id="campoAlertaDebate"
                                        className="entradaFormularioFinancas"
                                        type="number"
                                        min="0"
                                        max="3600"
                                        step="1"
                                        required
                                        value={formulario.debateAlertaSeg}
                                        onInput={(e) => setFormulario({ ...formulario, debateAlertaSeg: e.currentTarget.value })}
                                    />
                                </div>
                            </div>
                            {formulario.palestrantes.length !== 2 && (
                                <p className="avisoParticipantesTelaoDebateConteudo">
                                    O telão mostra 2 participantes: o 1º palestrante à esquerda e o 2º à direita.
                                    Este debate tem {formulario.palestrantes.length}.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Sorteios do evento: o que vai ser sorteado (um item cada).
                        Salvos na hora, fora do "Salvar alterações" do evento —
                        por isso só aparecem num evento que já existe. */}
                    <div className="campoFormularioFinancas">
                        <div className="cabecalhoPalestrantesConteudo">
                            <label className="rotuloCampoFinancas semMargemInferiorAdmin">Sorteios</label>
                            {idEmEdicao !== null && novoSorteioEvento === null && (
                                <button
                                    type="button"
                                    className="botaoFantasmaFinancas botaoMiniAdmin"
                                    onClick={() => { setErroSorteioEvento(''); setNovoSorteioEvento(NOVO_SORTEIO_EVENTO_VAZIO); }}
                                >
                                    + Adicionar sorteio
                                </button>
                            )}
                        </div>

                        {idEmEdicao === null && (
                            <p className="avisoVazioPalestrantesConteudo">Salve o evento para adicionar sorteios.</p>
                        )}

                        {idEmEdicao !== null && carregandoSorteiosEvento && (
                            <p className="avisoVazioPalestrantesConteudo">Carregando sorteios…</p>
                        )}

                        {idEmEdicao !== null && !carregandoSorteiosEvento
                            && sorteiosEvento.length === 0 && novoSorteioEvento === null && (
                            <p className="avisoVazioPalestrantesConteudo">Nenhum sorteio neste evento.</p>
                        )}

                        {sorteiosEvento.length > 0 && (
                            <ul className="listaSorteiosEventoConteudo">
                                {sorteiosEvento.map((sorteio) => {
                                    const confirmandoExclusaoSorteio = idSorteioConfirmandoExclusao === sorteio.id;
                                    const temEntregas = sorteio.quantidadeEntregue > 0;
                                    return (
                                        <li key={sorteio.id} className="itemSorteioEventoConteudo">
                                            <span className="textoSorteioEventoConteudo">
                                                <strong>{sorteio.nome}</strong>
                                            </span>
                                            {temEntregas && (
                                                <span className="seloSorteadoEventoConteudo">já sorteado</span>
                                            )}
                                            {/* Com ganhador registrado não sai: levaria junto o
                                                histórico de quem ganhou. */}
                                            <button
                                                type="button"
                                                className={
                                                    confirmandoExclusaoSorteio
                                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                        : 'botaoAcaoLinhaFinancas'
                                                }
                                                disabled={temEntregas}
                                                aria-label={
                                                    confirmandoExclusaoSorteio
                                                        ? `Confirmar remoção do sorteio ${sorteio.nome}`
                                                        : `Remover sorteio ${sorteio.nome}`
                                                }
                                                title={
                                                    temEntregas
                                                        ? 'Já tem ganhador — não pode ser removido'
                                                        : confirmandoExclusaoSorteio
                                                            ? 'Clique novamente para confirmar'
                                                            : 'Remover'
                                                }
                                                onClick={() => removerSorteioEvento(sorteio.id)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {novoSorteioEvento !== null && (
                            <div className="cartaoPalestranteConteudo">
                                <div className="campoFormularioFinancas">
                                    <input
                                        className="entradaFormularioFinancas"
                                        placeholder="O que vai ser sorteado *"
                                        aria-label="O que vai ser sorteado"
                                        autoFocus
                                        value={novoSorteioEvento.brinde}
                                        onInput={(e) => setNovoSorteioEvento({ ...novoSorteioEvento, brinde: e.currentTarget.value })}
                                        onKeyDown={teclaCampoSorteioEvento}
                                    />
                                </div>
                                <div className="acoesNovoSorteioEventoConteudo">
                                    <button
                                        type="button"
                                        className="botaoFantasmaFinancas botaoMiniAdmin"
                                        onClick={() => { setNovoSorteioEvento(null); setErroSorteioEvento(''); }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="botaoPrimarioFinancas botaoMiniAdmin"
                                        disabled={salvandoSorteioEvento}
                                        onClick={salvarSorteioEvento}
                                    >
                                        {salvandoSorteioEvento ? 'Salvando…' : 'Salvar sorteio'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {erroSorteioEvento && <p className="avisoErroAdmin" role="alert">{erroSorteioEvento}</p>}
                    </div>

                    {/* Erro do salvar (ex.: alerta do debate maior que a fala,
                        foto que não subiu) — visível sem fechar o painel. */}
                    {erroAcao && <p className="avisoErroAdmin" role="alert">{erroAcao}</p>}

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
                        <p className="avisoVazioPalestrantesConteudo">Nenhum tipo carregado.</p>
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
                            </div>
                        </li>
                    ))}
                </ul>

                {idTipoEmEdicao !== null && (
                    <form className="formularioFinancas" onSubmit={salvarTipo}>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoNomeTipo">
                                Editando tipo *
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
                            <button type="button" className="botaoFantasmaFinancas" onClick={cancelarEdicaoTipo}>
                                Cancelar edição
                            </button>
                            <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoTipo}>
                                {salvandoTipo ? 'Salvando…' : 'Salvar tipo'}
                            </button>
                        </div>
                    </form>
                )}
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

/* ── Modal de detalhes do evento (mobile) ─────────────────────────
   No mobile a tabela vira uma lista de nomes; este modal mostra o resto
   das colunas e as mesmas ações, com texto em vez de só ícone. As ações
   que abrem outra coisa (painel de edição, perguntas do debate) fecham
   este antes, para não empilhar. */
function ModalDetalhesEvento({
    evento, aoFechar, erro,
    aoEditar, aoVerPerguntas,
    aoIniciar, confirmandoInicio,
    aoExcluir, confirmandoExclusao,
    podeGerenciar,
}) {
    const horarioEvento = evento.horaInicio
        ? `${evento.horaInicio}${evento.horaFim ? `–${evento.horaFim}` : ''}`
        : '';
    const palestrantesEvento = evento.palestrantes && evento.palestrantes.length > 0
        ? evento.palestrantes.map((p) => p.nome).join(', ')
        : '—';

    return (
        <ModalInferiorAdmin titulo={evento.nome} subtitulo={evento.tipo} aoFechar={aoFechar}>
            {(fecharDetalhes) => (
                <>
                    <dl className="listaDetalhesItemModalInferiorAdmin">
                        <div className="linhaDetalheItemModalInferiorAdmin">
                            <dt className="rotuloDetalheItemModalInferiorAdmin">Data</dt>
                            <dd className="valorDetalheItemModalInferiorAdmin">
                                {formatarDataEvento(evento.data)}{horarioEvento && ` · ${horarioEvento}`}
                                {evento.horaIniciado && (
                                    <span className="seloEventoIniciadoConteudo">iniciado {evento.horaIniciado}</span>
                                )}
                            </dd>
                        </div>
                        <div className="linhaDetalheItemModalInferiorAdmin">
                            <dt className="rotuloDetalheItemModalInferiorAdmin">Trilha</dt>
                            <dd className="valorDetalheItemModalInferiorAdmin">{evento.trilhaNome || '—'}</dd>
                        </div>
                        <div className="linhaDetalheItemModalInferiorAdmin">
                            <dt className="rotuloDetalheItemModalInferiorAdmin">Local</dt>
                            <dd className="valorDetalheItemModalInferiorAdmin">{evento.local || '—'}</dd>
                        </div>
                        <div className="linhaDetalheItemModalInferiorAdmin">
                            <dt className="rotuloDetalheItemModalInferiorAdmin">Capacidade</dt>
                            <dd className="valorDetalheItemModalInferiorAdmin">{evento.capacidadeMaxima ?? '—'}</dd>
                        </div>
                        <div className="linhaDetalheItemModalInferiorAdmin">
                            <dt className="rotuloDetalheItemModalInferiorAdmin">Palestrantes</dt>
                            <dd className="valorDetalheItemModalInferiorAdmin">{palestrantesEvento}</dd>
                        </div>
                    </dl>

                    {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

                    <div className="grupoAcoesItemModalInferiorAdmin">
                        <button
                            type="button"
                            className="botaoAcaoItemModalInferiorAdmin botaoAcaoPrincipalItemModalInferiorAdmin"
                            onClick={() => fecharDetalhes(() => aoEditar(evento))}
                        >
                            Editar
                        </button>
                        {evento.ehDebate && (
                            <button
                                type="button"
                                className="botaoAcaoItemModalInferiorAdmin"
                                onClick={() => fecharDetalhes(() => aoVerPerguntas(evento))}
                            >
                                Ver perguntas
                            </button>
                        )}
                        {/* Mesma aba no celular: o voltar do navegador traz de
                            volta ao /admin. O painel vira controle remoto. */}
                        {evento.ehDebate && (
                            <a
                                className="botaoAcaoItemModalInferiorAdmin"
                                href={rotaPainelDebate(evento.id)}
                            >
                                Controlar telão
                            </a>
                        )}

                        {/* Iniciar e excluir só para quem gerencia a programação. */}
                        {podeGerenciar && (
                            <div className="linhaAcoesDestrutivasItemModalInferiorAdmin">
                                {/* Some depois de iniciado: o marco não se desfaz. */}
                                {!evento.horaIniciado && (
                                    <button
                                        type="button"
                                        className={`botaoAcaoItemModalInferiorAdmin ${confirmandoInicio ? 'botaoConfirmarInicioConteudo' : ''}`}
                                        onClick={() => aoIniciar(evento.id)}
                                    >
                                        {confirmandoInicio ? 'Toque de novo para iniciar' : 'Iniciar evento'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={`botaoAcaoItemModalInferiorAdmin botaoAcaoPerigoItemModalInferiorAdmin ${confirmandoExclusao ? 'botaoAcaoConfirmandoItemModalInferiorAdmin' : ''}`}
                                    onClick={() => aoExcluir(evento.id)}
                                >
                                    {confirmandoExclusao ? 'Toque de novo para excluir' : 'Excluir'}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </ModalInferiorAdmin>
    );
}

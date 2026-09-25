/* Área do participante — acessível em /participantes, restrita a quem tem
   role PARTICIPANTE (ver auth/sessao.js e main.jsx).

   Programação e agenda são reais: vêm de /api/evento e /api/evento/meus.
   O participante já entra nas palestras ao ter a inscrição confirmada no
   /admin; minicursos ele escolhe aqui, respeitando lotação e um por
   faixa de horário (ver data/apiEventosParticipantes.js).

   Nível/XP é real, creditado no check-in (ver
   InscricaoEventoService.marcarPresente no backend) e lido de
   data/apiPerfilParticipante.js. Ranking também é real, vindo de
   GET /api/pessoa/ranking (data/apiRankingParticipante.js) e fatiado em
   pódio/lista por data/rankingParticipantes.js. As regras de XP do card
   "COMO GANHAR XP" também são reais (GET /api/regra-xp, ver
   data/apiRegrasXpParticipante.js) e editáveis em /admin.

   Conquistas também são reais (GET /api/conquista/minhas): vêm só as
   ativas, cada uma marcada como desbloqueada ou não. Perfil
   (curso/inscrição/minicursos/presenças) e certificados seguem em
   mockParticipante.js — nenhum endpoint expõe esses outros dados ainda.
   Nome e e-mail exibidos são os reais, tirados da sessão. */

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useLocation } from 'wouter';
import { lerSessao, limparSessao } from '../../auth/sessao.js';
import './participantes.css';

import QrCrachaParticipantes from './QrCrachaParticipantes.jsx';
import ModalEscolhaMinicursos from './ModalEscolhaMinicursos.jsx';
import ModalEscolhaDiasIngresso from './ModalEscolhaDiasIngresso.jsx';
import MenuPerfilParticipantes from './MenuPerfilParticipantes.jsx';
import MenuFabParticipantes from './MenuFabParticipantes.jsx';
import SecaoInicioParticipantes from './sections/SecaoInicioParticipantes.jsx';
import SecaoAgendaParticipantes from './sections/SecaoAgendaParticipantes.jsx';
import SecaoDesafiosParticipantes from './sections/SecaoDesafiosParticipantes.jsx';
import SecaoRankingParticipantes from './sections/SecaoRankingParticipantes.jsx';
import SecaoPerfilParticipantes from './sections/SecaoPerfilParticipantes.jsx';

import {
    listarEventosParticipantes,
    listarMeusEventosParticipantes,
    inscreverEmMinicurso,
    cancelarMinicurso,
} from './data/apiEventosParticipantes.js';
import { buscarNivelParticipante } from './data/apiPerfilParticipante.js';
import {
    buscarDiasIngressoParticipante,
    salvarDiasIngressoParticipante,
} from './data/apiDiasIngressoParticipante.js';
import { buscarRankingParticipante } from './data/apiRankingParticipante.js';
import { buscarRegrasXpParticipante } from './data/apiRegrasXpParticipante.js';
import { listarMinhasConquistas, marcarConquistaComoVista } from './data/apiConquistasParticipante.js';
import { carregarDesafiosParticipantes } from './data/desafiosParticipantes.js';
import ConquistaDesbloqueada, { MODO_TESTE_CONQUISTA } from '../../components/ConquistaDesbloqueada/ConquistaDesbloqueada.jsx';
import { montarRankingExibicao } from './data/rankingParticipantes.js';
import {
    montarDiasDaSemana,
    diaInicialAgenda,
    palestrasDoDia,
    montarMeuDia,
    montarMinicursos,
    atividadeAgora,
    proximaAtividade,
    ehMinicurso,
    diaDoEvento,
} from './data/agendaParticipantes.js';

import {
    perfilMockParticipante,
    certificadosMockParticipante,
} from './mockParticipante.js';

const RANKING_VAZIO_PARTICIPANTES = { totalParticipantes: 0, atualizadoEm: '', podio: [], lista: [] };

const ABAS_PARTICIPANTES = [
    { id: 'inicio', rotulo: 'Início' },
    { id: 'agenda', rotulo: 'Agenda' },
    { id: 'desafios', rotulo: 'Desafios' },
    { id: 'ranking', rotulo: 'Ranking' },
    { id: 'perfil', rotulo: 'Perfil' },
];

const CERTIFICADOS_LIBERADOS_PARTICIPANTES = false;

/* Aba de entrada pela URL: `/participantes?tab=desafios`. Mesmo nome de
   parâmetro que o /inscricoes usa. Quem volta do Termo cai direto nos
   desafios em vez de no início; valor desconhecido cai no padrão. */
function abaInicialParticipantes() {
    const pedida = new URLSearchParams(window.location.search).get('tab');
    return ABAS_PARTICIPANTES.some((aba) => aba.id === pedida) ? pedida : 'inicio';
}

/* Quanto o conteúdo leva pra sumir antes de a aba trocar de fato. Casa com
   a transição de saída de .conteudoAbaParticipantes no css: a aba só é
   substituída depois que a anterior já saiu de vista. */
const DURACAO_SAIDA_ABA_PARTICIPANTES = 180;

/* De quanto em quanto tempo o relógio da página avança — é ele que move
   um item de "a seguir" para "acontece agora". */
const INTERVALO_RELOGIO_PARTICIPANTES = 60000;

/* '2026-10-26' → 'SEG 26/10', o rótulo de dia do modal do QR. */
const ROTULOS_DIA_INGRESSO_QR = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
function formatarDiaIngressoQr(dia) {
    const data = new Date(`${dia}T00:00:00`);
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${ROTULOS_DIA_INGRESSO_QR[data.getDay()]} ${data.getDate()}/${mes}`;
}

function iniciaisNomeParticipante(nome) {
    if (!nome) return '';
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] ?? '';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
}

export default function Participantes() {
    const [, navegar] = useLocation();
    const sessao = lerSessao();
    const nomeParticipante = sessao?.nome ?? 'Participante';
    const emailParticipante = sessao?.email ?? '';
    const iniciais = iniciaisNomeParticipante(nomeParticipante);

    const [abaAtiva, setAbaAtiva] = useState(abaInicialParticipantes);
    const [trocandoAba, setTrocandoAba] = useState(false);
    const temporizadorTrocaAbaRef = useRef(null);
    const [qrAberto, setQrAberto] = useState(false);
    const [escolhaMinicursosAberta, setEscolhaMinicursosAberta] = useState(false);

    const [eventos, setEventos] = useState([]);
    const [meusEventos, setMeusEventos] = useState([]);
    const [carregandoAgenda, setCarregandoAgenda] = useState(true);
    const [erroAgenda, setErroAgenda] = useState('');
    const [nivel, setNivel] = useState(null);
    const [carregandoNivel, setCarregandoNivel] = useState(true);
    const [ranking, setRanking] = useState(RANKING_VAZIO_PARTICIPANTES);
    const [regrasXp, setRegrasXp] = useState([]);
    const [conquistas, setConquistas] = useState([]);
    /* Fila da celebração: as conquistas que o participante ganhou e ainda
       não viu a animação. Capturada uma vez, ao carregar — o backend marca
       cada uma como vista, então um recarregamento não a repõe. */
    const [conquistasACelebrar, setConquistasACelebrar] = useState([]);
    const [diaSelecionado, setDiaSelecionado] = useState('');
    const [erroMinicurso, setErroMinicurso] = useState('');
    const [minicursoEmEspera, setMinicursoEmEspera] = useState(null);

    /* Ingresso diário: em quais dias o QR vale. null até carregar (e para
       sempre, se a chamada falhar — aí a página segue como ingresso cheio,
       e o check-in continua barrando no backend). */
    const [diasIngresso, setDiasIngresso] = useState(null);
    const [escolhaDiasAberta, setEscolhaDiasAberta] = useState(false);
    const [salvandoDiasIngresso, setSalvandoDiasIngresso] = useState(false);
    const [erroDiasIngresso, setErroDiasIngresso] = useState('');

    /* Desafios são carregados só quando a aba é aberta: a maioria das
       visitas não passa por ela, e seria mais uma requisição em toda
       entrada na área do participante. */
    const [desafios, setDesafios] = useState([]);
    const [carregandoDesafios, setCarregandoDesafios] = useState(false);
    const [erroDesafios, setErroDesafios] = useState('');
    const [desafiosCarregados, setDesafiosCarregados] = useState(false);

    const [agora, setAgora] = useState(() => new Date());

    /* O `?tab=` já foi lido na montagem; tirá-lo da URL evita que um F5
       depois de trocar de aba na mão devolva a pessoa à aba de entrada. */
    useEffect(() => {
        if (!window.location.search) return;
        window.history.replaceState(null, '', window.location.pathname);
    }, []);

    useEffect(() => {
        if (abaAtiva !== 'desafios' || desafiosCarregados) return;
        let ativo = true;
        setCarregandoDesafios(true);
        setErroDesafios('');
        carregarDesafiosParticipantes()
            .then((lista) => {
                if (!ativo) return;
                setDesafios(lista);
                setDesafiosCarregados(true);
            })
            .catch(() => { if (ativo) setErroDesafios('Não foi possível carregar os desafios.'); })
            .finally(() => { if (ativo) setCarregandoDesafios(false); });
        return () => { ativo = false; };
    }, [abaAtiva, desafiosCarregados]);

    useEffect(() => {
        const relogio = setInterval(() => setAgora(new Date()), INTERVALO_RELOGIO_PARTICIPANTES);
        return () => clearInterval(relogio);
    }, []);

    useEffect(() => {
        let ativo = true;
        carregarAgenda()
            .catch((erro) => { if (ativo) setErroAgenda(erro.message); })
            .finally(() => { if (ativo) setCarregandoAgenda(false); });
        return () => { ativo = false; };
    }, []);

    /* Nível/xp real, separado da agenda: uma falha aqui não deve impedir
       a programação de aparecer, e vice-versa. */
    useEffect(() => {
        let ativo = true;
        buscarNivelParticipante()
            .then((valor) => { if (ativo) setNivel(valor); })
            .catch(() => {})
            .finally(() => { if (ativo) setCarregandoNivel(false); });
        return () => { ativo = false; };
    }, []);

    /* Dias do ingresso diário. Separado da agenda como os demais: uma
       falha aqui não derruba a página. */
    useEffect(() => {
        let ativo = true;
        buscarDiasIngressoParticipante()
            .then((valor) => { if (ativo && valor) setDiasIngresso(valor); })
            .catch(() => {});
        return () => { ativo = false; };
    }, []);

    /* Ranking real, também separado da agenda. */
    useEffect(() => {
        let ativo = true;
        buscarRankingParticipante()
            .then((resposta) => { if (ativo && resposta) setRanking(montarRankingExibicao(resposta)); })
            .catch(() => {});
        return () => { ativo = false; };
    }, []);

    /* Regras de XP reais. Falham em silêncio: sem elas o card "COMO
       GANHAR XP" simplesmente não aparece, e o resto da aba continua. */
    useEffect(() => {
        let ativo = true;
        buscarRegrasXpParticipante()
            .then((lista) => { if (ativo && lista) setRegrasXp(lista); })
            .catch(() => {});
        return () => { ativo = false; };
    }, []);

    /* Conquistas reais. Falham em silêncio como o ranking: a lista vazia
       simplesmente esconde os blocos, e um erro aqui não deve derrubar a
       agenda nem o resto da página. */
    useEffect(() => {
        let ativo = true;
        listarMinhasConquistas()
            .then((lista) => {
                if (!ativo) return;
                setConquistas(lista ?? []);
                /* Da mais comum para a mais rara: a melhor fecha a fila.
                   No modo de teste entram todas as já conquistadas, e não
                   só as ainda não celebradas — é o que faz a animação
                   reaparecer a cada recarregamento (ver
                   MODO_TESTE_CONQUISTA). */
                setConquistasACelebrar(
                    (lista ?? [])
                        .filter((c) => (MODO_TESTE_CONQUISTA ? c.desbloqueada : c.celebrar))
                        .sort((a, b) => (a.raridade ?? 1) - (b.raridade ?? 1)),
                );
            })
            .catch(() => {});
        return () => { ativo = false; };
    }, []);

    /* Programação da semana + em que o participante está. As duas são
       buscadas juntas porque as vagas restantes de um minicurso mudam
       sempre que alguém entra ou sai, mas falham separado: a programação
       é pública e deve aparecer mesmo se a agenda pessoal der erro. */
    async function carregarAgenda() {
        const [programacao, meus] = await Promise.allSettled([
            listarEventosParticipantes(),
            listarMeusEventosParticipantes(),
        ]);

        if (programacao.status === 'fulfilled') {
            setEventos(programacao.value);
        }
        if (meus.status === 'fulfilled') {
            setMeusEventos(meus.value ?? []);
        }

        const falha = programacao.status === 'rejected' ? programacao.reason : meus.reason;
        if (falha) {
            throw falha;
        }
    }

    /* Diarista que ainda não completou a escolha não passa daqui: o modal
       abre sozinho e só fecha depois de confirmar. Sem programação
       publicada não há o que escolher, então não trava a página. */
    const escolhaDiasPendente = Boolean(
        diasIngresso?.porDia
            && diasIngresso.diasDisponiveis.length > 0
            && diasIngresso.diasEscolhidos.length < diasIngresso.diasContratados,
    );

    /* A agenda do diarista é só a dos dias do ingresso dele: palestras,
       minicursos e o "acontece agora" dos outros dias não são dele. */
    const eventosDoIngresso = useMemo(() => {
        if (!diasIngresso?.porDia || diasIngresso.diasEscolhidos.length === 0) return eventos;
        const diasValidos = new Set(diasIngresso.diasEscolhidos);
        return eventos.filter((evento) => diasValidos.has(diaDoEvento(evento)));
    }, [eventos, diasIngresso]);

    const diasSemana = useMemo(() => montarDiasDaSemana(eventosDoIngresso, agora), [eventosDoIngresso, agora]);

    /* Abre no dia de hoje quando há programação hoje; fora da semana do
       evento, no próximo dia com atividade. */
    useEffect(() => {
        if (diasSemana.length === 0) return;
        if (diasSemana.some((dia) => dia.id === diaSelecionado)) return;
        setDiaSelecionado(diaInicialAgenda(diasSemana, agora));
    }, [diasSemana]);

    const palestrasDoDiaSelecionado = useMemo(
        () => palestrasDoDia(eventosDoIngresso, diaSelecionado, agora),
        [eventosDoIngresso, diaSelecionado, agora],
    );

    const meuDia = useMemo(
        () => montarMeuDia(eventosDoIngresso, meusEventos, diaSelecionado, agora),
        [eventosDoIngresso, meusEventos, diaSelecionado, agora],
    );

    const minicursos = useMemo(
        () => montarMinicursos(eventosDoIngresso, meusEventos, agora),
        [eventosDoIngresso, meusEventos, agora],
    );

    const meusMinicursos = useMemo(() => minicursos.filter((curso) => curso.escolhido), [minicursos]);

    const atividadeAtual = useMemo(
        () => atividadeAgora(eventosDoIngresso, meusEventos, agora),
        [eventosDoIngresso, meusEventos, agora],
    );

    const atividadeSeguinte = useMemo(
        () => proximaAtividade(eventosDoIngresso, meusEventos, agora),
        [eventosDoIngresso, meusEventos, agora],
    );

    const totalMinicursos = useMemo(() => eventosDoIngresso.filter(ehMinicurso).length, [eventosDoIngresso]);

    /* Widget de ranking do Início é compacto: sem a cauda extra que só
       aparece na aba Ranking pra preencher telas grandes. */
    const rankingWidgetInicio = useMemo(
        () => ({ ...ranking, lista: ranking.lista.filter((pessoa) => !pessoa.extraTelaGrande) }),
        [ranking],
    );

    /* Troca de aba em dois tempos: o conteúdo atual some, e só então o novo
       entra. Sem isso a tela pisca do conteúdo antigo pro novo. Repetir a
       aba atual não faz nada — não vale piscar a tela à toa.

       A aba nova sempre começa do topo: o salto acontece com o conteúdo
       antigo já invisível, então não aparece. Rolagem nativa — o Lenis é
       desligado nesta página (ver efeito abaixo). */
    function irPara(aba) {
        setQrAberto(false);
        if (aba === abaAtiva) return;

        setTrocandoAba(true);
        clearTimeout(temporizadorTrocaAbaRef.current);
        temporizadorTrocaAbaRef.current = setTimeout(() => {
            setAbaAtiva(aba);
            window.scrollTo(0, 0);
            setTrocandoAba(false);
        }, DURACAO_SAIDA_ABA_PARTICIPANTES);
    }

    useEffect(() => () => clearTimeout(temporizadorTrocaAbaRef.current), []);

    /* A área do participante usa a rolagem nativa: o Lenis global (criado
       no index.html) é destruído ao entrar e recriado ao sair, para o resto
       do site seguir com a rolagem suave. */
    useEffect(() => {
        window.lenis?.destroy();
        window.lenis = null;
        return () => {
            if (!window.lenis && window.criarLenis) window.lenis = window.criarLenis();
        };
    }, []);

    function sair() {
        limparSessao();
        navegar('/');
    }

    /* Volta pro site sem mexer na sessão — quem sair por aqui continua
       logado e reentra em /participantes sem passar pelo login. */
    function irParaPaginaPrincipal() {
        navegar('/');
    }

    function abrirEscolhaMinicursos() {
        setErroMinicurso('');
        setEscolhaMinicursosAberta(true);
    }

    /* Entrar/sair de minicurso recarrega a agenda em seguida: a vaga que
       acabou de ser tomada (ou liberada) precisa aparecer para todos.
       Devolve se a operação deu certo — o modal de escolha só avança
       para o próximo dia quando a inscrição realmente entrou. */
    async function alterarMinicurso(eventoId, acao) {
        setErroMinicurso('');
        setMinicursoEmEspera(eventoId);
        let deuCerto = true;
        try {
            await acao(eventoId);
        } catch (erro) {
            deuCerto = false;
            setErroMinicurso(erro.message);
        } finally {
            try {
                await carregarAgenda();
            } catch (erro) {
                setErroAgenda(erro.message);
            }
            setMinicursoEmEspera(null);
        }
        return deuCerto;
    }

    function abrirEscolhaDiasIngresso() {
        setErroDiasIngresso('');
        setQrAberto(false);
        setEscolhaDiasAberta(true);
    }

    /* Trocar de dia pode desfazer minicursos do dia que saiu (o backend
       libera a vaga), então a agenda é recarregada em seguida. */
    async function salvarDiasIngresso(dias) {
        setErroDiasIngresso('');
        setSalvandoDiasIngresso(true);
        try {
            const atualizado = await salvarDiasIngressoParticipante(dias);
            if (atualizado) setDiasIngresso(atualizado);
            setEscolhaDiasAberta(false);
            await carregarAgenda().catch((erro) => setErroAgenda(erro.message));
        } catch (erro) {
            setErroDiasIngresso(erro.message);
        } finally {
            setSalvandoDiasIngresso(false);
        }
    }

    const escolherMinicurso = (eventoId) => alterarMinicurso(eventoId, inscreverEmMinicurso);
    const sairDoMinicurso = (eventoId) => alterarMinicurso(eventoId, cancelarMinicurso);

    return (
        <div className="paginaParticipantes">
            <header className="cabecalhoParticipantes">
                <span className="logoCabecalhoParticipantes">
                    SEMAC <span className="destaqueLogoCabecalhoParticipantes">XXXVI</span>
                </span>

                <nav className="navDesktopParticipantes" aria-label="Seções da área do participante">
                    {ABAS_PARTICIPANTES.map((aba) => (
                        <button
                            key={aba.id}
                            type="button"
                            className={
                                abaAtiva === aba.id
                                    ? 'itemNavDesktopParticipantes itemNavDesktopAtivoParticipantes'
                                    : 'itemNavDesktopParticipantes'
                            }
                            onClick={() => irPara(aba.id)}
                        >
                            {aba.rotulo.toUpperCase()}
                        </button>
                    ))}
                </nav>

                <div className="acoesCabecalhoParticipantes">
                    <button type="button" className="botaoQrCabecalhoParticipantes" onClick={() => setQrAberto(true)}>
                        MEU QR CODE
                    </button>
                    <span className="nomeCabecalhoParticipantes">{nomeParticipante.split(' ')[0]}</span>
                    <MenuPerfilParticipantes
                        nome={nomeParticipante}
                        email={emailParticipante}
                        iniciais={iniciais}
                        onIrParaPaginaPrincipal={irParaPaginaPrincipal}
                        onSair={sair}
                    />
                </div>
            </header>

            <main className="conteudoParticipantes">
                {erroAgenda && (
                    <p className="avisoErroAgendaParticipantes" role="alert">{erroAgenda}</p>
                )}

                <div
                    className={
                        trocandoAba
                            ? 'conteudoAbaParticipantes conteudoAbaSaindoParticipantes'
                            : 'conteudoAbaParticipantes'
                    }
                >
                    {abaAtiva === 'inicio' && (
                        <SecaoInicioParticipantes
                            nivel={nivel}
                            carregandoNivel={carregandoNivel}
                            atividadeAtual={atividadeAtual}
                            atividadeSeguinte={atividadeSeguinte}
                            meuDia={meuDia}
                            palestrasDoDia={palestrasDoDiaSelecionado}
                            conquistas={conquistas}
                            meusMinicursos={meusMinicursos}
                            totalMinicursos={totalMinicursos}
                            ranking={rankingWidgetInicio}
                            carregando={carregandoAgenda}
                            onAbrirQr={() => setQrAberto(true)}
                            onVerRanking={() => irPara('ranking')}
                            onVerAgenda={() => irPara('agenda')}
                            onEscolherMinicursos={abrirEscolhaMinicursos}
                        />
                    )}
                    {abaAtiva === 'agenda' && (
                        <SecaoAgendaParticipantes
                            diasSemana={diasSemana}
                            diaSelecionado={diaSelecionado}
                            onSelecionarDia={setDiaSelecionado}
                            meuDia={meuDia}
                            carregando={carregandoAgenda}
                        />
                    )}
                    {abaAtiva === 'desafios' && (
                        <SecaoDesafiosParticipantes
                            desafios={desafios}
                            carregando={carregandoDesafios}
                            erro={erroDesafios}
                            onAbrir={(rota) => navegar(rota)}
                        />
                    )}
                    {abaAtiva === 'ranking' && (
                        <SecaoRankingParticipantes ranking={ranking} regrasXp={regrasXp} />
                    )}
                    {abaAtiva === 'perfil' && (
                        <SecaoPerfilParticipantes
                            nome={nomeParticipante}
                            email={emailParticipante}
                            iniciais={iniciais}
                            nivel={nivel}
                            perfil={perfilMockParticipante}
                            conquistas={conquistas}
                            certificados={certificadosMockParticipante}
                            certificadosLiberados={CERTIFICADOS_LIBERADOS_PARTICIPANTES}
                            onAbrirQr={() => setQrAberto(true)}
                        />
                    )}
                </div>
            </main>

            <MenuFabParticipantes
                abas={ABAS_PARTICIPANTES}
                abaAtiva={abaAtiva}
                onIrPara={irPara}
            />

            {escolhaMinicursosAberta && (
                <ModalEscolhaMinicursos
                    minicursos={minicursos}
                    minicursoEmEspera={minicursoEmEspera}
                    erroMinicurso={erroMinicurso}
                    onEscolher={escolherMinicurso}
                    onSair={sairDoMinicurso}
                    onFechar={() => setEscolhaMinicursosAberta(false)}
                />
            )}

            {diasIngresso && (escolhaDiasPendente || escolhaDiasAberta) && (
                <ModalEscolhaDiasIngresso
                    diasIngresso={diasIngresso}
                    obrigatorio={escolhaDiasPendente}
                    salvando={salvandoDiasIngresso}
                    erro={erroDiasIngresso}
                    onSalvar={salvarDiasIngresso}
                    onFechar={() => setEscolhaDiasAberta(false)}
                />
            )}

            {conquistasACelebrar.length > 0 && !escolhaDiasPendente && (
                <ConquistaDesbloqueada
                    conquistas={conquistasACelebrar}
                    /* No modo de teste não confirma nada: se marcasse, a
                       animação não voltaria no próximo recarregamento. */
                    onCelebrada={MODO_TESTE_CONQUISTA ? undefined : marcarConquistaComoVista}
                    onConcluir={() => {
                        setConquistasACelebrar([]);
                        /* O xp e o nível da página foram creditados antes de
                           ela abrir, então já estão certos; o que muda é só
                           a marcação de vista, que não afeta a tela. */
                    }}
                />
            )}

            {qrAberto && (
                <div className="sobreposicaoQrParticipantes" onClick={() => setQrAberto(false)}>
                    <div className="modalQrParticipantes" onClick={(evento) => evento.stopPropagation()}>
                        {/*<button*/}
                        {/*    type="button"*/}
                        {/*    className="botaoFecharModalQrParticipantes"*/}
                        {/*    onClick={() => setQrAberto(false)}*/}
                        {/*    aria-label="Fechar"*/}
                        {/*>*/}
                        {/*    ×*/}
                        {/*</button>*/}
                        <div className="cabecalhoModalQrParticipantes">
                            <div className="textoCabecalhoModalQrParticipantes">
                                <span className="tituloModalQrParticipantes">MEU CRACHÁ</span>
                                <span className="subtituloModalQrParticipantes">Mostre na entrada da atividade</span>
                            </div>

                        </div>

                        {escolhaDiasPendente ? (
                            <div className="avisoDiasModalQrParticipantes">
                                <span>
                                    Seu ingresso é diário. Escolha os dias em que vai participar para liberar o
                                    seu QR code.
                                </span>
                                <button type="button" className="botaoDiasModalQrParticipantes" onClick={abrirEscolhaDiasIngresso}>
                                    ESCOLHER MEUS DIAS
                                </button>
                            </div>
                        ) : (
                            <QrCrachaParticipantes tamanho={200} uuidParticipante={sessao?.uuid} />
                        )}
                        <div className="identidadeModalQrParticipantes">
                            <span className="nomeModalQrParticipantes">{nomeParticipante.toUpperCase()}</span>
                        </div>
                        {diasIngresso?.porDia && !escolhaDiasPendente && diasIngresso.diasEscolhidos.length > 0 && (
                            <div className="avisoDiasModalQrParticipantes">
                                <span className="rotuloDiasModalQrParticipantes">
                                    VÁLIDO EM: {diasIngresso.diasEscolhidos.map(formatarDiaIngressoQr).join(' · ')}
                                </span>
                                {diasIngresso.diasEscolhidos.length > diasIngresso.diasTravados.length && (
                                    <button type="button" className="botaoTrocarDiasModalQrParticipantes" onClick={abrirEscolhaDiasIngresso}>
                                        trocar dias
                                    </button>
                                )}
                            </div>
                        )}
                        {/*{(atividadeAtual || atividadeSeguinte) && (*/}
                        {/*    <div className="avisoAgoraModalQrParticipantes">*/}
                        {/*        /!*<span className="tagAgoraModalQrParticipantes">*!/*/}
                        {/*        /!*    {atividadeAtual ? 'AGORA' : 'A SEGUIR'}*!/*/}
                        {/*        /!*</span>*!/*/}
                        {/*        <span className="textoAgoraModalQrParticipantes">*/}
                        {/*            {(atividadeAtual ?? atividadeSeguinte).dia} ·{' '}*/}
                        {/*            {(atividadeAtual ?? atividadeSeguinte).horario} ·{' '}*/}
                        {/*            {(atividadeAtual ?? atividadeSeguinte).local} {' '}*/}
                        {/*            <br/>*/}
                        {/*            {(atividadeAtual ?? atividadeSeguinte).titulo}*/}
                        {/*        </span>*/}
                        {/*    </div>*/}
                        {/*)}*/}
                    </div>
                </div>
            )}
        </div>
    );
}

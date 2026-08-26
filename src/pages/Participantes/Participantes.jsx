/* Área do participante — acessível em /participantes, restrita a quem tem
   role PARTICIPANTE (ver auth/sessao.js e main.jsx).

   Programação e agenda são reais: vêm de /api/evento e /api/evento/meus.
   O participante já entra nas palestras ao ter a inscrição confirmada no
   /admin; minicursos ele escolhe aqui, respeitando lotação e um por
   faixa de horário (ver data/apiEventosParticipantes.js).

   Nível/XP, ranking, conquistas, perfil e certificados seguem em
   mockParticipante.js — nenhum endpoint expõe esses dados ainda. Nome e
   e-mail exibidos são os reais, tirados da sessão. */

import { useEffect, useMemo, useState } from 'preact/hooks';
import { useLocation } from 'wouter';
import { lerSessao, limparSessao } from '../../auth/sessao.js';
import './participantes.css';

import QrCrachaParticipantes from './QrCrachaParticipantes.jsx';
import ModalEscolhaMinicursos from './ModalEscolhaMinicursos.jsx';
import SecaoInicioParticipantes from './sections/SecaoInicioParticipantes.jsx';
import SecaoAgendaParticipantes from './sections/SecaoAgendaParticipantes.jsx';
import SecaoRankingParticipantes from './sections/SecaoRankingParticipantes.jsx';
import SecaoPerfilParticipantes from './sections/SecaoPerfilParticipantes.jsx';

import {
    listarEventosParticipantes,
    listarMeusEventosParticipantes,
    inscreverEmMinicurso,
    cancelarMinicurso,
} from './data/apiEventosParticipantes.js';
import {
    montarDiasDaSemana,
    diaInicialAgenda,
    palestrasDoDia,
    montarMeuDia,
    montarMinicursos,
    atividadeAgora,
    proximaAtividade,
    ehMinicurso,
} from './data/agendaParticipantes.js';

import {
    nivelMockParticipante,
    conquistasMockParticipante,
    rankingMockParticipante,
    comoGanharXpMockParticipante,
    perfilMockParticipante,
    certificadosMockParticipante,
} from './mockParticipante.js';

const ABAS_PARTICIPANTES = [
    { id: 'inicio', rotulo: 'Início' },
    { id: 'agenda', rotulo: 'Agenda' },
    { id: 'ranking', rotulo: 'Ranking' },
    { id: 'perfil', rotulo: 'Perfil' },
];

const CERTIFICADOS_LIBERADOS_PARTICIPANTES = false;

/* De quanto em quanto tempo o relógio da página avança — é ele que move
   um item de "a seguir" para "acontece agora". */
const INTERVALO_RELOGIO_PARTICIPANTES = 60000;

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

    const [abaAtiva, setAbaAtiva] = useState('inicio');
    const [qrAberto, setQrAberto] = useState(false);
    const [escolhaMinicursosAberta, setEscolhaMinicursosAberta] = useState(false);

    const [eventos, setEventos] = useState([]);
    const [meusEventos, setMeusEventos] = useState([]);
    const [carregandoAgenda, setCarregandoAgenda] = useState(true);
    const [erroAgenda, setErroAgenda] = useState('');
    const [diaSelecionado, setDiaSelecionado] = useState('');
    const [erroMinicurso, setErroMinicurso] = useState('');
    const [minicursoEmEspera, setMinicursoEmEspera] = useState(null);

    const [agora, setAgora] = useState(() => new Date());

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

    const diasSemana = useMemo(() => montarDiasDaSemana(eventos, agora), [eventos, agora]);

    /* Abre no dia de hoje quando há programação hoje; fora da semana do
       evento, no próximo dia com atividade. */
    useEffect(() => {
        if (diasSemana.length === 0) return;
        if (diasSemana.some((dia) => dia.id === diaSelecionado)) return;
        setDiaSelecionado(diaInicialAgenda(diasSemana, agora));
    }, [diasSemana]);

    const palestrasDoDiaSelecionado = useMemo(
        () => palestrasDoDia(eventos, diaSelecionado, agora),
        [eventos, diaSelecionado, agora],
    );

    const meuDia = useMemo(
        () => montarMeuDia(eventos, meusEventos, diaSelecionado, agora),
        [eventos, meusEventos, diaSelecionado, agora],
    );

    const minicursos = useMemo(
        () => montarMinicursos(eventos, meusEventos, agora),
        [eventos, meusEventos, agora],
    );

    const meusMinicursos = useMemo(() => minicursos.filter((curso) => curso.escolhido), [minicursos]);

    const atividadeAtual = useMemo(
        () => atividadeAgora(eventos, meusEventos, agora),
        [eventos, meusEventos, agora],
    );

    const atividadeSeguinte = useMemo(
        () => proximaAtividade(eventos, meusEventos, agora),
        [eventos, meusEventos, agora],
    );

    const totalMinicursos = useMemo(() => eventos.filter(ehMinicurso).length, [eventos]);

    function irPara(aba) {
        setAbaAtiva(aba);
        setQrAberto(false);
    }

    function sair() {
        limparSessao();
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
                    <div className="avatarCabecalhoParticipantes">{iniciais}</div>
                </div>
            </header>

            <main className="conteudoParticipantes">
                {erroAgenda && (
                    <p className="avisoErroAgendaParticipantes" role="alert">{erroAgenda}</p>
                )}

                {abaAtiva === 'inicio' && (
                    <SecaoInicioParticipantes
                        nivel={nivelMockParticipante}
                        atividadeAtual={atividadeAtual}
                        atividadeSeguinte={atividadeSeguinte}
                        meuDia={meuDia}
                        palestrasDoDia={palestrasDoDiaSelecionado}
                        conquistas={conquistasMockParticipante}
                        meusMinicursos={meusMinicursos}
                        totalMinicursos={totalMinicursos}
                        ranking={rankingMockParticipante}
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
                {abaAtiva === 'ranking' && (
                    <SecaoRankingParticipantes ranking={rankingMockParticipante} comoGanharXp={comoGanharXpMockParticipante} />
                )}
                {abaAtiva === 'perfil' && (
                    <SecaoPerfilParticipantes
                        nome={nomeParticipante}
                        email={emailParticipante}
                        iniciais={iniciais}
                        nivel={nivelMockParticipante}
                        perfil={perfilMockParticipante}
                        conquistas={conquistasMockParticipante}
                        certificados={certificadosMockParticipante}
                        certificadosLiberados={CERTIFICADOS_LIBERADOS_PARTICIPANTES}
                        onAbrirQr={() => setQrAberto(true)}
                        onSair={sair}
                    />
                )}
            </main>

            <nav className="navInferiorParticipantes" aria-label="Navegação da área do participante">
                {ABAS_PARTICIPANTES.map((aba) => (
                    <button
                        key={aba.id}
                        type="button"
                        className="itemNavInferiorParticipantes"
                        aria-current={abaAtiva === aba.id ? 'page' : undefined}
                        onClick={() => irPara(aba.id)}
                    >
                        <span className={abaAtiva === aba.id ? 'marcadorNavInferiorAtivoParticipantes' : 'marcadorNavInferiorParticipantes'} />
                        <span className={abaAtiva === aba.id ? 'rotuloNavInferiorAtivoParticipantes' : 'rotuloNavInferiorParticipantes'}>
                            {aba.rotulo.toUpperCase()}
                        </span>
                    </button>
                ))}
            </nav>

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

            {qrAberto && (
                <div className="sobreposicaoQrParticipantes" onClick={() => setQrAberto(false)}>
                    <div className="modalQrParticipantes" onClick={(evento) => evento.stopPropagation()}>
                        <button
                            type="button"
                            className="botaoFecharModalQrParticipantes"
                            onClick={() => setQrAberto(false)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                        <div className="cabecalhoModalQrParticipantes">
                            <div className="textoCabecalhoModalQrParticipantes">
                                <span className="tituloModalQrParticipantes">MEU CRACHÁ</span>
                                <span className="subtituloModalQrParticipantes">Mostre na entrada da atividade</span>
                            </div>

                        </div>

                        <QrCrachaParticipantes tamanho={200} uuidParticipante={sessao?.uuid} />
                        <div className="identidadeModalQrParticipantes">
                            <span className="nomeModalQrParticipantes">{nomeParticipante.toUpperCase()}</span>
                            <span className="inscricaoModalQrParticipantes">{perfilMockParticipante.numeroInscricao}</span>
                        </div>
                        {(atividadeAtual || atividadeSeguinte) && (
                            <div className="avisoAgoraModalQrParticipantes">
                                <span className="tagAgoraModalQrParticipantes">
                                    {atividadeAtual ? 'AGORA' : 'A SEGUIR'}
                                </span>
                                <span className="textoAgoraModalQrParticipantes">
                                    {(atividadeAtual ?? atividadeSeguinte).dia} ·{' '}
                                    {(atividadeAtual ?? atividadeSeguinte).horario} ·{' '}
                                    {(atividadeAtual ?? atividadeSeguinte).local} —{' '}
                                    {(atividadeAtual ?? atividadeSeguinte).titulo}
                                </span>
                            </div>
                        )}
                        <span className="rodapeModalQrParticipantes">
                            Funciona sem internet. O código é pessoal e não deve ser compartilhado.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

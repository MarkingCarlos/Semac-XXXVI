import './painelDebate.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useParams } from 'wouter';
import PalcoTelaoDebate from './PalcoTelaoDebate.jsx';
import {
    abrirCanalTelaoDebate,
    ESTADO_INICIAL_TELAO_DEBATE,
    INTERVALO_PRESENCA_TELAO_DEBATE_MS,
    nomeJanelaTelaoDebate,
    rotaTelaoDebate,
} from './canalTelaoDebate.js';
import { buscarEvento } from '../Admin/data/apiEventos.js';
import { listarPerguntasDebate } from '../Admin/data/apiPerguntasDebate.js';

/* Painel de quem controla o telão do debate (/debate/<id>). Fica no
   notebook; o telão (/debate/<id>/telao) é aberto numa segunda guia e
   arrastado para a tela estendida. Daqui saem a troca de tela, o timer e
   as perguntas — tudo por botão ou atalho de teclado.

   O estado (tela, timer, pergunta, perguntas do mediador) fica salvo no
   navegador por debate: recarregar o painel não zera o timer. */

const TOLERANCIA_PRESENCA_TELAO_DEBATE_MS = INTERVALO_PRESENCA_TELAO_DEBATE_MS * 2.5;
const AJUSTE_TIMER_DEBATE_MS = 30000;

const chaveArmazenamentoPainelDebate = (eventoId) => `semacDebatePainel${eventoId}`;

function lerEstadoSalvoPainelDebate(eventoId) {
    try {
        return JSON.parse(localStorage.getItem(chaveArmazenamentoPainelDebate(eventoId)) || 'null');
    } catch {
        return null;
    }
}

function salvarEstadoPainelDebate(eventoId, estado) {
    try {
        localStorage.setItem(chaveArmazenamentoPainelDebate(eventoId), JSON.stringify(estado));
    } catch {
        // sem armazenamento (aba anônima, cota): o painel segue funcionando
    }
}

const estaDigitando = (alvo) => alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName);

export default function PainelDebate() {
    const eventoId = Number(useParams().id);

    const [evento, setEvento] = useState(null);
    const [erroCarregarDebate, setErroCarregarDebate] = useState('');

    const [salvo] = useState(() => lerEstadoSalvoPainelDebate(eventoId));
    const [modo, setModo] = useState(salvo?.modo ?? 'vs');
    const [rodando, setRodando] = useState(salvo?.rodando ?? false);
    const [fimEm, setFimEm] = useState(salvo?.fimEm ?? 0);
    const [restanteMs, setRestanteMs] = useState(salvo?.restanteMs ?? null);
    const [pergunta, setPergunta] = useState(salvo?.pergunta ?? '');
    const [perguntasMediador, setPerguntasMediador] = useState(salvo?.perguntasMediador ?? []);
    // Perguntas do público que já foram ao telão (só para marcar na lista)
    const [idsPerguntasExibidas, setIdsPerguntasExibidas] = useState(salvo?.idsPerguntasExibidas ?? []);

    const [rascunhoPergunta, setRascunhoPergunta] = useState('');
    const [perguntasPublico, setPerguntasPublico] = useState([]);
    const [carregandoPerguntasPublico, setCarregandoPerguntasPublico] = useState(true);
    const [erroPerguntasPublico, setErroPerguntasPublico] = useState('');

    const [telaoConectado, setTelaoConectado] = useState(false);
    const canalRef = useRef(null);
    const ultimoSinalTelaoRef = useRef(0);
    const estadoTelaoRef = useRef(ESTADO_INICIAL_TELAO_DEBATE);
    const campoPerguntaRef = useRef(null);

    const duracaoMs = evento ? Math.round(Number(evento.debateTempoFalaMin) * 60) * 1000 : 180000;
    const alertaSeg = evento ? Number(evento.debateAlertaSeg) : 30;
    const restanteParado = restanteMs ?? duracaoMs;

    const estadoTelao = {
        eventoId,
        tituloDebate: evento?.nome ?? '',
        participantes: (evento?.palestrantes ?? []).slice(0, 2).map((p) => ({
            id: p.id, nome: p.nome, cargo: p.cargo, temFoto: p.temFoto,
            fotoPosX: p.fotoPosX, fotoPosY: p.fotoPosY, fotoZoom: p.fotoZoom,
        })),
        modo,
        rodando,
        fimEm,
        restanteMs: restanteParado,
        duracaoMs,
        alertaSeg,
        pergunta,
    };

    // ── Carregamento ──────────────────────────────────────────────
    const carregarPerguntasPublico = () => {
        setCarregandoPerguntasPublico(true);
        setErroPerguntasPublico('');
        listarPerguntasDebate(eventoId)
            .then(setPerguntasPublico)
            .catch((e) => setErroPerguntasPublico(e.message))
            .finally(() => setCarregandoPerguntasPublico(false));
    };

    useEffect(() => {
        let ativo = true;
        buscarEvento(eventoId)
            .then((carregado) => {
                if (!ativo) return;
                if (!carregado.ehDebate) {
                    setErroCarregarDebate('Este evento não é um debate.');
                    return;
                }
                setEvento(carregado);
            })
            .catch((e) => { if (ativo) setErroCarregarDebate(e.message); });
        carregarPerguntasPublico();
        return () => { ativo = false; };
    }, [eventoId]);

    // ── Canal com o telão ─────────────────────────────────────────
    useEffect(() => {
        const canal = abrirCanalTelaoDebate((mensagem) => {
            if (mensagem?.eventoId !== eventoId) return;
            if (mensagem.tipo === 'telaoAberto' || mensagem.tipo === 'telaoPresente') {
                ultimoSinalTelaoRef.current = Date.now();
                setTelaoConectado(true);
                if (mensagem.tipo === 'telaoAberto') {
                    canal.enviar({ tipo: 'estado', estado: estadoTelaoRef.current });
                }
            } else if (mensagem.tipo === 'telaoFechado') {
                ultimoSinalTelaoRef.current = 0;
                setTelaoConectado(false);
            }
        });
        canalRef.current = canal;
        const verificarPresenca = setInterval(() => {
            setTelaoConectado(Date.now() - ultimoSinalTelaoRef.current < TOLERANCIA_PRESENCA_TELAO_DEBATE_MS);
        }, 1000);
        return () => {
            clearInterval(verificarPresenca);
            canal.fechar();
        };
    }, [eventoId]);

    /* Publica no telão e salva a cada mudança. Só depois do evento
       carregado: antes disso o telão receberia título e fotos vazios. */
    const assinaturaEstado = JSON.stringify(estadoTelao);
    useEffect(() => {
        estadoTelaoRef.current = estadoTelao;
        if (evento) canalRef.current?.enviar({ tipo: 'estado', estado: estadoTelao });
        salvarEstadoPainelDebate(eventoId, {
            modo, rodando, fimEm, restanteMs, pergunta, perguntasMediador, idsPerguntasExibidas,
        });
    }, [assinaturaEstado, perguntasMediador, idsPerguntasExibidas]);

    // ── Ações ─────────────────────────────────────────────────────
    /* Trocar de tela zera o timer (cada fala começa cheia), como no
       protótipo. Destacar a pergunta não mexe no timer. */
    const irParaTela = (novoModo) => {
        setModo(novoModo);
        setRodando(false);
        setRestanteMs(duracaoMs);
    };

    const alternarTimer = () => {
        if (rodando) {
            setRestanteMs(fimEm - Date.now());
            setRodando(false);
        } else {
            setFimEm(Date.now() + restanteParado);
            setRodando(true);
        }
    };

    const zerarTimer = () => {
        setRodando(false);
        setRestanteMs(duracaoMs);
    };

    const ajustarTimer = (deltaMs) => {
        if (rodando) setFimEm((anterior) => anterior + deltaMs);
        else setRestanteMs(Math.max(0, restanteParado + deltaMs));
    };

    const exibirPergunta = (texto, idPublico = null) => {
        const limpo = (texto || '').trim();
        if (!limpo) return;
        setPergunta(limpo);
        setModo('q');
        if (idPublico !== null && !idsPerguntasExibidas.includes(idPublico)) {
            setIdsPerguntasExibidas([...idsPerguntasExibidas, idPublico]);
        }
    };

    const exibirRascunho = () => {
        const limpo = rascunhoPergunta.trim();
        if (!limpo) return;
        if (!perguntasMediador.includes(limpo)) setPerguntasMediador([...perguntasMediador, limpo]);
        exibirPergunta(limpo);
        setRascunhoPergunta('');
    };

    const salvarRascunho = () => {
        const limpo = rascunhoPergunta.trim();
        if (limpo && !perguntasMediador.includes(limpo)) setPerguntasMediador([...perguntasMediador, limpo]);
        setRascunhoPergunta('');
    };

    const destacarPergunta = () => {
        if (pergunta) setModo('q');
    };

    const encerrarPergunta = () => {
        setPergunta('');
        if (modo === 'q') setModo('vs');
    };

    const abrirTelao = () => {
        window.open(rotaTelaoDebate(eventoId), nomeJanelaTelaoDebate(eventoId));
    };

    // ── Atalhos de teclado (os mesmos do protótipo) ───────────────
    const acoesRef = useRef({});
    acoesRef.current = {
        irParaTela, alternarTimer, zerarTimer, ajustarTimer, destacarPergunta, encerrarPergunta,
    };
    useEffect(() => {
        const teclaPainel = (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey || estaDigitando(e.target)) return;
            const acoes = acoesRef.current;
            const tecla = e.key.toLowerCase();
            if (tecla === '0' || tecla === 'escape') acoes.irParaTela('vs');
            else if (tecla === '1' || tecla === 'a') acoes.irParaTela('a');
            else if (tecla === '2' || tecla === 'b') acoes.irParaTela('b');
            else if (tecla === ' ') { e.preventDefault(); acoes.alternarTimer(); }
            else if (tecla === 'r') acoes.zerarTimer();
            else if (tecla === '+' || tecla === '=' || tecla === 'arrowup') { e.preventDefault(); acoes.ajustarTimer(AJUSTE_TIMER_DEBATE_MS); }
            else if (tecla === '-' || tecla === 'arrowdown') { e.preventDefault(); acoes.ajustarTimer(-AJUSTE_TIMER_DEBATE_MS); }
            else if (tecla === 'q') acoes.destacarPergunta();
            else if (tecla === 'x') acoes.encerrarPergunta();
            else if (tecla === 'p') { e.preventDefault(); campoPerguntaRef.current?.focus(); }
        };
        window.addEventListener('keydown', teclaPainel);
        return () => window.removeEventListener('keydown', teclaPainel);
    }, []);

    const teclaCampoPergunta = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            exibirRascunho();
        } else if (e.key === 'Escape') {
            e.currentTarget.blur();
        }
    };

    // ── Render ────────────────────────────────────────────────────
    if (erroCarregarDebate) {
        return (
            <main className="mainPainelDebate">
                <a className="linkVoltarAdminPainelDebate" href="/admin">← Voltar ao admin</a>
                <p className="pErroPainelDebate" role="alert">{erroCarregarDebate}</p>
            </main>
        );
    }

    const participanteA = estadoTelao.participantes[0];
    const participanteB = estadoTelao.participantes[1];

    return (
        <main className="mainPainelDebate">
            <header className="headerPainelDebate">
                <div className="divTituloPainelDebate">
                    <a className="linkVoltarAdminPainelDebate" href="/admin">← Voltar ao admin</a>
                    <h1 className="h1TituloPainelDebate">Telão do debate</h1>
                    <p className="pNomeDebatePainelDebate">{evento?.nome ?? 'Carregando…'}</p>
                </div>
                <div className="divStatusTelaoPainelDebate">
                    <span className={`spanStatusTelaoPainelDebate ${telaoConectado ? 'statusTelaoConectadoPainelDebate' : ''}`}>
                        {telaoConectado ? 'Telão conectado' : 'Telão fechado'}
                    </span>
                    <button type="button" className="botaoAbrirTelaoPainelDebate" onClick={abrirTelao}>
                        {telaoConectado ? 'Ir para o telão' : 'Abrir telão'}
                    </button>
                </div>
            </header>

            {!telaoConectado && (
                <p className="pDicaAbrirTelaoPainelDebate">
                    Abra o telão, arraste a guia para a tela estendida e aperte <kbd className="kbdTeclaPainelDebate">F</kbd> nela para tela cheia.
                </p>
            )}
            {evento && evento.palestrantes.length !== 2 && (
                <p className="pAvisoPainelDebate" role="alert">
                    Este debate tem {evento.palestrantes.length} palestrante(s) — o telão mostra os 2 primeiros.
                    Ajuste em Admin → Conteúdo → editar evento.
                </p>
            )}

            <div className="divCorpoPainelDebate">
                <section className="sectionTelaPainelDebate" aria-label="Tela e timer">
                    <div className="divPreviaTelaoPainelDebate">
                        <PalcoTelaoDebate estado={estadoTelao} />
                    </div>

                    <div className="divGrupoBotoesPainelDebate">
                        <button
                            type="button"
                            className={`botaoTelaPainelDebate ${modo === 'vs' ? 'botaoAtivoPainelDebate' : ''}`}
                            onClick={() => irParaTela('vs')}
                        >
                            Visão geral <kbd className="kbdTeclaPainelDebate">0</kbd>
                        </button>
                        <button
                            type="button"
                            className={`botaoTelaPainelDebate botaoFalaAPainelDebate ${modo === 'a' ? 'botaoAtivoPainelDebate' : ''}`}
                            onClick={() => irParaTela('a')}
                        >
                            Fala {participanteA?.nome ?? 'A'} <kbd className="kbdTeclaPainelDebate">1</kbd>
                        </button>
                        <button
                            type="button"
                            className={`botaoTelaPainelDebate botaoFalaBPainelDebate ${modo === 'b' ? 'botaoAtivoPainelDebate' : ''}`}
                            onClick={() => irParaTela('b')}
                        >
                            Fala {participanteB?.nome ?? 'B'} <kbd className="kbdTeclaPainelDebate">2</kbd>
                        </button>
                    </div>

                    <div className="divGrupoBotoesPainelDebate">
                        <button type="button" className="botaoTimerPrincipalPainelDebate" onClick={alternarTimer}>
                            {rodando ? 'Pausar' : 'Iniciar'} <kbd className="kbdTeclaPainelDebate">espaço</kbd>
                        </button>
                        <button type="button" className="botaoTimerPainelDebate" onClick={() => ajustarTimer(-AJUSTE_TIMER_DEBATE_MS)}>
                            −30s <kbd className="kbdTeclaPainelDebate">−</kbd>
                        </button>
                        <button type="button" className="botaoTimerPainelDebate" onClick={() => ajustarTimer(AJUSTE_TIMER_DEBATE_MS)}>
                            +30s <kbd className="kbdTeclaPainelDebate">+</kbd>
                        </button>
                        <button type="button" className="botaoTimerPainelDebate" onClick={zerarTimer}>
                            Zerar <kbd className="kbdTeclaPainelDebate">R</kbd>
                        </button>
                        <span className="spanConfigTimerPainelDebate">
                            {Number(evento?.debateTempoFalaMin ?? 3).toLocaleString('pt-BR')} min por fala · alerta nos últimos {alertaSeg}s
                        </span>
                    </div>
                </section>

                <section className="sectionPerguntasPainelDebate" aria-label="Perguntas">
                    <div className="divPerguntaAtivaPainelDebate">
                        <span className="spanRotuloPainelDebate">Pergunta no telão</span>
                        <p className="pPerguntaAtivaPainelDebate">{pergunta || 'Nenhuma pergunta ativa.'}</p>
                        <div className="divGrupoBotoesPainelDebate">
                            <button
                                type="button"
                                className={`botaoTimerPainelDebate ${modo === 'q' ? 'botaoAtivoPainelDebate' : ''}`}
                                disabled={!pergunta}
                                onClick={destacarPergunta}
                            >
                                Destacar <kbd className="kbdTeclaPainelDebate">Q</kbd>
                            </button>
                            <button type="button" className="botaoTimerPainelDebate" disabled={!pergunta} onClick={encerrarPergunta}>
                                Encerrar pergunta <kbd className="kbdTeclaPainelDebate">X</kbd>
                            </button>
                        </div>
                    </div>

                    <div className="divNovaPerguntaPainelDebate">
                        <label className="spanRotuloPainelDebate" htmlFor="campoNovaPerguntaPainelDebate">
                            Pergunta do mediador <kbd className="kbdTeclaPainelDebate">P</kbd>
                        </label>
                        <textarea
                            id="campoNovaPerguntaPainelDebate"
                            ref={campoPerguntaRef}
                            className="textareaNovaPerguntaPainelDebate"
                            rows={3}
                            placeholder="Digite a pergunta…"
                            value={rascunhoPergunta}
                            onInput={(e) => setRascunhoPergunta(e.currentTarget.value)}
                            onKeyDown={teclaCampoPergunta}
                        />
                        <div className="divGrupoBotoesPainelDebate">
                            <button type="button" className="botaoTimerPrincipalPainelDebate" onClick={exibirRascunho}>
                                Exibir em destaque <kbd className="kbdTeclaPainelDebate">Enter</kbd>
                            </button>
                            <button type="button" className="botaoTimerPainelDebate" onClick={salvarRascunho}>
                                Salvar na lista
                            </button>
                        </div>
                    </div>

                    {perguntasMediador.length > 0 && (
                        <div className="divListaPerguntasPainelDebate">
                            <span className="spanRotuloPainelDebate">Lista do mediador</span>
                            <ul className="ulPerguntasPainelDebate">
                                {perguntasMediador.map((texto) => (
                                    <li
                                        key={texto}
                                        className={`liPerguntaPainelDebate ${texto === pergunta ? 'liPerguntaAtivaPainelDebate' : ''}`}
                                    >
                                        <p className="pTextoPerguntaPainelDebate">{texto}</p>
                                        <button type="button" className="botaoExibirPerguntaPainelDebate" onClick={() => exibirPergunta(texto)}>
                                            Exibir
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoRemoverPerguntaPainelDebate"
                                            onClick={() => setPerguntasMediador(perguntasMediador.filter((t) => t !== texto))}
                                        >
                                            Remover
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="divListaPerguntasPainelDebate">
                        <div className="divCabecalhoListaPainelDebate">
                            <span className="spanRotuloPainelDebate">
                                Enviadas pelo público{perguntasPublico.length > 0 && ` (${perguntasPublico.length})`}
                            </span>
                            <button
                                type="button"
                                className="botaoRemoverPerguntaPainelDebate"
                                disabled={carregandoPerguntasPublico}
                                onClick={carregarPerguntasPublico}
                            >
                                {carregandoPerguntasPublico ? 'Carregando…' : 'Atualizar'}
                            </button>
                        </div>
                        {erroPerguntasPublico && <p className="pErroPainelDebate" role="alert">{erroPerguntasPublico}</p>}
                        {!carregandoPerguntasPublico && !erroPerguntasPublico && perguntasPublico.length === 0 && (
                            <p className="pVazioPainelDebate">Nenhuma pergunta enviada para este debate.</p>
                        )}
                        {perguntasPublico.length > 0 && (
                            <ul className="ulPerguntasPainelDebate">
                                {perguntasPublico.map((perguntaPublico) => {
                                    const jaExibida = idsPerguntasExibidas.includes(perguntaPublico.id);
                                    return (
                                        <li
                                            key={perguntaPublico.id}
                                            className={`liPerguntaPainelDebate ${perguntaPublico.texto === pergunta ? 'liPerguntaAtivaPainelDebate' : ''} ${jaExibida ? 'liPerguntaExibidaPainelDebate' : ''}`}
                                        >
                                            <p className="pTextoPerguntaPainelDebate">
                                                {perguntaPublico.texto}
                                                {jaExibida && <span className="spanSeloExibidaPainelDebate">já exibida</span>}
                                            </p>
                                            <button
                                                type="button"
                                                className="botaoExibirPerguntaPainelDebate"
                                                onClick={() => exibirPergunta(perguntaPublico.texto, perguntaPublico.id)}
                                            >
                                                Exibir
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

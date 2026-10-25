import './palcoTelaoDebate.css';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import logoSemac from '../../assets/Logo_Semac_2026.svg';
import waveSuperiorTelaoDebate from './assets/waveSuperiorTelaoDebate.svg';
import waveInferiorTelaoDebate from './assets/waveInferiorTelaoDebate.svg';
import { urlFotoPalestrante } from '../Admin/data/apiEventos.js';
import { restanteTimerDebate } from './canalTelaoDebate.js';
import { agoraServidorDebate } from './apiTelaoDebate.js';
import { estiloEnquadramentoFoto } from './enquadramentoFotoPalestrante.js';

/* O que aparece no telão do debate, desenhado num palco fixo de 1920×1080
   que escala para caber no espaço que tiver (a tela inteira no
   /debate/<id>/telao, ou a caixinha de prévia do painel). Só desenha o
   `estado` recebido — quem decide é o painel (ver canalTelaoDebate.js).

   Modos:
   - 'vs': os dois participantes lado a lado com o "VS" no meio. Com uma
     pergunta ativa, os cards descem um pouco e ela aparece resumida em cima.
   - 'a' / 'b': o outro participante sai de cena e entra o timer do lado
     dele. Laranja no alerta; esgotado, conta em positivo piscando. Na
     réplica (`replica`) o rótulo vira "Réplica".
   - 'q': a pergunta do mediador ocupa a tela.

   Recriado a partir do protótipo "Debate Telão" (Claude Design). */

const LARGURA_PALCO_TELAO_DEBATE = 1920;
const ALTURA_PALCO_TELAO_DEBATE = 1080;
const TAMANHO_WAVE_TELAO_DEBATE = 560;
const INTERVALO_RELOGIO_TELAO_DEBATE_MS = 200;

const TRANSICAO_SAIDA_CARD_TELAO_DEBATE = 'opacity 0.5s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)';
const TRANSICAO_ENTRADA_CARD_TELAO_DEBATE = 'opacity 0.5s ease 0.4s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s';

/* Tamanhos de fonte (px do palco) de cada lugar onde a pergunta aparece:
   começa no máximo e diminui até ela caber inteira na caixa. A pergunta
   nunca é cortada — pergunta grande fica com letra menor. */
const FONTE_PERGUNTA_DESTAQUE_TELAO_DEBATE = { maximo: 76, minimo: 24 };
const FONTE_PERGUNTA_RESUMO_TELAO_DEBATE = { maximo: 26, minimo: 12 };
const FONTE_PERGUNTA_TIMER_TELAO_DEBATE = { maximo: 28, minimo: 12 };
const PASSO_FONTE_PERGUNTA_TELAO_DEBATE = 2;

/* Visão geral (modo 'vs'): até 2 linhas na fonte cheia a pergunta é
   curta e cabe no espaço de sempre. Mais que isso ela é longa: os cards
   encolhem e descem para o bloco da pergunta crescer, em vez de a letra
   ficar miúda. */
const ALTURA_PERGUNTA_RESUMO_CURTA_TELAO_DEBATE = 84;
const ALTURA_PERGUNTA_RESUMO_LONGA_TELAO_DEBATE = 200;

/* Posição dos cards e do VS com pergunta na visão geral. O VS desce junto
   para continuar no centro das fotos: centro da foto = 190 (topo do card)
   + descida + 320 × escala, e o VS mora em 510. */
const ELEVACAO_PERGUNTA_CURTA_TELAO_DEBATE = { cards: 'translateY(70px) scale(0.88)', vs: 'translateY(31px) scale(0.88)' };
const ELEVACAO_PERGUNTA_LONGA_TELAO_DEBATE = { cards: 'translateY(202px) scale(0.7)', vs: 'translateY(106px) scale(0.7)' };

/* Diminui a fonte do elemento, a partir do máximo, até o texto caber na
   altura que ele tem (max-height). Mede em px de layout, que o scale() do
   palco não altera, então não depende do tamanho da tela. */
function encolherFonteAteCaberTelaoDebate(elemento, { maximo, minimo }) {
    let tamanho = maximo;
    elemento.style.fontSize = `${tamanho}px`;
    while (tamanho > minimo && elemento.scrollHeight > elemento.clientHeight + 1) {
        tamanho = Math.max(minimo, tamanho - PASSO_FONTE_PERGUNTA_TELAO_DEBATE);
        elemento.style.fontSize = `${tamanho}px`;
    }
}

/* Roda `ajustar` agora e de novo quando as fontes terminam de carregar,
   porque a fonte provisória tem outra largura. */
function usarAjusteTextoTelaoDebate(ajustar, dependencias) {
    const textoRef = useRef(null);

    useLayoutEffect(() => {
        const elemento = textoRef.current;
        if (!elemento) return undefined;
        let ativo = true;
        const ajustarSeAtivo = () => { if (ativo) ajustar(elemento); };
        ajustarSeAtivo();
        document.fonts?.ready.then(ajustarSeAtivo);
        return () => { ativo = false; };
    }, dependencias);

    return textoRef;
}

/* Fonte que cabe na altura definida no CSS (destaque e timer). */
function usarFonteQueCabeTelaoDebate(texto, fonte) {
    return usarAjusteTextoTelaoDebate(
        (elemento) => encolherFonteAteCaberTelaoDebate(elemento, fonte),
        [texto, fonte.maximo, fonte.minimo],
    );
}

/* Pergunta da visão geral: mede na fonte cheia sem limite de altura para
   decidir se é longa, aplica a altura correspondente e só então encolhe a
   fonte, se ainda precisar. */
function usarPerguntaResumoTelaoDebate(texto) {
    const [perguntaLonga, setPerguntaLonga] = useState(false);

    const textoRef = usarAjusteTextoTelaoDebate((elemento) => {
        elemento.style.maxHeight = 'none';
        elemento.style.fontSize = `${FONTE_PERGUNTA_RESUMO_TELAO_DEBATE.maximo}px`;
        const longa = elemento.scrollHeight > ALTURA_PERGUNTA_RESUMO_CURTA_TELAO_DEBATE + 1;
        const alturaMaxima = longa ? ALTURA_PERGUNTA_RESUMO_LONGA_TELAO_DEBATE : ALTURA_PERGUNTA_RESUMO_CURTA_TELAO_DEBATE;
        elemento.style.maxHeight = `${alturaMaxima}px`;
        encolherFonteAteCaberTelaoDebate(elemento, FONTE_PERGUNTA_RESUMO_TELAO_DEBATE);
        setPerguntaLonga(longa);
    }, [texto]);

    return { textoRef, perguntaLonga };
}

function formatarTempoTelaoDebate(ms) {
    const esgotado = ms < 0;
    const segundos = esgotado ? Math.floor(-ms / 1000) : Math.ceil(ms / 1000);
    return `${esgotado ? '+' : ''}${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

function FotoParticipanteTelaoDebate({ participante }) {
    const [falhouFoto, setFalhouFoto] = useState(false);
    useEffect(() => setFalhouFoto(false), [participante?.id, participante?.temFoto]);

    if (participante?.temFoto && !falhouFoto) {
        return (
            <img
                className="imgFotoParticipanteTelaoDebate"
                src={urlFotoPalestrante(participante.id, participante.versaoFoto)}
                alt=""
                style={estiloEnquadramentoFoto(participante)}
                onError={() => setFalhouFoto(true)}
            />
        );
    }
    // Sem foto: a inicial do nome no lugar
    return (
        <div className="divInicialParticipanteTelaoDebate" aria-hidden="true">
            {(participante?.nome || '?').trim().charAt(0).toUpperCase()}
        </div>
    );
}

function CardParticipanteTelaoDebate({ participante, lado, estilo }) {
    return (
        <div className={`cardParticipanteTelaoDebate cardParticipante${lado}TelaoDebate`} style={estilo}>
            <div className="divMolduraFotoParticipanteTelaoDebate">
                <div className="divDetalheMolduraParticipanteTelaoDebate" />
                <div className="divAreaFotoParticipanteTelaoDebate">
                    <FotoParticipanteTelaoDebate participante={participante} />
                </div>
            </div>
            <div className="divTextosParticipanteTelaoDebate">
                <div className="divNomeParticipanteTelaoDebate">{participante?.nome || `Participante ${lado}`}</div>
                {participante?.cargo && (
                    <div className="divCargoParticipanteTelaoDebate">{participante.cargo}</div>
                )}
            </div>
        </div>
    );
}

export default function PalcoTelaoDebate({ estado }) {
    const fundoRef = useRef(null);
    const [escala, setEscala] = useState(0);
    // Relógio do servidor: o painel pode estar num celular com o relógio
    // diferente do notebook do telão (ver apiTelaoDebate.js).
    const [agora, setAgora] = useState(agoraServidorDebate);

    useEffect(() => {
        const fundo = fundoRef.current;
        if (!fundo) return undefined;
        const medir = () => {
            const { width, height } = fundo.getBoundingClientRect();
            setEscala(Math.min(width / LARGURA_PALCO_TELAO_DEBATE, height / ALTURA_PALCO_TELAO_DEBATE));
        };
        medir();
        const observador = new ResizeObserver(medir);
        observador.observe(fundo);
        return () => observador.disconnect();
    }, []);

    useEffect(() => {
        const relogio = setInterval(() => setAgora(agoraServidorDebate()), INTERVALO_RELOGIO_TELAO_DEBATE_MS);
        return () => clearInterval(relogio);
    }, []);

    const { modo, pergunta, participantes, tituloDebate } = estado;
    const temPergunta = Boolean(pergunta);
    const textoPerguntaDestaqueRef = usarFonteQueCabeTelaoDebate(pergunta, FONTE_PERGUNTA_DESTAQUE_TELAO_DEBATE);
    const { textoRef: textoPerguntaResumoRef, perguntaLonga } = usarPerguntaResumoTelaoDebate(pergunta);
    const textoPerguntaTimerRef = usarFonteQueCabeTelaoDebate(pergunta, FONTE_PERGUNTA_TIMER_TELAO_DEBATE);
    const modoVs = modo === 'vs';
    const modoFala = modo === 'a' || modo === 'b';

    const escondeA = modo === 'b' || modo === 'q';
    const escondeB = modo === 'a' || modo === 'q';
    const elevacaoPergunta = perguntaLonga ? ELEVACAO_PERGUNTA_LONGA_TELAO_DEBATE : ELEVACAO_PERGUNTA_CURTA_TELAO_DEBATE;
    const elevacaoCards = modoVs && temPergunta ? elevacaoPergunta.cards : 'none';
    const elevacaoVs = modoVs && temPergunta ? elevacaoPergunta.vs : 'none';

    const restanteMs = restanteTimerDebate(estado, agora);
    const esgotado = restanteMs < 0;
    const segundosRestantes = Math.ceil(restanteMs / 1000);
    const emAlerta = !esgotado && segundosRestantes <= estado.alertaSeg;
    const piscaApagado = esgotado && Math.floor(agora / 500) % 2 === 0;
    const corDigitosTimer = esgotado ? (piscaApagado ? '#B13571' : '#E79839') : emAlerta ? '#E79839' : '#FCF8F5';
    const corBarraTimer = esgotado ? '#B13571' : emAlerta ? '#E79839' : '#52ABB1';
    const progressoTimer = esgotado
        ? 100
        : Math.max(0, Math.min(100, (restanteMs / estado.duracaoMs) * 100));

    const tamanhoWave = Math.round(TAMANHO_WAVE_TELAO_DEBATE * escala);

    return (
        <div className="divFundoTelaoDebate" ref={fundoRef}>
            <div className="divWaveSuperiorTelaoDebate" style={{ width: tamanhoWave, height: tamanhoWave }}>
                <img className="imgWaveSuperiorTelaoDebate" src={waveSuperiorTelaoDebate} alt="" />
            </div>
            <div className="divWaveInferiorTelaoDebate" style={{ width: tamanhoWave, height: tamanhoWave }}>
                <img className="imgWaveInferiorTelaoDebate" src={waveInferiorTelaoDebate} alt="" />
            </div>

            <div
                className="divPalcoTelaoDebate"
                style={{ transform: `translate(-50%, -50%) scale(${escala})`, visibility: escala ? 'visible' : 'hidden' }}
            >
                <header className="headerTituloTelaoDebate">
                    <img className="imgLogoTelaoDebate" src={logoSemac} alt="SEMAC" />
                    <div className="divTituloTelaoDebate">
                        <h1 className="h1TituloTelaoDebate">
                            DEBATE: <span className="spanNomeDebateTelaoDebate">{tituloDebate}</span>
                        </h1>
                    </div>
                </header>

                <CardParticipanteTelaoDebate
                    participante={participantes[0]}
                    lado="A"
                    estilo={{
                        transition: escondeA ? TRANSICAO_SAIDA_CARD_TELAO_DEBATE : TRANSICAO_ENTRADA_CARD_TELAO_DEBATE,
                        opacity: escondeA ? 0 : 1,
                        transform: escondeA ? 'translateX(-900px) rotate(-10deg)' : elevacaoCards,
                    }}
                />
                <CardParticipanteTelaoDebate
                    participante={participantes[1]}
                    lado="B"
                    estilo={{
                        transition: escondeB ? TRANSICAO_SAIDA_CARD_TELAO_DEBATE : TRANSICAO_ENTRADA_CARD_TELAO_DEBATE,
                        opacity: escondeB ? 0 : 1,
                        transform: escondeB ? 'translateX(900px) rotate(10deg)' : elevacaoCards,
                    }}
                />

                <div
                    className="divVsTelaoDebate"
                    style={{
                        opacity: modoVs ? 1 : 0,
                        transform: modoVs ? elevacaoVs : 'scale(0.3) rotate(-90deg)',
                    }}
                >
                    VS
                </div>

                {/* Pergunta em destaque (modo 'q') */}
                <div
                    className="divPerguntaDestaqueTelaoDebate"
                    style={{
                        transition: modo === 'q'
                            ? 'opacity 0.6s ease 0.35s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s'
                            : 'opacity 0.3s ease, transform 0.4s ease-in',
                        opacity: modo === 'q' ? 1 : 0,
                        transform: modo === 'q' ? 'none' : 'translateY(60px) scale(0.96)',
                    }}
                >
                    <div className="divCaixaPerguntaDestaqueTelaoDebate">
                        <div className="divDetalheCaixaPerguntaTelaoDebate" />
                        <div className="divRotuloPerguntaDestaqueTelaoDebate">Pergunta do mediador</div>
                        <div className="divTextoPerguntaDestaqueTelaoDebate" ref={textoPerguntaDestaqueRef}>{pergunta}</div>
                    </div>
                </div>

                {/* Pergunta resumida em cima, na visão geral */}
                <div
                    className="divPerguntaResumoTelaoDebate"
                    style={{
                        transition: modoVs && temPergunta
                            ? 'opacity 0.5s ease 0.6s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s'
                            : 'opacity 0.25s ease, transform 0.3s ease-in',
                        opacity: modoVs && temPergunta ? 1 : 0,
                        transform: modoVs && temPergunta ? 'none' : 'translateY(-40px)',
                    }}
                >
                    <div className="divCaixaPerguntaResumoTelaoDebate">
                        <div className="divRotuloPerguntaResumoTelaoDebate">Pergunta</div>
                        <div className="divTextoPerguntaResumoTelaoDebate" ref={textoPerguntaResumoRef}>{pergunta}</div>
                    </div>
                </div>

                {/* Timer da fala (modos 'a' e 'b'), no lado de quem saiu */}
                <div
                    className="divTimerTelaoDebate"
                    style={{
                        left: modo === 'b' ? 180 : 1000,
                        transition: modoFala
                            ? 'opacity 0.6s ease 0.3s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s'
                            : 'opacity 0.3s ease, transform 0.4s ease-in',
                        opacity: modoFala ? 1 : 0,
                        transform: modoFala ? 'none' : 'translateY(60px)',
                    }}
                >
                    <div className="divRotuloTimerTelaoDebate">{esgotado ? 'Tempo esgotado' : estado.replica ? 'Réplica' : 'Com a palavra'}</div>
                    <div className="divDigitosTimerTelaoDebate" style={{ color: corDigitosTimer }}>
                        {formatarTempoTelaoDebate(restanteMs)}
                    </div>
                    <div className="divTrilhoBarraTimerTelaoDebate">
                        <div
                            className="divBarraTimerTelaoDebate"
                            style={{ width: `${progressoTimer}%`, background: corBarraTimer }}
                        />
                    </div>
                    <div className="divPausadoTimerTelaoDebate" style={{ opacity: estado.rodando ? 0 : 1 }}>
                        Pausado
                    </div>
                    <div className="divPerguntaTimerTelaoDebate" style={{ opacity: temPergunta ? 1 : 0 }}>
                        <div className="divRotuloPerguntaTimerTelaoDebate">Pergunta</div>
                        <div className="divTextoPerguntaTimerTelaoDebate" ref={textoPerguntaTimerRef}>{pergunta}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

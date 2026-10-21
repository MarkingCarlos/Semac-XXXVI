import './palcoTelaoDebate.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import logoSemac from '../../assets/Logo_Semac_2026.svg';
import waveSuperiorTelaoDebate from './assets/waveSuperiorTelaoDebate.svg';
import waveInferiorTelaoDebate from './assets/waveInferiorTelaoDebate.svg';
import { urlFotoPalestrante } from '../Admin/data/apiEventos.js';
import { restanteTimerDebate } from './canalTelaoDebate.js';
import { estiloEnquadramentoFoto } from './enquadramentoFotoPalestrante.js';

/* O que aparece no telão do debate, desenhado num palco fixo de 1920×1080
   que escala para caber no espaço que tiver (a tela inteira no
   /debate/<id>/telao, ou a caixinha de prévia do painel). Só desenha o
   `estado` recebido — quem decide é o painel (ver canalTelaoDebate.js).

   Modos:
   - 'vs': os dois participantes lado a lado com o "VS" no meio. Com uma
     pergunta ativa, os cards descem um pouco e ela aparece resumida em cima.
   - 'a' / 'b': o outro participante sai de cena e entra o timer do lado
     dele. Laranja no alerta; esgotado, conta em positivo piscando.
   - 'q': a pergunta do mediador ocupa a tela.

   Recriado a partir do protótipo "Debate Telão" (Claude Design). */

const LARGURA_PALCO_TELAO_DEBATE = 1920;
const ALTURA_PALCO_TELAO_DEBATE = 1080;
const TAMANHO_WAVE_TELAO_DEBATE = 560;
const INTERVALO_RELOGIO_TELAO_DEBATE_MS = 200;

const TRANSICAO_SAIDA_CARD_TELAO_DEBATE = 'opacity 0.5s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)';
const TRANSICAO_ENTRADA_CARD_TELAO_DEBATE = 'opacity 0.5s ease 0.4s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s';

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
    const [agora, setAgora] = useState(Date.now());

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
        const relogio = setInterval(() => setAgora(Date.now()), INTERVALO_RELOGIO_TELAO_DEBATE_MS);
        return () => clearInterval(relogio);
    }, []);

    const { modo, pergunta, participantes, tituloDebate } = estado;
    const temPergunta = Boolean(pergunta);
    const modoVs = modo === 'vs';
    const modoFala = modo === 'a' || modo === 'b';

    const escondeA = modo === 'b' || modo === 'q';
    const escondeB = modo === 'a' || modo === 'q';
    const elevacaoCards = modoVs && temPergunta ? 'translateY(70px) scale(0.88)' : 'none';
    const elevacaoVs = modoVs && temPergunta ? 'translateY(31px) scale(0.88)' : 'none';

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
                        <div className="divTextoPerguntaDestaqueTelaoDebate">{pergunta}</div>
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
                        <div className="divTextoPerguntaResumoTelaoDebate">{pergunta}</div>
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
                    <div className="divRotuloTimerTelaoDebate">{esgotado ? 'Tempo esgotado' : 'Com a palavra'}</div>
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
                        <div className="divTextoPerguntaTimerTelaoDebate">{pergunta}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import "./telaoSorteio.css";
import { useState, useEffect, useRef, useMemo } from "preact/hooks";
import {
    abrirCanalTelaoSorteio,
    ESTADO_INICIAL_TELAO,
    INTERVALO_PRESENCA_TELAO_MS,
} from "./canalTelaoSorteio.js";

/* Guia projetada no telão durante o sorteio (/sorteio/telao). Não tem
   nenhum controle: quem comanda é o painel do organizador (/sorteio), no
   mesmo navegador, pelo canal de canalTelaoSorteio.js.

   Cada giro é encenado em etapas: "Prepare-se…", contagem 3-2-1, a roleta
   trocando nomes dos presentes e desacelerando, o nome travado ("E o
   ganhador é…") e a revelação com confete. O ganhador já chega decidido
   pelo painel; a encenação só termina nele. */

const DURACAO_PREPARO_TELAO_MS = 1800;
const DURACAO_NUMERO_CONTAGEM_TELAO_MS = 1000;
const NUMERO_INICIAL_CONTAGEM_TELAO = 3;
/* Roleta: troca rápida por um tempo, depois cada troca demora mais, até
   passar do intervalo de parada (cerca de 6,5s no total). */
const INTERVALO_INICIAL_ROLETA_TELAO_MS = 55;
const TROCAS_RAPIDAS_ROLETA_TELAO = 40;
const DESACELERACAO_ROLETA_TELAO = 1.11;
const INTERVALO_PARADA_ROLETA_TELAO_MS = 520;
const PAUSA_NOME_TRAVADO_TELAO_MS = 1400;

const QUANTIDADE_CONFETES_TELAO = 70;
const CORES_CONFETE_TELAO = ["#E79839", "#FFFFFF", "#A10535", "#F4C27F", "#EDECEC"];

const preferePoucoMovimento = () =>
    typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Tela cheia de verdade (F11 ou API): a janela ocupa a tela toda. */
const estaEmTelaCheia = () =>
    Boolean(document.fullscreenElement) || window.innerHeight >= window.screen.height - 2;

/* Um nome dos presentes diferente do que está na caixa agora. */
function outroNome(nomes, atual) {
    if (nomes.length <= 1) return nomes[0] ?? "";
    let nome = atual;
    while (nome === atual) nome = nomes[Math.floor(Math.random() * nomes.length)];
    return nome;
}

function montarConfetes() {
    return Array.from({ length: QUANTIDADE_CONFETES_TELAO }, (_, indice) => {
        const largura = 8 + Math.random() * 8;
        return {
            left: `${(Math.random() * 100).toFixed(1)}%`,
            width: `${largura.toFixed(0)}px`,
            height: `${(largura * (0.4 + Math.random() * 0.8)).toFixed(0)}px`,
            background: CORES_CONFETE_TELAO[indice % CORES_CONFETE_TELAO.length],
            animationDuration: `${(2.6 + Math.random() * 2.4).toFixed(2)}s`,
            animationDelay: `${(Math.random() * 1.2).toFixed(2)}s`,
        };
    });
}

const TelaoSorteio = () => {
    const [estado, setEstado] = useState(ESTADO_INICIAL_TELAO);
    /* Etapa da encenação: null (fora de um giro), 'preparo', 'contagem',
       'roleta', 'travada' ou 'revelacao'. */
    const [etapa, setEtapa] = useState(null);
    const [numeroContagem, setNumeroContagem] = useState(NUMERO_INICIAL_CONTAGEM_TELAO);
    const [nomeRoleta, setNomeRoleta] = useState("");
    const [telaCheia, setTelaCheia] = useState(estaEmTelaCheia);

    const canalRef = useRef(null);
    const idGiroEncenadoRef = useRef(0);
    const timersRef = useRef([]);

    const limparTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };
    const depois = (fn, ms) => timersRef.current.push(setTimeout(fn, ms));

    useEffect(() => {
        const canal = abrirCanalTelaoSorteio((mensagem) => {
            if (mensagem?.tipo === "estado") setEstado(mensagem.estado);
        });
        canalRef.current = canal;
        canal.enviar({ tipo: "telaoAberto" });

        const intervaloPresenca = setInterval(
            () => canal.enviar({ tipo: "telaoPresente" }),
            INTERVALO_PRESENCA_TELAO_MS,
        );
        const avisarFechamento = () => canal.enviar({ tipo: "telaoFechado" });
        window.addEventListener("pagehide", avisarFechamento);

        return () => {
            clearInterval(intervaloPresenca);
            window.removeEventListener("pagehide", avisarFechamento);
            avisarFechamento();
            canal.fechar();
            limparTimers();
        };
    }, []);

    useEffect(() => {
        const atualizarTelaCheia = () => setTelaCheia(estaEmTelaCheia());
        window.addEventListener("resize", atualizarTelaCheia);
        document.addEventListener("fullscreenchange", atualizarTelaCheia);
        return () => {
            window.removeEventListener("resize", atualizarTelaCheia);
            document.removeEventListener("fullscreenchange", atualizarTelaCheia);
        };
    }, []);

    /* Cada giro novo (idGiro diferente) é encenado uma vez. Um telão que
       abre ou recarrega já num "revelado" pula direto para a revelação. */
    useEffect(() => {
        if (estado.fase === "aguardando" || estado.fase === "preparado") {
            limparTimers();
            idGiroEncenadoRef.current = 0;
            setEtapa(null);
            return;
        }
        if (estado.fase === "revelado") {
            if (idGiroEncenadoRef.current !== estado.idGiro) {
                limparTimers();
                idGiroEncenadoRef.current = estado.idGiro;
                setEtapa("revelacao");
            }
            return;
        }
        if (estado.idGiro === idGiroEncenadoRef.current) return;

        idGiroEncenadoRef.current = estado.idGiro;
        limparTimers();
        const { nomes, vencedorNome, idGiro } = estado;
        const revelar = () => {
            setEtapa("revelacao");
            canalRef.current?.enviar({ tipo: "giroConcluido", idGiro });
        };

        if (preferePoucoMovimento()) {
            setNomeRoleta(vencedorNome);
            revelar();
            return;
        }

        const girarRoleta = () => {
            setEtapa("roleta");
            let intervalo = INTERVALO_INICIAL_ROLETA_TELAO_MS;
            let trocas = 0;
            let atual = "";
            const passo = () => {
                trocas++;
                if (trocas > TROCAS_RAPIDAS_ROLETA_TELAO) intervalo *= DESACELERACAO_ROLETA_TELAO;
                if (intervalo > INTERVALO_PARADA_ROLETA_TELAO_MS) {
                    setNomeRoleta(vencedorNome);
                    setEtapa("travada");
                    depois(revelar, PAUSA_NOME_TRAVADO_TELAO_MS);
                    return;
                }
                atual = outroNome(nomes, atual);
                setNomeRoleta(atual);
                depois(passo, intervalo);
            };
            passo();
        };

        const contar = (numero) => {
            if (numero === 0) {
                girarRoleta();
                return;
            }
            setNumeroContagem(numero);
            setEtapa("contagem");
            depois(() => contar(numero - 1), DURACAO_NUMERO_CONTAGEM_TELAO_MS);
        };

        setEtapa("preparo");
        depois(() => contar(NUMERO_INICIAL_CONTAGEM_TELAO), DURACAO_PREPARO_TELAO_MS);
    }, [estado.fase, estado.idGiro]);

    /* Confete novo a cada revelação. */
    const confetes = useMemo(() => (etapa === "revelacao" ? montarConfetes() : []), [etapa, estado.idGiro]);

    const dicaTelaCheia = !telaCheia && (estado.fase === "aguardando" || estado.fase === "preparado") && (
        <p className="pDicaTelaCheiaTelaoSorteio">
            Pressione <kbd className="kbdTeclaTelaoSorteio">F11</kbd> para tela cheia
        </p>
    );

    if (estado.fase === "aguardando") {
        return (
            <main className="mainTelaoSorteio">
                <div className="divAguardandoTelaoSorteio">
                    <h1 className="h1MarcaAguardandoTelaoSorteio">SEMAC XXXVI</h1>
                    <p className="pAguardandoTelaoSorteio">Aguardando o próximo sorteio</p>
                </div>
                {dicaTelaCheia}
            </main>
        );
    }

    const totalConcorrendo = estado.nomes.length;

    return (
        <main className="mainTelaoSorteio">
            <div className="divTopoTelaoSorteio">
                <span>Sorteio de brindes</span>
            </div>

            {etapa !== "revelacao" && (
                <div className="divValendoTelaoSorteio">
                    <small className="smallValendoTelaoSorteio">Valendo</small>
                    <span className="spanPremioTelaoSorteio">{estado.brinde}</span>
                </div>
            )}

            {etapa === null && (
                <p className="pConcorrendoTelaoSorteio">
                    {totalConcorrendo} {totalConcorrendo === 1 ? "presente concorrendo" : "presentes concorrendo"}
                </p>
            )}

            {etapa === "preparo" && <span className="spanPrepareTelaoSorteio">Prepare-se…</span>}

            {etapa === "contagem" && (
                <span key={numeroContagem} className="spanNumeroContagemTelaoSorteio" aria-live="assertive">
                    {numeroContagem}
                </span>
            )}

            {(etapa === "roleta" || etapa === "travada") && (
                <div className="divRoletaTelaoSorteio">
                    <span className="spanRotuloRoletaTelaoSorteio">
                        {etapa === "travada" ? "E o ganhador é…" : "Quem vai levar?"}
                    </span>
                    <div className={`divCaixaRoletaTelaoSorteio ${etapa === "travada" ? "caixaTravadaRoletaTelaoSorteio" : ""}`}>
                        <span className="spanNomeRoletaTelaoSorteio">{nomeRoleta}</span>
                    </div>
                </div>
            )}

            {etapa === "revelacao" && (
                <div className="divRevelacaoTelaoSorteio" role="status">
                    <span className="spanParabensTelaoSorteio">Parabéns!</span>
                    <span className="spanGanhadorTelaoSorteio">{estado.vencedorNome}</span>
                </div>
            )}

            {confetes.length > 0 && (
                <div className="divConfeteTelaoSorteio" aria-hidden="true">
                    {confetes.map((estilo, indice) => (
                        <i key={`${estado.idGiro}-${indice}`} className="iConfeteTelaoSorteio" style={estilo} />
                    ))}
                </div>
            )}

            {dicaTelaCheia}
        </main>
    );
};

export default TelaoSorteio;

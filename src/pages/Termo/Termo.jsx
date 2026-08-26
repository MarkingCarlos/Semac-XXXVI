import "./Termo.css";
import { useState, useEffect, useRef } from "preact/hooks";
import { useLocation } from "wouter";

const PALAVRAS_POR_DIA = ["SEMAC", "CYBER", "PIXEL", "BYTES", "NUCLE"];
const DIA_TESTE = 4;
const PALAVRA_SECRETA = PALAVRAS_POR_DIA[DIA_TESTE].toUpperCase();

const TECLADO = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const TOTAL_TENTATIVAS = 6;
const TAMANHO_PALAVRA = 5;
const ATRASO_REVELACAO_MS = 5 * 90 + 350;

const semAcento = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

const calcularEstado = (tentativa, secreta) => {
    const t = semAcento(tentativa).toUpperCase().split("");
    const s = semAcento(secreta).toUpperCase().split("");
    const estado = Array(TAMANHO_PALAVRA).fill("ausente");
    const usados = Array(TAMANHO_PALAVRA).fill(false);
    t.forEach((letra, i) => {
        if (letra === s[i]) { estado[i] = "certo"; usados[i] = true; }
    });
    t.forEach((letra, i) => {
        if (estado[i] === "certo") return;
        const j = s.findIndex((l, idx) => l === letra && !usados[idx]);
        if (j !== -1) { estado[i] = "presente"; usados[j] = true; }
    });
    return estado;
};

const Termo = () => {
    const [, navegar] = useLocation();

    const [tentativas, setTentativas] = useState([]);
    const [atual, setAtual] = useState(Array(TAMANHO_PALAVRA).fill(""));
    const [cursor, setCursor] = useState(0);
    const [fim, setFim] = useState(null);
    const [ajudaAberta, setAjudaAberta] = useState(false);
    const [toast, setToast] = useState("");
    const [bloqueado, setBloqueado] = useState(false);
    const [linhaTremendo, setLinhaTremendo] = useState(null);

    const fimRef = useRef(fim);
    const ajudaAbertaRef = useRef(ajudaAberta);
    const bloqueadoRef = useRef(bloqueado);

    useEffect(() => { fimRef.current = fim; }, [fim]);
    useEffect(() => { ajudaAbertaRef.current = ajudaAberta; }, [ajudaAberta]);
    useEffect(() => { bloqueadoRef.current = bloqueado; }, [bloqueado]);

    const toastTimerRef = useRef(null);
    const mostrarToast = (msg) => {
        setToast(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(""), 1400);
    };

    const selecionarCelula = (i) => {
        if (bloqueadoRef.current || fimRef.current) return;
        setCursor(i);
    };

    const moverCursor = (delta) => {
        setCursor((c) => Math.max(0, Math.min(TAMANHO_PALAVRA - 1, c + delta)));
    };

    const digitarLetra = (letra) => {
        setAtual((prev) => {
            const arr = [...prev];
            arr[cursor] = letra;
            return arr;
        });
        setCursor((c) => Math.min(TAMANHO_PALAVRA - 1, c + 1));
    };

    const apagar = () => {
        if (atual[cursor] !== "") {
            setAtual((prev) => {
                const arr = [...prev];
                arr[cursor] = "";
                return arr;
            });
            return;
        }
        const nc = Math.max(0, cursor - 1);
        setAtual((prev) => {
            const arr = [...prev];
            arr[nc] = "";
            return arr;
        });
        setCursor(nc);
    };

    const enviar = () => {
        if (atual.some((l) => l === "")) {
            setLinhaTremendo(tentativas.length);
            mostrarToast("Palavra incompleta");
            setTimeout(() => setLinhaTremendo(null), 420);
            return;
        }
        const palavra = atual.join("");
        const estados = calcularEstado(palavra, PALAVRA_SECRETA);
        const letras = palavra.toUpperCase().split("");
        const novas = [...tentativas, { letras, estados }];
        const venceu = semAcento(palavra).toUpperCase() === semAcento(PALAVRA_SECRETA).toUpperCase();
        const perdeu = !venceu && novas.length >= TOTAL_TENTATIVAS;

        setTentativas(novas);
        setAtual(Array(TAMANHO_PALAVRA).fill(""));
        setCursor(0);
        setBloqueado(true);

        setTimeout(() => {
            setBloqueado(false);
            if (venceu) setFim("ganhou");
            else if (perdeu) setFim("perdeu");
        }, ATRASO_REVELACAO_MS);
    };

    const processarTecla = useRef(null);
    processarTecla.current = (tecla) => {
        if (fimRef.current || ajudaAbertaRef.current || bloqueadoRef.current) return;

        if (tecla === "ENTER") { enviar(); return; }
        if (tecla === "⌫" || tecla === "BACKSPACE") { apagar(); return; }
        if (tecla === "ARROWLEFT") { moverCursor(-1); return; }
        if (tecla === "ARROWRIGHT") { moverCursor(1); return; }
        digitarLetra(tecla.toUpperCase());
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const key = e.key;
            if (key === "Enter")      { processarTecla.current("ENTER");      return; }
            if (key === "Backspace")  { processarTecla.current("BACKSPACE");  return; }
            if (key === "ArrowLeft")  { processarTecla.current("ARROWLEFT");  return; }
            if (key === "ArrowRight") { processarTecla.current("ARROWRIGHT"); return; }
            if (/^[a-zA-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇáàâãéèêíìîóòôõúùûç]$/.test(key)) {
                processarTecla.current(semAcento(key).toUpperCase());
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const restart = () => {
        setTentativas([]);
        setAtual(Array(TAMANHO_PALAVRA).fill(""));
        setCursor(0);
        setFim(null);
        setToast("");
        setBloqueado(false);
        setLinhaTremendo(null);
    };

    const estadoTeclado = {};
    tentativas.forEach(({ letras, estados }) => {
        letras.forEach((l, i) => {
            const e = estados[i], atualEstado = estadoTeclado[l];
            if (!atualEstado || e === "certo" || (e === "presente" && atualEstado !== "certo"))
                estadoTeclado[l] = e;
        });
    });

    const linhaAtivaIndex = tentativas.length;
    const rotuloTentativa = String(Math.min(linhaAtivaIndex + 1, TOTAL_TENTATIVAS)).padStart(2, "0");

    const linhas = [];
    for (let i = 0; i < TOTAL_TENTATIVAS; i++) {
        if (i < tentativas.length) linhas.push({ tipo: "enviada", ...tentativas[i] });
        else if (i === linhaAtivaIndex && !fim) linhas.push({ tipo: "ativa", letras: atual });
        else linhas.push({ tipo: "vazia", letras: Array(TAMANHO_PALAVRA).fill("") });
    }

    return (
        <div className="divPaginaTermo">

            {toast && <div className="divToastErroTermo">{toast}</div>}

            <div className="divCabecalhoTermo">
                <button className="botaoVoltarTermo" onClick={() => navegar("/")}>&#x2190;</button>
                <h1 className="tituloTermo">TERMO</h1>
                <button className="botaoAjudaTermo" onClick={() => setAjudaAberta(true)}>?</button>
            </div>

            <div className="divConteudoJogoTermo">

                <span className="spanRotuloTentativaTermo">TENTATIVA {rotuloTentativa} DE {TOTAL_TENTATIVAS}</span>

                <div className="divGradeTermo">
                    {linhas.map((linha, li) => (
                        <div
                            key={li < tentativas.length ? `linha-enviada-${li}` : `linha-pendente-${li}`}
                            className={`divLinhaGradeTermo ${linhaTremendo === li ? "linhaTremendoTermo" : ""}`}
                        >
                            {linha.letras.map((letra, ci) => {
                                const classes = ["divCelulaTermo"];
                                let key = `${li}-${ci}`;

                                if (linha.tipo === "enviada") {
                                    const estado = linha.estados[ci];
                                    classes.push(`celula${estado[0].toUpperCase()}${estado.slice(1)}Termo`);
                                    classes.push(li === tentativas.length - 1 && fim === "ganhou" ? "celulaSaltandoTermo" : "celulaGirandoTermo");
                                    key = `enviada-${li}-${ci}`;
                                } else if (linha.tipo === "ativa") {
                                    classes.push("celulaClicavelTermo");
                                    if (letra) classes.push("celulaPreenchidaTermo");
                                    if (!bloqueado && cursor === ci) classes.push("celulaSelecionadaTermo");
                                    key = `ativa-${ci}-${letra}`;
                                }

                                return (
                                    <div
                                        key={key}
                                        className={classes.join(" ")}
                                        style={linha.tipo === "enviada" ? { animationDelay: `${ci * 90}ms` } : undefined}
                                        onClick={linha.tipo === "ativa" ? () => selecionarCelula(ci) : undefined}
                                    >
                                        {letra}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="divTecladoTermo">
                    {TECLADO.map((linha, li) => (
                        <div key={li} className="divLinhaTecladoTermo">
                            {linha.map((tecla) => {
                                const estado = estadoTeclado[tecla];
                                const classes = ["botaoTeclaTermo"];
                                if (tecla === "ENTER") classes.push("teclaEnterTermo");
                                if (tecla === "⌫") classes.push("teclaApagarTermo");
                                if (estado) classes.push(`tecla${estado[0].toUpperCase()}${estado.slice(1)}Termo`);
                                return (
                                    <button
                                        key={tecla}
                                        className={classes.join(" ")}
                                        disabled={bloqueado}
                                        onClick={() => processarTecla.current(tecla)}
                                    >
                                        {tecla}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {ajudaAberta && (
                <div className="divSobreposicaoAjudaTermo" onClick={() => setAjudaAberta(false)}>
                    <div className="divCartaoAjudaTermo" onClick={(e) => e.stopPropagation()}>
                        <div className="tituloAjudaTermo">COMO JOGAR</div>
                        <p className="textoAjudaTermo">Adivinhe a palavra em 6 tentativas. Cada palpite precisa ter 5 letras.</p>
                        <div className="divLinhaLegendaAjudaTermo">
                            <div className="corLegendaAjudaTermo corCertaLegendaTermo" />
                            <span className="textoLegendaAjudaTermo">Letra certa, posição certa.</span>
                        </div>
                        <div className="divLinhaLegendaAjudaTermo">
                            <div className="corLegendaAjudaTermo corPresenteLegendaTermo" />
                            <span className="textoLegendaAjudaTermo">Letra certa, posição errada.</span>
                        </div>
                        <div className="divLinhaLegendaAjudaTermo">
                            <div className="corLegendaAjudaTermo corAusenteLegendaTermo" />
                            <span className="textoLegendaAjudaTermo">Letra não está na palavra.</span>
                        </div>
                        <button className="botaoEntendiAjudaTermo" onClick={() => setAjudaAberta(false)}>ENTENDI</button>
                    </div>
                </div>
            )}

            {fim && (
                <div className="divSobreposicaoFimTermo">
                    <div className="divCartaoFimTermo">
                        <div className={`tituloFimTermo ${fim === "ganhou" ? "venceuFimTermo" : "perdeuFimTermo"}`}>
                            {fim === "ganhou" ? "VOCÊ ACERTOU!" : "FIM DE JOGO"}
                        </div>
                        <p className="textoFimTermo">A palavra era <span className="palavraFimTermo">{PALAVRA_SECRETA}</span></p>
                        <button className="botaoReiniciarFimTermo" onClick={restart}>JOGAR DE NOVO</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Termo;

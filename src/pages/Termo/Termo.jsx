import "./Termo.css";
import { useState, useEffect, useRef } from "react";
import ModalTutorial from "./ModalTutorial.jsx";
import raioEsquerda from "../../assets/RaioEsquerda.png";
import raioDireita from "../../assets/RaioDireita.png";

const PALAVRAS_POR_DIA = ["SEMAC", "CYBER", "PIXEL", "BYTES", "NUCLE"];
const DIA_TESTE = 4;
const PALAVRA_SECRETA = PALAVRAS_POR_DIA[DIA_TESTE].toUpperCase();

const TECLADO = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L","⌫"],
    ["Z","X","C","V","B","N","M","ENTER"],
];

const TOTAL_TENTATIVAS = 6;
const TAMANHO_PALAVRA = 5;

const semAcento = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
    const [tentativas, setTentativas] = useState([]);
    const [digitando, setDigitando] = useState("");
    const [fim, setFim] = useState(null);
    const [tutorial, setTutorial] = useState(false);
    const [erro, setErro] = useState("");

    const fimRef      = useRef(fim);
    const tutorialRef = useRef(tutorial);

    useEffect(() => { fimRef.current = fim; },         [fim]);
    useEffect(() => { tutorialRef.current = tutorial; }, [tutorial]);

    const erroTimerRef = useRef(null);
    const mostrarErro = (msg) => {
        setErro(msg);
        if (erroTimerRef.current) clearTimeout(erroTimerRef.current);
        erroTimerRef.current = setTimeout(() => setErro(""), 1800);
    };

    const processarTecla = useRef(null);
    processarTecla.current = (tecla) => {
        if (fimRef.current)      return;
        if (tutorialRef.current) return;

        if (tecla === "ENTER") {
            setDigitando((atual) => {
                if (atual.length < TAMANHO_PALAVRA) {
                    mostrarErro("Palavra incompleta");
                    return atual;
                }
                const estados = calcularEstado(atual, PALAVRA_SECRETA);
                const letras  = atual.toUpperCase().split("");
                setTentativas((prev) => {
                    const novas = [...prev, { letras, estados }];
                    if (semAcento(atual).toUpperCase() === semAcento(PALAVRA_SECRETA).toUpperCase()) {
                        setFim("ganhou");
                    } else if (novas.length >= TOTAL_TENTATIVAS) {
                        setFim("perdeu");
                    }
                    return novas;
                });
                return "";
            });
            return;
        }

        if (tecla === "⌫" || tecla === "BACKSPACE") {
            setDigitando((d) => d.slice(0, -1));
            return;
        }

        setDigitando((d) => d.length < TAMANHO_PALAVRA ? d + tecla.toUpperCase() : d);
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const key = e.key;
            if (key === "Enter")     { processarTecla.current("ENTER");     return; }
            if (key === "Backspace") { processarTecla.current("BACKSPACE"); return; }
            if (/^[a-zA-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇáàâãéèêíìîóòôõúùûç]$/.test(key)) {
                processarTecla.current(semAcento(key).toUpperCase());
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const estadoTeclado = {};
    tentativas.forEach(({ letras, estados }) => {
        letras.forEach((l, i) => {
            const e = estados[i], atual = estadoTeclado[l];
            if (!atual || e === "certo" || (e === "presente" && atual !== "certo"))
                estadoTeclado[l] = e;
        });
    });

    const grid = [];
    tentativas.forEach(({ letras, estados }) => grid.push({ letras, estados, tipo: "feita" }));
    if (!fim) {
        const letrasAtivas = digitando.toUpperCase().split("");
        while (letrasAtivas.length < TAMANHO_PALAVRA) letrasAtivas.push("");
        grid.push({ letras: letrasAtivas, estados: null, tipo: "ativa" });
    }
    while (grid.length < TOTAL_TENTATIVAS)
        grid.push({ letras: Array(TAMANHO_PALAVRA).fill(""), estados: null, tipo: "vazia" });

    return (
        <div className="termo-page">

            <img src={raioEsquerda} alt="" aria-hidden="true" className="termo-raio termo-raio-esquerda" />
            <img src={raioDireita}  alt="" aria-hidden="true" className="termo-raio termo-raio-direita"  />

            <div className="termo-header">
                <div className="termo-header-lado esquerda">
                    <button className="termo-voltar">&#x2190;</button>
                </div>
                <h1 className="termo-titulo">Termo</h1>
                <div className="termo-header-lado direita">
                    <button className="termo-como-jogar" onClick={() => setTutorial(true)}>Como jogar</button>
                </div>
            </div>

            {erro && <div className="termo-erro">{erro}</div>}
            {fim === "ganhou" && <div className="termo-fim ganhou">🎉 Parabéns! Você acertou!</div>}
            {fim === "perdeu" && <div className="termo-fim perdeu">A palavra era: <strong>{PALAVRA_SECRETA}</strong></div>}

            <div className="termo-grid">
                {grid.map((linha, li) => (
                    <div key={li} className="termo-linha">
                        {linha.letras.map((letra, ci) => (
                            <div key={ci} className={`termo-celula ${linha.estados ? `celula-${linha.estados[ci]}` : ""} ${linha.tipo === "ativa" ? "celula-ativa" : ""}`}>
                                {letra}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="termo-teclado">
                {TECLADO.map((linha, li) => (
                    <div key={li} className="teclado-linha">
                        {linha.map((tecla) => (
                            <button
                                key={tecla}
                                className={`teclado-tecla ${tecla === "ENTER" ? "tecla-enter" : ""} ${estadoTeclado[tecla] ? `tecla-${estadoTeclado[tecla]}` : ""}`}
                                onClick={() => processarTecla.current(tecla)}
                            >
                                {tecla}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {tutorial && <ModalTutorial onFechar={() => setTutorial(false)} />}
        </div>
    );
};

export default Termo;
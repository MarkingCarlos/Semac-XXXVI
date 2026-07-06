import "./sorteio.css";
import { useState } from "react";
import gifConfete from "../../assets/confete.gif";
import Mouse from "../../assets/itensSorteio/mouse.png";
import Teclado from "../../assets/itensSorteio/teclado.png";
import Headset from "../../assets/itensSorteio/headset.png";

const NOMES = [
    "Arthur Rezende",
    "Carlos Alberto",
    "Maria Rodrigues",
    "Ravi Bellini",
    "Guilherme Soares",
];

const ITENS = [
    { nome: "Mouse", imagem: Mouse },
    { nome: "Teclado", imagem: Teclado },
    { nome: "Headset", imagem: Headset },
];

const Sorteio = () => {
    const [itemIdx, setItemIdx] = useState(0);
    const [sorteando, setSorteando] = useState(false);
    const [nomeSorteado, setNomeSorteado] = useState(null);
    const [cortina, setCortina] = useState("idle");
    const [confeteKey, setConfeteKey] = useState(0);
    const [mostrarConfete, setMostrarConfete] = useState(false);

    const itemAtual = ITENS[itemIdx];

    const sortearNome = () => NOMES[Math.floor(Math.random() * NOMES.length)];

    const iniciar = () => {
        if (sorteando) return;
        setSorteando(true);
        setNomeSorteado(sortearNome());
        setCortina("abrindo");
        setTimeout(() => {
            setCortina("aberto");
            setConfeteKey((k) => k + 1);
            setMostrarConfete(true);
            setTimeout(() => setMostrarConfete(false), 2490);
        }, 800);
    };

    const reiniciar = () => {
        setCortina("fechando");
        setMostrarConfete(false);
        setTimeout(() => {
            setCortina("idle");
            setNomeSorteado(null);
            setSorteando(false);
        }, 800);
    };

    const trocarItem = (dir) => {
        if (sorteando) return;
        setItemIdx((prev) => (prev + dir + ITENS.length) % ITENS.length);
    };

    return (
        <div className="sorteio-page">

            {mostrarConfete && (
                <img
                    key={confeteKey}
                    src={gifConfete}
                    alt="confete"
                    className="sorteio-confete-tela"
                />
            )}

            <div className="sorteio-card">
                <h1 className="sorteio-titulo">Sorteio</h1>

                <div className="sorteio-corpo">

                    <div className="sorteio-esquerda">
                        <div className="sorteio-cortina-wrapper">
                            {nomeSorteado && (
                                <div className="sorteio-nome">{nomeSorteado}</div>
                            )}
                            <div className={`sorteio-cortina cortina-${cortina}`} />
                        </div>

                        <div className="sorteio-botoes">
                            {!sorteando && (
                                <button className="sorteio-btn btn-iniciar" onClick={iniciar}>
                                    Iniciar
                                </button>
                            )}
                            {cortina === "aberto" && (
                                <button className="sorteio-btn btn-reiniciar" onClick={reiniciar}>
                                    Reiniciar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="sorteio-direita">
                        <img src={itemAtual.imagem} alt={itemAtual.nome} className="sorteio-item-img" />
                        <div className="sorteio-item-seletor">
                            <button className="seletor-btn" onClick={() => trocarItem(-1)}>◄</button>
                            <span className="seletor-nome">{itemAtual.nome}</span>
                            <button className="seletor-btn" onClick={() => trocarItem(1)}>►</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Sorteio;
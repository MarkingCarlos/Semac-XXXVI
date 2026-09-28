import "./desafio3.css";
import { useState } from "react";
import paperTexture from '../../assets/PAPER.png';

const PERGUNTAS = [
    {
        enunciado: "O dono de uma sorveteria armazena sorvete em potes de 20.000 cm³. Ele serve o sorvete em taças, em porções de 250 mL. A quantidade de taças que ele consegue servir a partir de um pote cheio de sorvete é:",
        alternativas: [
            "5",
            "8",
            "50",
            "80",
            "100",
        ],
        correta: 3,
    },
];

const LETRAS = ["a", "b", "c", "d", "e"];

const ModalTutorial = ({ onContinuar }) => (
    <div className="quiz-modal-overlay">
        <div className="quiz-modal-caixa">
            <h2 className="quiz-modal-titulo">Você encontrou<br/>um quiz!</h2>

            <p>
                Leia a pergunta com atenção e selecione a alternativa que você acredita estar
                correta. <strong>Apenas uma das alternativas é a correta</strong>, então não
                será possível selcionar múltiplas de uma vez.
            </p>
            <p>
                Uma vez que você tenha certeza de sua resposta, clique no botão "Confirmar
                Resposta". Caso você acerte a questão, você ganhará pontos!{" "}
                <strong>
                    Porém, para você ser elegível para receber esses pontos, você terá que
                    responder, no mínimo, três quizzes.
                </strong>{" "}
                Cada estande possui o seu próprio quiz, então visite todas elas para conseguir
                ainda mais pontos!
            </p>

            <button className="quiz-modal-continuar" onClick={onContinuar}>
                Continuar
            </button>
        </div>
    </div>
);

const Desafio3 = () => {
    const pergunta = PERGUNTAS[0];

    const [selecionada, setSelecionada] = useState(null);
    const [confirmada, setConfirmada]   = useState(false);
    const [tutorial, setTutorial]       = useState(true);

    const estadoAlternativa = (idx) => {
        if (!confirmada) return selecionada === idx ? "selecionada" : "normal";
        if (idx === pergunta.correta) return "certa";
        if (idx === selecionada)      return "errada";
        return "normal";
    };

    const confirmar = () => {
        if (selecionada === null || confirmada) return;
        setConfirmada(true);
    };

    return (
        <div className="quiz-page">
            <div className="quiz-header">
                <div className="quiz-header-lado esquerda">
                    <button className="quiz-voltar">&#x2190;</button>
                </div>
                <h1 className="quiz-titulo">Quiz</h1>
                <div className="quiz-header-lado direita">
                    <button className="quiz-como-jogar" onClick={() => setTutorial(true)}>
                        ?
                    </button>
                </div>
            </div>

            <div className="quiz-corpo">

                <div className="quiz-esquerda">
                    <div className="quiz-numero-wrapper">
                        <span className="quiz-numero">1</span>
                    </div>
                    <p className="quiz-enunciado">{pergunta.enunciado}</p>
                    <button
                        className={`quiz-confirmar ${selecionada === null || confirmada ? "desabilitado" : ""}`}
                        onClick={confirmar}
                        disabled={selecionada === null || confirmada}
                    >
                        Confirmar resposta
                    </button>
                </div>

                <div className="quiz-direita">
                    {pergunta.alternativas.map((texto, idx) => (
                        <button
                            key={idx}
                            className={`quiz-alternativa estado-${estadoAlternativa(idx)}`}
                            onClick={() => { if (!confirmada) setSelecionada(idx); }}
                            disabled={confirmada}
                        >
                            <span className="quiz-letra">{LETRAS[idx]}</span>
                            <span className="quiz-alternativa-texto">{texto}</span>
                        </button>
                    ))}
                </div>

            </div>
            <div className="paperTextura"
                style={{
                    backgroundImage: `url(${paperTexture})`
                }}/>
            {tutorial && <ModalTutorial onContinuar={() => setTutorial(false)} />}
        </div>
    );
};

export default Desafio3;
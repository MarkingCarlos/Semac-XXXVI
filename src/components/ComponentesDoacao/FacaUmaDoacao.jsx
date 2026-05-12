import "./FacaUmaDoacao.css";
import { useState, useRef } from "react";

const FacaUmaDoacao = () => {
    const [valorSelecionado, setValorSelecionado] = useState(20);
    const [valorCustom, setValorCustom] = useState("");

    const valoresPre = [10, 20, 50, 100];
    const meta = 1000;
    const arrecadado = 240;
    const progresso = (arrecadado / meta) * 100;

    const valorFinal = valorCustom ? Number(valorCustom) : valorSelecionado;
    const doarDesabilitado = !valorFinal || valorFinal <= 0;

    return (
        <div className="doacao-card">
            <h2 className="doacao-card-titulo">Faça uma Doação</h2>
            <p className="doacao-card-subtitulo">Escolha um valor</p>

            <div className="doacao-valores">
                {valoresPre.map((v) => (
                    <button
                        key={v}
                        className={`doacao-valor-btn ${valorSelecionado === v && !valorCustom ? "ativo" : ""}`}
                        onClick={() => { setValorSelecionado(v); setValorCustom(""); }}
                    >
                        R$ {v}
                    </button>
                ))}
            </div>

            <div className="doacao-input-wrapper">
                <span className="doacao-input-prefixo">R$</span>
                <input
                    type="number"
                    className="doacao-input"
                    placeholder="Insira um valor"
                    value={valorCustom}
                    onChange={(e) => { setValorCustom(e.target.value); setValorSelecionado(null); }}
                />
            </div>

            <div className="doacao-meta-wrapper">
                <div className="doacao-meta-labels">
                    <span className="doacao-meta-label">META</span>
                    <span className="doacao-meta-valor">R$ {arrecadado} / R$ {meta.toLocaleString()}</span>
                </div>
                <div className="doacao-progresso-bg">
                    <div className="doacao-progresso-fill" style={{ width: `${progresso}%` }} />
                </div>
            </div>

            <button
                className={`doacao-btn-doar ${doarDesabilitado ? "desabilitado" : ""}`}
                disabled={doarDesabilitado}
            >
                Doar R${doarDesabilitado ? "0" : valorFinal}
            </button>
        </div>
    );
};

export default FacaUmaDoacao;

import { useState } from "react";
import "./sobreComissao.css";
import { comissoes } from '../../data/fotos.js';

import SplitText from '../../components/cronogramaFiltro/SplitText';
import TextHighlight from '../../components/TextHighlight/TextHighlight.jsx';
import AnimatedTooltip from '../../components/AnimatedTooltip/AnimatedTooltip';



function renderDescricao(comissao) {
    const { descricao, highlight, id } = comissao;
    if (!highlight) return <p>{descricao}</p>;

    const idx = descricao.indexOf(highlight.phrase);
    const before = descricao.slice(0, idx);
    const after = descricao.slice(idx + highlight.phrase.length);

    return (
        <p>
            {before}
            <TextHighlight
                key={id}
                text={highlight.phrase}
                delay={highlight.delay}
                color={highlight.color}
            />
            {after}
        </p>
    );
}

const SobreComissao = () => {
    const [ativaIdx, setAtivaIdx] = useState(0);
    const ativa = comissoes[ativaIdx];

    return (
        <>
        <div className="container">
            <h1 className="tituloPrincipal">
                Quem somos <span className="textoAmarelo">?</span>
            </h1>
            <h2 className="nomeComissao">
                <SplitText
                    key={ativa.id}
                    tag="span"
                    text={ativa.nome}
                    textAlign="start"
                    delay={40}
                    duration={0.5}
                    ease="power3.out"
                    from={{ opacity: 0, y: 30 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0}
                    rootMargin="0px"
                />
            </h2>
            <div className="conteudo-container">
                <div key={ativa.id} className="descricao-container">
                    {renderDescricao(ativa)}
                </div>
                <div className="lateral-container">
                    <div className="botoes-comissoes-container">
                        {comissoes.map((comissao, i) => (
                            <button
                                key={comissao.id}
                                className={i === ativaIdx ? 'ativo' : 'inativo'}
                                style={{ backgroundColor: comissao.cor, color: 'var(--Branco)' }}
                                onClick={() => setAtivaIdx(i)}
                            >
                                {comissao.nome}
                            </button>
                        ))}
                    </div>

                    <div className="membrosBox">
                        <AnimatedTooltip key={ativa.id} membros={ativa.membros} />
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default SobreComissao;

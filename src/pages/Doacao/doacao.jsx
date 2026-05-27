import "./doacao.css";
import DoacaoQRCode from "../../components/ComponentesDoacao/DoacaoQRCode.jsx";
import ComoSuaDoacaoAjuda from "../../components/ComponentesDoacao/ComoSuaDoacaoAjuda.jsx";
import riscoGiz from "../../assets/riscoGiz.png";

const doacao = () => {
    return(
        <section className="doacao-section">
            <div className="doacao-inner">
                <div className="doacao-esquerda">
                    <h1 className="doacao-titulo titulo-secao">
                        Apoie a <span className="texto-amarelo">SEMAC</span>
                    </h1>

                    <p className="doacao-texto">
                        A <strong>SEMAC</strong> é um evento feito por alunos para alunos,{" "}
                        <span className="texto-amarelo">toda ajuda é de grande importância.</span>
                    </p>

                    <img src={riscoGiz} alt="" className="doacao-risco" aria-hidden="true" />
                    
                    <ComoSuaDoacaoAjuda/>
                </div>
                <div className="doacao-direita">
                    <DoacaoQRCode/>
                </div>

            </div>
        </section>
    )
}

export default doacao;

import "./doacao.css";
import DoacaoQRCode from "../../components/ComponentesDoacao/DoacaoQRCode.jsx";
import ComoSuaDoacaoAjuda from "../../components/ComponentesDoacao/ComoSuaDoacaoAjudaV2.jsx";
import riscoGiz from "../../assets/riscoGiz.png";
import paperTexture from "../../assets/PAPER.png";

const doacao = () => {
    return(
        <section id="doacao" className="secaoDoacao" >
            <div className="conteinerInternoDoacao">
                <div className="colunaEsquerdaDoacao">
                    <h1 className="tituloDoacao tituloPrincipal">
                        Apoie a <span className="textoAmarelo">SEMAC</span>
                    </h1>

                    <p className="textoDoacao">
                        A <strong>SEMAC</strong> é um evento feito por alunos para alunos,{" "}
                        <span className="textoAmarelo">toda ajuda é de grande importância.</span>
                    </p>

                    <img src={riscoGiz} alt="" className="imagemRiscoDoacao" aria-hidden="true" />
                    <ComoSuaDoacaoAjuda/>
                </div>
                <div className="colunaDireitaDoacao">
                    <DoacaoQRCode/>
                </div>

            </div>
        </section>
    )
}

export default doacao;

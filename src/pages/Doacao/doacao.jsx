import "./doacao.css";
import BtnContato from "../../components/BtnContato/btnContato.jsx";
import imagemDoacao from "../../assets/imagemDoacao.png";

const doacao = () => {
    return(
        <section className="doacao-section">
            <div className ="doacao-inner">
                <div className="doacao-imagem">
                    <img src= {imagemDoacao} alt="Ilustração de doação" />
                </div>
                
                <div className="doacao-conteudo">
                    <h2 className="doacao-titulo">Doação</h2>

                    <p className="doacao-texto">
                        A <strong>SEMAC</strong> é um evento feito por alunos para alunos,{" "}
                        <span className="texto-amarelo">toda ajuda é de grande importância.</span>
                    </p>

                    <div>
                        <BtnContato/>
                    </div>
                </div>
            </div>
            <div className="doacao-barra" />
        </section>
    )
}

export default doacao;
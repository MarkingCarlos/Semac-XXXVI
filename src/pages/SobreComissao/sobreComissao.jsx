import { useRef } from "react";
import "./sobreComissao.css";
import fotoGuilherme from '/src/assets/fotosPessoas/guilherme-foto.png';
import iconCoffee from '/src/assets/iconCoffee.svg';

const SobreComissao = () =>{

    const h1 = useRef(null);
    const p = useRef(null);

    function selecionar(elemento){
        document.querySelectorAll('.ativo').forEach(element => {
            element.classList.remove('ativo');
        });
        elemento.target.classList.add('ativo');
    }

    function mudarConteudo(){
        h1.current.textContent = 'Conteúdo';
        p.current.textContent = 'A comissão de conteúdo é responsável por criar conteúdos para o evento, além de entrar em contato com possíveis palestrantes para realizar o convite para palestrar na Semac.';
        document.getElementById('img1').setAttribute("src", iconCoffee);
        document.getElementById('img2').setAttribute("src", fotoGuilherme);
        document.getElementById('img3').setAttribute("src", iconCoffee);
        document.getElementById('img4').setAttribute("src", fotoGuilherme);
        document.getElementById('img5').setAttribute("src", iconCoffee);
    }

    function mudarDesenvolvimento(){
        h1.current.textContent = 'Desenvolvimento';
        p.current.textContent = 'A comissão de desenvolvimento é responsável por desenvolver os sistemas para o evento, como o site que você está vendo agora. Essa é a comissão formada pelos melhores profissionais, pessoas que com certeza merecem um bom lugar na sua empresa (se você trabalhar em uma, ou se um dia trabalhar). \n\n MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO. \n\n FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM.';
        document.getElementById('img1').setAttribute("src", fotoGuilherme);
        document.getElementById('img2').setAttribute("src", fotoGuilherme);
        document.getElementById('img3').setAttribute("src", fotoGuilherme);
        document.getElementById('img4').setAttribute("src", fotoGuilherme);
        document.getElementById('img5').setAttribute("src", fotoGuilherme);
    }

    function mudarApoio(){
        h1.current.textContent = 'Apoio';
        p.current.textContent = 'A comissão de apoio é responsável por dar apoio na organização do evento. Não sei definir mais do que isso, mas sei que eles ajudam bastante durante o evento, marcando a presença dos participantes e ajudando no Coffee Break (a parte mais gostosa da Semac).';
        document.getElementById('img1').setAttribute("src", fotoGuilherme);
        document.getElementById('img2').setAttribute("src", iconCoffee);
        document.getElementById('img3').setAttribute("src", fotoGuilherme);
        document.getElementById('img4').setAttribute("src", iconCoffee);
        document.getElementById('img5').setAttribute("src", fotoGuilherme);
    }

    return (
        <>
        <div className="container">
            <h1 ref={h1}>Desenvolvimento</h1>
            <div className="conteudo-container">
                <div className="descricao-container">
                    <p ref={p}>A comissão de desenvolvimento é responsável por desenvolver os sistemas para o evento, como o site que você está vendo agora. Essa é a comissão formada pelos melhores profissionais, pessoas que com certeza merecem um bom lugar na sua empresa (se você trabalhar em uma, ou se um dia trabalhar). Esse texto não passa de teste, para testar a responsividade e o visual do site, então é um monte de enrolação e encheção de linguiça.<br></br><br></br>MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO MEIO.<br></br><br></br>FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM FIM.</p>
                </div>
                <div>
                    <div className="botoes-comissoes-container">
                        <button onClick={(e) => {
                            if(!e.target.classList.contains('ativo')){
                                mudarConteudo();
                            }
                            selecionar(e);
                        }}>Conteúdo</button>
                        <button className="ativo" onClick={(e) => {
                            if(!e.target.classList.contains('ativo')){
                                mudarDesenvolvimento();
                            }
                            selecionar(e);
                        }}>Desenvolvimento</button>
                        <button onClick={(e) => {
                            if(!e.target.classList.contains('ativo')){
                                mudarApoio();
                            }
                            selecionar(e);
                        }}>Apoio</button>

                    </div>
                    <div className="imagens-container">
                        <img src={fotoGuilherme} id="img1" alt="1" className="imgFundo" />
                        <img src={fotoGuilherme} id="img2" alt="2" className="imgMeio" />
                        <img src={fotoGuilherme} id="img3" alt="3" className="imgTopo" />
                        <img src={fotoGuilherme} id="img4" alt="4" className="imgMeio" />
                        <img src={fotoGuilherme} id="img5" alt="5" className="imgFundo" />
                    </div>
                </div>
            </div>
        </div>
        </>
    )

}

export default SobreComissao;
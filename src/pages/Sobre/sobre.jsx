import {BoxEstatistica} from "../../components/BoxEstatistica/boxEstatistica.jsx";
import './sobre.css'
import SobreFotos from "../../components/BoxSobreFotos/sobreFotos.jsx";

const sobre = () =>{

    return (
        <div>
            <div className="sobreSecao">
                <div className="sobreLadoEsquerdo">
                    <SobreFotos
                        titulo={'QUEM SOMOS'}
                        texto={'A SEMAC é um evento universitário organizado pelos discentes' +
                            ' do curso de Bacharelado em Ciência da Computação da UNESP/Ibilce. '}>
                    </SobreFotos>
                </div>
                <div className="sobreLadoDireito">
                    <SobreFotos
                        titulo={'O que oferecemos'}
                        texto={'Oferecemos palestras, minicursos e mesas redondas, além de um ' +
                            'ambiente propício para a inovação e o desenvolvimento de carreiras na Computação. '}>
                    </SobreFotos>
                    <SobreFotos
                        titulo={'O que buscamos'}
                        texto={'O evento busca promover o acesso ao conhecimento tecnológico, trazendo para' +
                            ' dentro da universidade as discussões mais atuais do mercado e da academia. '}>
                    </SobreFotos>
                </div>
            </div>
            <div className={"divBoxEstatistica"}>
                <BoxEstatistica plataforma={'YouTube'} alcance={'100'} indice={0}></BoxEstatistica>
                <BoxEstatistica plataforma={'LinkedIn'} alcance={'100'} indice={1}></BoxEstatistica>
                <BoxEstatistica plataforma={'Instagram'} alcance={'100'} indice={2}></BoxEstatistica>
            </div>
        </div>
    )

}

export default sobre;

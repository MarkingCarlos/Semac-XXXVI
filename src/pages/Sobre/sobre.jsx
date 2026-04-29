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
                        titulo={'QUEM SOMOS'}
                        texto={'A SEMAC é um evento universitário organizado pelos discentes' +
                            ' do curso de Bacharelado em Ciência da Computação da UNESP/Ibilce. '}>
                    </SobreFotos>
                    <SobreFotos
                        titulo={'QUEM SOMOS'}
                        texto={'A SEMAC é um evento universitário organizado pelos discentes' +
                            ' do curso de Bacharelado em Ciência da Computação da UNESP/Ibilce. '}>
                    </SobreFotos>
                </div>
            </div>
            <div className={"divBoxEstatistica"}>
                <BoxEstatistica plataforma={'YouTube'} alcance={'100'}></BoxEstatistica>
                <BoxEstatistica plataforma={'LinkedIn'} alcance={'100'}></BoxEstatistica>
                <BoxEstatistica plataforma={'Instagram'} alcance={'100'}></BoxEstatistica>
            </div>
        </div>
    )

}

export default sobre;

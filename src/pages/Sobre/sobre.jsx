import { useEffect, useRef, useState } from 'preact/hooks';
import {BoxEstatistica} from "../../components/BoxEstatistica/boxEstatistica.jsx";
import './sobre.css'
import SobreFotos from "../../components/BoxSobreFotos/sobreFotos.jsx";
import imgQuemSomos from '../../assets/BoxSobre/apresentacaoTrabalhos.png';
import imgOQueOferecemos from '../../assets/BoxSobre/oQueOferecemos.png';
import imgOQueBuscamos from '../../assets/BoxSobre/o_que_buscamos.png';

const sobre = () =>{
    const sectionRef = useRef(null);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            setIsExiting(rect.top < -(rect.height * 0.9));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div ref={sectionRef} className={`sobre-container ${isExiting ? 'sobre-exiting' : ''}`}>
            <div className="sobreSecao">
                <div className="sobreLadoEsquerdo">
                    <SobreFotos
                        titulo={'QUEM SOMOS'}
                        texto={'A SEMAC é um evento universitário organizado pelos discentes' +
                            ' do curso de Bacharelado em Ciência da Computação da UNESP/Ibilce. '}
                        imagem={imgQuemSomos}>
                    </SobreFotos>
                </div>
                <div className="sobreLadoDireito">
                    <SobreFotos
                        titulo={'O que oferecemos'}
                        texto={'Oferecemos palestras, minicursos e mesas redondas, além de um ' +
                            'ambiente propício para a inovação e o desenvolvimento de carreiras na Computação. '}
                        imagem={imgOQueOferecemos}>
                    </SobreFotos>
                    <SobreFotos
                        titulo={'O que buscamos'}
                        texto={'O evento busca promover o acesso ao conhecimento tecnológico, trazendo para' +
                            ' dentro da universidade as discussões mais atuais do mercado e da academia. '}
                        imagem={imgOQueBuscamos}>
                    </SobreFotos>
                </div>
                <div className="sobreLadoEstatisticas">
                    <BoxEstatistica plataforma={'YouTube'} alcance={'100'} seguidores={'100'} visitas={'100'} indice={0}></BoxEstatistica>
                    <BoxEstatistica plataforma={'LinkedIn'} alcance={'100'} seguidores={'100'} visitas={'100'} indice={1}></BoxEstatistica>
                    <BoxEstatistica plataforma={'Instagram'} alcance={'100'} seguidores={'100'} visitas={'100'} indice={2}></BoxEstatistica>
                </div>
            </div>
        </div>
    )

}

export default sobre;

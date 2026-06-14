import { useEffect, useRef, useState } from 'preact/hooks';
import {BoxEstatistica} from "../../components/BoxEstatistica/boxEstatistica.jsx";
import './sobre.css'
import paperTexture from '../../assets/PAPER.png'
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
            const retanguloSecao = sectionRef.current.getBoundingClientRect();
            setIsExiting(retanguloSecao.top < -(retanguloSecao.height * 0.9));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section id="sobre" ref={sectionRef} className={`conteinerSecaoSobre ${isExiting ? 'secaoSaindoSobre' : ''}`} >
            <div className="sobreSecao">
                <div className="colunasSobreNos">
                    <SobreFotos
                        titulo="Quem somos"
                        texto="A SEMAC é um evento universitário organizado pelos discentes do curso de Bacharelado em Ciência da Computação da UNESP/Ibilce."
                        imagem={imgQuemSomos}
                        alt="Apresentação de trabalhos acadêmicos na SEMAC"
                    />
                </div>
                <div className="colunasSobreNos">
                    <SobreFotos
                        titulo="O que oferecemos"
                        texto="Oferecemos palestras, minicursos e mesas redondas, além de um ambiente propício para a inovação e o desenvolvimento de carreiras na Computação."
                        imagem={imgOQueOferecemos}
                        alt="Palestra com plateia engajada no auditório da SEMAC"
                    />
                </div>
                <div className="colunasSobreNos">
                    <SobreFotos
                        titulo="O que buscamos"
                        texto="O evento busca promover o acesso ao conhecimento tecnológico, trazendo para dentro da universidade as discussões mais atuais do mercado e da academia."
                        imagem={imgOQueBuscamos}
                        alt="Participantes em minicurso de computação no laboratório"
                    />
                </div>
            </div>
            <div className="sobreLadoEstatisticas">
                <BoxEstatistica plataforma={'YouTube'} alcance={'100'} seguidores={'631'} visitas={'100'} indice={0} href={'https://www.youtube.com/@SEMACsjrp'}></BoxEstatistica>
                <BoxEstatistica plataforma={'LinkedIn'} alcance={'100'} seguidores={'100'} visitas={'100'} indice={1} href={'https://www.linkedin.com/company/semacsjrp'}></BoxEstatistica>
                <BoxEstatistica plataforma={'Instagram'} alcance={'100'} seguidores={'631'} visitas={'100'} indice={2} href={'https://www.instagram.com/semacsjrp/'}></BoxEstatistica>
            </div>
        </section>
    )

}

export default sobre;

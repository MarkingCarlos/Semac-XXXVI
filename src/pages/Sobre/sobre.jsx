import { useEffect, useRef, useState } from 'preact/hooks';
import {BoxEstatistica} from "../../components/BoxEstatistica/boxEstatistica.jsx";
import './sobre.css'
import paperTexture from '../../assets/PAPER.png'
import SobreFotos from "../../components/BoxSobreFotos/sobreFotos.jsx";
import imgQuemSomos from '../../assets/BoxSobre/apresentacaoTrabalhos.png';
import imgOQueOferecemos from '../../assets/BoxSobre/oQueOferecemos.png';
import imgOQueBuscamos from '../../assets/BoxSobre/o_que_buscamos.png';

const ESTATISTICAS = [
    { plataforma: 'YouTube', href: 'https://www.youtube.com/@SEMACsjrp', cor: 'var(--vermelhoDiretoria)', stats: [{ label: 'Visualizações', valor: '3.396' }, { label: 'Alcance', valor: '4.400' }] },
    { plataforma: 'LinkedIn', href: 'https://www.linkedin.com/company/semacsjrp', cor: 'var(--azulConteudo)', stats: [{ label: 'Seguidores', valor: '2.703' }, { label: 'Impressões', valor: '3.396' }] },
    { plataforma: 'Instagram', href: 'https://www.instagram.com/semacsjrp/', cor: 'var(--rosaMarketing)', stats: [{ label: 'Visualizações', valor: '3.696' }, { label: 'Alcance', valor: '1.189' }] },
];

function CarrosselEstatisticasMobile() {
    const [ativo, setAtivo] = useState(0);
    const [visivel, setVisivel] = useState(true);
    const timeoutRef = useRef(null);
    const toqueInicioX = useRef(null);

    const irPara = (index) => {
        const total = ESTATISTICAS.length;
        const destino = ((index % total) + total) % total;
        setVisivel(false);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setAtivo(destino);
            setVisivel(true);
        }, 450);
    };

    const handleTouchStart = (e) => {
        toqueInicioX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (toqueInicioX.current === null) return;
        const delta = e.changedTouches[0].clientX - toqueInicioX.current;
        toqueInicioX.current = null;
        if (Math.abs(delta) < 40) return;
        irPara(delta < 0 ? ativo + 1 : ativo - 1);
    };

    useEffect(() => {
        const intervalo = setInterval(() => {
            irPara(ativo + 1);
        }, 5000);
        return () => {
            clearInterval(intervalo);
            clearTimeout(timeoutRef.current);
        };
    }, [ativo]);

    return (
        <div className="carrosselEstatisticasMobile">
            <div
                className={`carrosselEstatisticasJanela ${visivel ? 'carrosselEstatisticasVisivel' : 'carrosselEstatisticasSaindo'}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <BoxEstatistica {...ESTATISTICAS[ativo]} indice={0} />
            </div>
            <div className="carrosselEstatisticasIndicadores" role="tablist" aria-label="Navegação das estatísticas">
                {ESTATISTICAS.map((item, i) => (
                    <button
                        key={item.plataforma}
                        className={`indicadorCarrosselEstatisticas ${i === ativo ? 'indicadorCarrosselEstatisticasAtivo' : ''}`}
                        style={{ background: item.cor }}
                        onClick={() => irPara(i)}
                        role="tab"
                        aria-selected={i === ativo}
                        aria-label={item.plataforma}
                    />
                ))}
            </div>
        </div>
    );
}

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
                {ESTATISTICAS.map((item, i) => (
                    <BoxEstatistica key={item.plataforma} {...item} indice={i} />
                ))}
            </div>
            <CarrosselEstatisticasMobile />
        </section>
    )

}

export default sobre;

import { useRef, useEffect } from 'preact/hooks'
import { useLocation } from 'wouter'
import gsap from 'gsap'
import './inscricao.css'
import BoxInscricao from '../../components/BoxInscricao/BoxInscricao.jsx'
import paperTexture from "../../assets/PAPER.png";

const Inscricao = () => {
    const containerRef = useRef(null)
    const [, navigate] = useLocation()

    useEffect(() => {
        gsap.fromTo(containerRef.current,
            { x: '100vw' },
            { x: 0, duration: 0.5, ease: 'power2.inOut' }
        )
    }, [])

    function voltar() {
        gsap.to(containerRef.current, {
            x: '100vw',
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => navigate('/')
        })
    }

    return (
        <div className="conteinerInscricao" ref={containerRef}
             style={{
                 backgroundImage: `url(${paperTexture})`
             }}
        >
            <button className="botaoVoltarInscricao" onClick={voltar}>&#8592; Voltar</button>
            <div className="ladoDireitoInscricao">
                <BoxInscricao />
            </div>
        </div>
    )
}

export default Inscricao;

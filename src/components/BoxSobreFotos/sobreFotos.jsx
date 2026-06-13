import { useRef } from 'preact/hooks';
import './sobreFotos.css';

export function SobreFotos({ titulo, texto, imagem, alt }) {
    const wrapperRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!wrapperRef.current) return;
        const retanguloWrapper = wrapperRef.current.getBoundingClientRect();
        const posicaoX = e.clientX - retanguloWrapper.left;
        const posicaoY = e.clientY - retanguloWrapper.top;
        wrapperRef.current.style.setProperty('--mouse-x', `${posicaoX}px`);
        wrapperRef.current.style.setProperty('--mouse-y', `${posicaoY}px`);
    };

    return (
        <div
            className="brilhoInterativo"
            ref={wrapperRef}
            onMouseMove={handleMouseMove}
        >
            <div className="boxFotos">
                <div className="boxFotoSobreNos">
                    <img src={imagem} alt={alt ?? titulo} />
                </div>
                <div className="boxTextoSobreNos">
                    <h3 className="tituloFotos">{titulo}</h3>
                    <p className="textoFotos">{texto}</p>
                </div>
            </div>
        </div>
    );
}

export default SobreFotos;

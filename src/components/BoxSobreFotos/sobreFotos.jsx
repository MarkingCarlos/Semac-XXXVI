import { useRef } from 'preact/hooks';
import './sobreFotos.css';

export function sobreFotos({ titulo, texto }) {
    const wrapperRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        wrapperRef.current.style.setProperty('--mouse-x', `${x}px`);
        wrapperRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div 
            className="sobreFotosWrapper" 
            ref={wrapperRef} 
            onMouseMove={handleMouseMove}
        >
            <div className="boxFotos">
                <div className="boxFotosGlass">
                    <h3 className="tituloFotos">{titulo}</h3>
                    <p className="textoFotos">{texto}</p>
                </div>
            </div>
        </div>
    )
}

export default sobreFotos;

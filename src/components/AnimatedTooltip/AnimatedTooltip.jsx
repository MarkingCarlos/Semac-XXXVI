import { useRef, useLayoutEffect, useState } from 'preact/hooks';
import { gsap } from 'gsap';
import './AnimatedTooltip.css';

function TooltipItem({ membro, index }) {
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);
    const [carregada, setCarregada] = useState(false);

    useLayoutEffect(() => {
        gsap.set(tooltipRef.current, {
            xPercent: -50,
            scale: 0,
            opacity: 0,
            y: 8,
            transformOrigin: 'bottom center',
        });
    }, []);

    function handleMouseEnter() {
        gsap.killTweensOf(tooltipRef.current);
        gsap.to(tooltipRef.current, {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: 'back.out(1.7)',
        });
    }

    function handleMouseMove(e) {
        const retanguloContainer = containerRef.current.getBoundingClientRect();
        const deslocamentoRelativoX = e.clientX - retanguloContainer.left - retanguloContainer.width / 2;
        const deslocamentoExtraX = Math.round(deslocamentoRelativoX * 0.3);

        gsap.to(tooltipRef.current, {
            x: deslocamentoExtraX,
            duration: 0.3,
            ease: 'power2.out',
        });
    }

    function handleMouseLeave() {
        gsap.killTweensOf(tooltipRef.current);
        gsap.to(tooltipRef.current, {
            scale: 0,
            opacity: 0,
            y: 8,
            x: 0,
            duration: 0.2,
            ease: 'power2.in',
        });
    }

    return (
        <div
            ref={containerRef}
            className="itemTooltip"
            style={{ zIndex: index + 1 }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div ref={tooltipRef} className="cartaoTooltip">
                <p className="nomeTooltip">{membro.nome}</p>
                <p className="cargoTooltip">{membro.cargo}</p>
            </div>
            <img
                src={membro.foto}
                alt={membro.nome}
                className={`fotoTooltip${carregada ? ' fotoTooltipCarregada' : ''}`}
                onLoad={() => setCarregada(true)}
            />
        </div>
    );
}

export default function AnimatedTooltip({ membros, quebraApos }) {
    if (quebraApos != null) {
        const primeiraLinha = membros.slice(0, quebraApos);
        const segundaLinha = membros.slice(quebraApos);
        return (
            <div className="conteinerTooltipDuplo">
                <div className="conteinerTooltip">
                    {primeiraLinha.map((membro, i) => (
                        <TooltipItem key={i} membro={membro} index={i} />
                    ))}
                </div>
                {segundaLinha.length > 0 && (
                    <div className="conteinerTooltip">
                        {segundaLinha.map((membro, i) => (
                            <TooltipItem key={i} membro={membro} index={i + quebraApos} />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return (
        <div className="conteinerTooltip">
            {membros.map((membro, i) => (
                <TooltipItem key={i} membro={membro} index={i} />
            ))}
        </div>
    );
}

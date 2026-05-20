import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import './AnimatedTooltip.css';

function TooltipItem({ membro, index }) {
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);

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
        const rect = containerRef.current.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const extraX = Math.round(relX * 0.3);

        gsap.to(tooltipRef.current, {
            x: extraX,
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
            className="tooltip-item"
            style={{ zIndex: index + 1 }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div ref={tooltipRef} className="tooltip-card">
                <p className="tooltip-nome">{membro.nome}</p>
                <p className="tooltip-cargo">{membro.cargo}</p>
            </div>
            <img src={membro.foto} alt={membro.nome} className="tooltip-foto" />
        </div>
    );
}

export default function AnimatedTooltip({ membros }) {
    return (
        <div className="tooltip-container">
            {membros.map((membro, i) => (
                <TooltipItem key={i} membro={membro} index={i} />
            ))}
        </div>
    );
}

import { useState, useEffect } from 'preact/hooks';
import './navPontos.css';

const SECOES = [
    { id: 'home',          rotulo: 'Início' },
    { id: 'sobre',         rotulo: 'Sobre' },
    { id: 'Cronograma',    rotulo: 'Programação' },
    { id: 'Patrocinadores',rotulo: 'Patrocinadores' },
    { id: 'doacao',        rotulo: 'Doação' },
    { id: 'comissao',      rotulo: 'Comissão' },
];

export function NavPontos() {
    const [secaoAtiva, setSecaoAtiva] = useState('home');

    useEffect(() => {
        const atualizar = () => {
            const centro = window.scrollY + window.innerHeight * 0.5;
            let melhorId = SECOES[0].id;
            let menorDist = Infinity;

            SECOES.forEach(({ id }) => {
                const el = document.getElementById(id);
                if (!el) return;
                const dist = Math.abs(el.offsetTop - centro);
                if (dist < menorDist) {
                    menorDist = dist;
                    melhorId = id;
                }
            });

            setSecaoAtiva(melhorId);
        };

        window.addEventListener('scroll', atualizar, { passive: true });
        atualizar();
        return () => window.removeEventListener('scroll', atualizar);
    }, []);

    const irPara = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav className="navPontosWrapper" aria-label="Navegação por seções">
            <div className="navPontosColuna">
                {SECOES.map(({ id, rotulo }) => (
                    <button
                        key={id}
                        className={`navPontoItem${secaoAtiva === id ? ' navPontoAtivo' : ''}`}
                        onClick={() => irPara(id)}
                        aria-label={`Ir para ${rotulo}`}
                    >
                        <div className="navPontoBolinha" />
                        <span className="navPontoRotulo">{rotulo}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

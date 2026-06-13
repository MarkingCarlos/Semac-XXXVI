import './boxPatrocinadores.css';

import exemploLogo from '../../assets/exPatrocinador/alura.svg';
import LogoSlider from '../LogoSlider/LogoSlider.jsx';


export default function Patrocinadores() {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.05 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const patrocinadores = [
        {
            tier: "PLATINA",
            items: [
                { nome: "nome", logo: exemploLogo },
                { nome: "nome", logo: exemploLogo },
            ],
        },
        {
            tier: "OURO",
            items: [
                { nome: "nome", logo: exemploLogo },
            ],
        },
        {
            tier: "PRATA",
            items: [
                { nome: "nome", logo: exemploLogo },
            ],
        },
        {
            tier: "BRONZE",
            items: [
                { nome: "nome", logo: exemploLogo },
            ],
        },
    ];

    // Calcula delay global: itens do tier anterior + buffer entre tiers
    let runningDelay = 0.1;
    const tiersWithDelays = patrocinadores.map((tier) => {
        const items = tier.items.map((item, j) => ({
            ...item,
            delay: runningDelay + j * 0.12,
        }));
        runningDelay += tier.items.length * 0.12 + 0.25;
        return { ...tier, items };
    });

    return (
        <section ref={sectionRef} className={`secaoPatrocinadores${isVisible ? ' secaoPatrocinadoresVisivel' : ''}`}>
            {tiersWithDelays.map((tier, i) => (
                <div className={`nivel${tier.tier.charAt(0) + tier.tier.slice(1).toLowerCase()}Patrocinadores`} key={i}>
                    <h2 className="tituloNivelPatrocinadores">{tier.tier}</h2>
                    <div className="conteinerItensNivelPatrocinadores">
                        {tier.items.map((item, j) => (
                            <div
                                className="itemNivelPatrocinadores"
                                key={j}
                                style={{ '--item-delay': `${item.delay}s` }}
                            >
                                <img src={item.logo} alt={item.nome} className="logoNivelPatrocinadores" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}

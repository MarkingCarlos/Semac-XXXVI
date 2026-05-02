import './boxPatrocinadores.css';
import exemploLogo from '../../assets/Logo_SEMAC.png';
import { useEffect, useRef, useState } from 'preact/hooks';

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
    items: 
    [
        {nome: "nome", logo: exemploLogo},
        {nome: "nome", logo: exemploLogo},
    ],
    },
    {
    tier: "OURO",
    items: 
    [
        {nome: "nome", logo: exemploLogo},
    ],
    },
    {
    tier: "PRATA",
    items: 
    [
        {nome: "nome", logo: exemploLogo},
    ],
    },
    {
    tier: "BRONZE",
    items: 
    [
        {nome: "nome", logo: exemploLogo},
    ],
    },
]

  return (
    <section ref={sectionRef} className={`patrocinadores-section${isVisible ? ' is-visible' : ''}`}>
      {patrocinadores.map((tier, i) => (
        <div className={`tier-${tier.tier.toLowerCase()}`} key={i}>
          <h2 className="tier-title">{tier.tier}</h2>
          <div className="tier-items">
            {tier.items.map((item, j) => (
              <div className="tier-item" key={j}>
                <img src={item.logo} alt={item.nome} className="tier-logo" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );

}
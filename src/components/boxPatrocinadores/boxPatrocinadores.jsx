import './boxPatrocinadores.css';
import exemploLogo from '../../assets/exemplo.png';

export default function Patrocinadores() {
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
    <section className="patrocinadores-section">
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
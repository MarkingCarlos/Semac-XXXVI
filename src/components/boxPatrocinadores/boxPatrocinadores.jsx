import './boxPatrocinadores.css';
import exemploLogo from '../../assets/exemplo.png';
import LogoSlider from '../LogoSlider/LogoSlider.jsx';

export default function Patrocinadores() {
    const apoiadores = [
        { nome: "nome", logo: exemploLogo },
        { nome: "nome", logo: exemploLogo },
        { nome: "nome", logo: exemploLogo },
        { nome: "nome", logo: exemploLogo },
        { nome: "nome", logo: exemploLogo },
    ];

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

      {apoiadores.length > 0 && (
        <div className="tier-apoiadores">
          <h2 className="tier-title">APOIADORES</h2>
          <LogoSlider logos={apoiadores} />
        </div>
      )}
    </section>
  );

}
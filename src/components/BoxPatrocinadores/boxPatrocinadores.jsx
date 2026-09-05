import { useState, useEffect } from 'preact/hooks';
import './boxPatrocinadores.css';

import { listarPatrocinadoresPublicos } from '../../pages/Patrocinadores/data/apiPatrocinadores.js';

// Ordem de exibição dos níveis, do maior pro menor — mesmos valores do
// enum NivelPatrocinio no backend. Nível sem nenhum patrocinador não aparece.
const ORDEM_NIVEIS = ['ESPECIAL', 'PLATINA', 'OURO', 'PRATA', 'BRONZE', 'APOIADOR'];

// Mesmo breakpoint usado no CSS deste componente (ver @media max-width: 768px)
const CONSULTA_MOBILE_PATROCINADORES = '(max-width: 768px)';

// A partir de quantos itens o nível Apoiador vira carrossel no mobile
const LIMITE_ITENS_CARROSSEL_APOIADOR = 3;

function agruparPorNivel(patrocinadores) {
    return ORDEM_NIVEIS
        .map((nivel) => ({
            tier: nivel,
            items: patrocinadores.filter((p) => p.nivel === nivel),
        }))
        .filter((grupo) => grupo.items.length > 0);
}

function ItemPatrocinador({ item }) {
    return (
        <div className="itemNivelPatrocinadores">
            <div className="cartaoLogoNivelPatrocinadores">
                <img src={item.logo} alt={item.nome} className="logoNivelPatrocinadores" />
            </div>
            <span className="nomeItemPatrocinadores">{item.nome}</span>
        </div>
    );
}

export default function BoxPatrocinadores() {
    const [patrocinadores, setPatrocinadores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const consulta = window.matchMedia(CONSULTA_MOBILE_PATROCINADORES);
        const aoMudar = (e) => setIsMobile(e.matches);
        setIsMobile(consulta.matches);
        consulta.addEventListener('change', aoMudar);
        return () => consulta.removeEventListener('change', aoMudar);
    }, []);

    useEffect(() => {
        let ativo = true;
        listarPatrocinadoresPublicos()
            .then((lista) => { if (ativo) setPatrocinadores(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    if (carregando || erro || patrocinadores.length === 0) {
        return (
            <section className="secaoPatrocinadores">
                <p className="statusPatrocinadores">
                    {carregando
                        ? 'Carregando patrocinadores…'
                        : erro || 'Patrocinadores em breve.'}
                </p>
            </section>
        );
    }

    return (
        <section className="secaoPatrocinadores">
            {agruparPorNivel(patrocinadores).map((tier) => {
                // Só o nível Apoiador vira carrossel no mobile quando tem
                // muitos itens — os demais níveis sempre quebram linha.
                const carrossel = tier.tier === 'APOIADOR'
                    && isMobile
                    && tier.items.length > LIMITE_ITENS_CARROSSEL_APOIADOR;

                return (
                    <div className={`nivel${tier.tier.charAt(0) + tier.tier.slice(1).toLowerCase()}Patrocinadores`} key={tier.tier}>
                        <h2 className="tituloNivelPatrocinadores">{tier.tier}</h2>
                        {carrossel ? (
                            <div className="conteinerCarrosselPatrocinadores">
                                <div className="trilhaCarrosselPatrocinadores">
                                    {[...tier.items, ...tier.items].map((item, i) => (
                                        <ItemPatrocinador item={item} key={`${item.id}-${i}`} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="conteinerItensNivelPatrocinadores">
                                {tier.items.map((item) => (
                                    <ItemPatrocinador item={item} key={item.id} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    );
}

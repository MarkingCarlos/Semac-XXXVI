import { useLocation } from 'wouter'
import CarrosselPatrocinadores from '../../components/CarrosselPatrocinadores/CarrosselPatrocinadores.jsx'
import { EX_PATROCINADORES }  from '../../data/exPatrocinadores.js'
import './patrocinadoresCompacto.css'
import paperTexture from '../../assets/PAPER.png'

export default function PatrocinadoresCompacto() {
    const [, navigate] = useLocation()

    return (
        <section id="Patrocinadores" className="secaoPatrocinadoresCompacto" >

            {/* ── Topo centralizado: título + pitch + CTA ──────── */}
            <div className="topoPatrocinadoresCompacto">
                <div class="subraTitulo">
                    <span class="tracoHorizontal"/>
                    <span class="styleSubraTitulo">HISTÓRICO</span>
                    <span class="tracoHorizontal"/>
                </div>
                <h2 class="tituloPrincipal">
                    QUEM JÁ <span class="destaquePatrocinadoresCompacto">ESTEVE </span>
                    COM A GENTE
                </h2>
                <div>
                    <p className="textoPatrocinadoresCompacto">
                        Conecte sua empresa às lideranças tecnológicas do futuro e faça parte da história da SEMAC.
                    </p>
                </div>
            </div>

            {/* ── Carrossel abaixo ─────────────────────────────── */}
            <div className="areaCarrosselPatrocinadoresCompacto">
                <CarrosselPatrocinadores patrocinadores={EX_PATROCINADORES}/>
            </div>
            <button
                className="botaoPatrocinarCompacto"
                onClick={() => navigate('/cotas')}
            >
                Seja um Patrocinador
            </button>

        </section>
    )
}

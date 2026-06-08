import { useLocation } from 'wouter'
import CarrosselPatrocinadores from '../../components/CarrosselPatrocinadores/CarrosselPatrocinadores.jsx'
import { EX_PATROCINADORES }  from '../../data/exPatrocinadores.js'
import './patrocinadoresCompacto.css'

export default function PatrocinadoresCompacto() {
    const [, navigate] = useLocation()

    return (
        <section class="patroc-compacto">

            {/* ── Topo centralizado: título + pitch + CTA ──────── */}
            <div class="patroc-compacto-topo">
                <div class="subraTitulo">
                    <span class="tracoHorizontal"/>
                    <span class="styleSubraTitulo">HISTÓRICO</span>
                    <span class="tracoHorizontal"/>
                </div>
                <h2 class="tituloPrincipal">
                    QUEM JÁ <span class="patroc-compacto-destaque">ESTEVE </span>
                    COM A GENTE
                </h2>
                <div>
                    <p className="patroc-compacto-texto">
                        Conecte sua empresa às lideranças tecnológicas do futuro e faça parte da história da SEMAC.
                    </p>
                </div>
            </div>

            {/* ── Carrossel abaixo ─────────────────────────────── */}
            <div class="patroc-compacto-carrossel">
                <CarrosselPatrocinadores patrocinadores={EX_PATROCINADORES}/>
            </div>
            <button
                className="btnPatrocinar"
                onClick={() => navigate('/cotas')}
            >
                Seja um Patrocinador
            </button>

        </section>
    )
}

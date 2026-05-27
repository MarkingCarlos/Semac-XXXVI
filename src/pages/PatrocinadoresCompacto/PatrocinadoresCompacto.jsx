import { useState } from 'preact/hooks'
import CarrosselPatrocinadores from '../../components/CarrosselPatrocinadores/CarrosselPatrocinadores.jsx'
import ModalCotas             from '../../components/ModalCotas/ModalCotas.jsx'
import { EX_PATROCINADORES }  from '../../data/exPatrocinadores.js'
import './patrocinadoresCompacto.css'

export default function PatrocinadoresCompacto() {
    const [modalAberto, setModalAberto] = useState(false)

    return (
        <section class="patroc-compacto">

            {/* ── Topo centralizado: título + pitch + CTA ──────── */}
            <div class="patroc-compacto-topo">
                <div class="subraTitulo">
                    <span class="tracoHorizontal"/>
                    <span class="styleSubraTitulo">HISTÓRICO</span>
                    <span class="tracoHorizontal"/>
                </div>
                <h2 class="patroc-compacto-titulo">
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
                onClick={() => setModalAberto(true)}
            >
                Seja um Patrocinador
            </button>

            <ModalCotas aberto={modalAberto} onFechar={() => setModalAberto(false)}/>
        </section>
    )
}

// Página de patrocinadores de edições anteriores.
// Exibida como placeholder enquanto os patrocinadores de 2026 não estão confirmados.
//
// Para atualizar os patrocinadores, edite apenas o array PATROCINADORES abaixo.
// Quando o logo real estiver disponível, adicione a propriedade `src` ao item.

import LogoCardPatrocinador from '../../components/LogoCardPatrocinador/LogoCardPatrocinador.jsx'
import StatusConfirmacao    from '../../components/StatusConfirmacao/StatusConfirmacao.jsx'
import CTAPatrocinar        from '../../components/CTAPatrocinar/CTAPatrocinar.jsx'
import { EX_PATROCINADORES } from '../../data/exPatrocinadores.js'
import './patrocinadoresAnteriores.css'

export default function PatrocinadoresAnteriores() {
    return (
        <div class="patroc-ant-pagina">

            {/* ── Cabeçalho ──────────────────────────────────────── */}
            <header class="patroc-ant-header">

                {/* Título à esquerda */}
                <div class="patroc-ant-titulo-bloco">
                    <div class="patroc-ant-titulo-linha">
                        <span class="patroc-ant-acento" />
                        <span class="patroc-ant-rotulo">HISTÓRICO · QUEM JÁ APOIOU A SEMAC</span>
                    </div>
                    <h1 class="patroc-ant-titulo">
                        MARCAS QUE <span class="patroc-ant-destaque">ESTIVERAM</span><br />
                        COM A GENTE
                    </h1>
                </div>
            </header>

            {/* ── Grid de logos ──────────────────────────────────── */}
            <div class="patroc-ant-grid">
                {EX_PATROCINADORES.map((p, i) => (
                    <LogoCardPatrocinador
                        key={i}
                        nome={p.nome}
                        src={p.src}
                    />
                ))}
            </div>

            {/* ── Rodapé CTA ─────────────────────────────────────── */}
            <CTAPatrocinar total={EX_PATROCINADORES.length} />

        </div>
    )
}

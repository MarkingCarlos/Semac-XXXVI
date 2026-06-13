// Faixa de rodapé que exibe o total de empresas apoiadoras e convida
// novas empresas a se tornarem patrocinadoras da edição atual.

import './ctaPatrocinar.css'

export default function CTAPatrocinar({ total }) {
    return (
        <div class="faixaCtaPatrocinar">
            {/* Contador de empresas + subtítulo */}
            <div class="infoCtaPatrocinar">
                <span class="numeroCtaPatrocinar">{total}</span>
                <div>
                    <p class="rotuloCtaPatrocinar">EMPRESAS · ÚLTIMAS EDIÇÕES</p>
                    <p class="subtituloCtaPatrocinar">Sua empresa pode ser a próxima.</p>
                </div>
            </div>

            {/* Botão de ação */}
            <button class="botaoCtaPatrocinar">
                Seja patrocinador 2026 ↗
            </button>
        </div>
    )
}

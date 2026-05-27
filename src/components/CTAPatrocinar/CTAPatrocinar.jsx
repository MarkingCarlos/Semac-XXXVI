// Faixa de rodapé que exibe o total de empresas apoiadoras e convida
// novas empresas a se tornarem patrocinadoras da edição atual.

import './ctaPatrocinar.css'

export default function CTAPatrocinar({ total }) {
    return (
        <div class="cta-patrocinar">
            {/* Contador de empresas + subtítulo */}
            <div class="cta-info">
                <span class="cta-numero">{total}</span>
                <div>
                    <p class="cta-rotulo">EMPRESAS · ÚLTIMAS EDIÇÕES</p>
                    <p class="cta-subtitulo">Sua empresa pode ser a próxima.</p>
                </div>
            </div>

            {/* Botão de ação */}
            <button class="cta-botao">
                Seja patrocinador 2026 ↗
            </button>
        </div>
    )
}

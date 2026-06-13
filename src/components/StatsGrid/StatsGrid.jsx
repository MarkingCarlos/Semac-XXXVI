// Grade com 4 cards de resumo estatístico dos participantes.
//
// Alerta visual (liquid glass) é ativado automaticamente quando:
//   - Aguardando > 50% do total → muita gente ainda sem confirmar presença
//   - Ausências  > 25% do total → taxa de ausência preocupante
//
// Props:
//   participantes — array completo de participantes (sem filtro de busca)

import { STATUS, contarStatus } from '../TabelaParticipantes/mockParticipantes.js'

// Monta as classes CSS do card, adicionando liquid glass se alerta for verdadeiro.
// `tint` é a variação de cor do vidro: 'amarelo' | 'rosa'
function classeCard(base, alerta, tint) {
    return alerta ? `${base} vidroLiquidoAdmin vidroLiquido${tint.charAt(0).toUpperCase() + tint.slice(1)}Admin` : base
}

export default function StatsGrid({ participantes }) {
    const total       = participantes.length
    const confirmados = participantes.reduce((acc, p) => acc + contarStatus(p.eventoParticipantes, STATUS.PRESENTE), 0)
    const aguardando  = participantes.reduce((acc, p) => acc + contarStatus(p.eventoParticipantes, STATUS.INSCRITO),  0)
    const ausencias   = participantes.reduce((acc, p) => acc + contarStatus(p.eventoParticipantes, STATUS.AUSENTE),  0)

    const aguardandoAlerta = aguardando > total * 0.5
    const ausenciasAlerta  = ausencias  > total * 0.25

    return (
        <div class="estatisticasAdmin">
            <div class="cartaoEstatisticaAdmin cartaoEstatisticaTotalAdmin">
                <span class="numeroEstatisticaAdmin">{total}</span>
                <span class="rotuloEstatisticaAdmin">Participantes</span>
            </div>

            <div class="cartaoEstatisticaAdmin cartaoEstatisticaConfirmadosAdmin">
                <span class="numeroEstatisticaAdmin">{confirmados}</span>
                <span class="rotuloEstatisticaAdmin">Confirmações</span>
            </div>

            <div class={classeCard('cartaoEstatisticaAdmin cartaoEstatisticaAguardandoAdmin', aguardandoAlerta, 'amarelo')}>
                <span class="numeroEstatisticaAdmin">{aguardando}</span>
                <span class="rotuloEstatisticaAdmin">Aguardando</span>
            </div>

            <div class={classeCard('cartaoEstatisticaAdmin cartaoEstatisticaAusenciasAdmin', ausenciasAlerta, 'rosa')}>
                <span class="numeroEstatisticaAdmin">{ausencias}</span>
                <span class="rotuloEstatisticaAdmin">Ausências</span>
            </div>
        </div>
    )
}

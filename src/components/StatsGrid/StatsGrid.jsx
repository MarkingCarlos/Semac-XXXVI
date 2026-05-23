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
    return alerta ? `${base} liquid-glass liquid-glass-${tint}` : base
}

export default function StatsGrid({ participantes }) {
    const total       = participantes.length
    const confirmados = participantes.reduce((acc, p) => acc + contarStatus(p.eventoParticipantes, STATUS.PRESENTE), 0)
    const aguardando  = participantes.reduce((acc, p) => acc + contarStatus(p.eventoParticipantes, STATUS.INSCRITO),  0)
    const ausencias   = participantes.reduce((acc, p) => acc + contarStatus(p.eventoParticipantes, STATUS.AUSENTE),  0)

    const aguardandoAlerta = aguardando > total * 0.5
    const ausenciasAlerta  = ausencias  > total * 0.25

    return (
        <div class="admin-stats">
            <div class="stat-card stat-card-total">
                <span class="stat-numero">{total}</span>
                <span class="stat-label">Participantes</span>
            </div>

            <div class="stat-card stat-card-confirmados">
                <span class="stat-numero">{confirmados}</span>
                <span class="stat-label">Confirmações</span>
            </div>

            <div class={classeCard('stat-card stat-card-aguardando', aguardandoAlerta, 'amarelo')}>
                <span class="stat-numero">{aguardando}</span>
                <span class="stat-label">Aguardando</span>
            </div>

            <div class={classeCard('stat-card stat-card-ausencias', ausenciasAlerta, 'rosa')}>
                <span class="stat-numero">{ausencias}</span>
                <span class="stat-label">Ausências</span>
            </div>
        </div>
    )
}

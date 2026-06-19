// Dois cards de resumo da aba Participantes:
//   1) quantas pessoas já são PARTICIPANTE (inscrição confirmada)
//   2) quantas ainda não têm papel (role = null, aguardando confirmação)
//
// Props:
//   participantes — array completo de participantes (sem filtro de busca)

export default function StatsGrid({ participantes }) {
    const totalParticipantes = participantes.filter(p => p.role === 'PARTICIPANTE').length
    const aguardando         = participantes.filter(p => p.role == null).length

    return (
        <div class="estatisticasAdmin">
            <div class="cartaoEstatisticaAdmin cartaoEstatisticaTotalAdmin">
                <span class="numeroEstatisticaAdmin">{totalParticipantes}</span>
                <span class="rotuloEstatisticaAdmin">Participantes</span>
            </div>

            <div class="cartaoEstatisticaAdmin cartaoEstatisticaAguardandoAdmin">
                <span class="numeroEstatisticaAdmin">{aguardando}</span>
                <span class="rotuloEstatisticaAdmin">Aguardando confirmação</span>
            </div>
        </div>
    )
}

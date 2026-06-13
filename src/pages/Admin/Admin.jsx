// Página de administração — acessível em /admin.
// Autenticação não implementada ainda (a ser adicionada futuramente).
//
// Estrutura:
//   AdminHeader          → barra superior com navegação e identidade visual
//   StatsGrid            → 4 cards com métricas globais dos participantes
//   TabelaParticipantes  → listagem detalhada com busca por nome/e-mail
//
// Fonte de dados: MOCK_PARTICIPANTES (mockParticipantes.js)
// Quando a API estiver pronta: GET /api/pessoas?role=PARTICIPANTE

import './admin.css'
import StatsGrid from '../../components/StatsGrid/StatsGrid.jsx'
import TabelaParticipantes from '../../components/TabelaParticipantes/TabelaParticipantes.jsx'
import { MOCK_PARTICIPANTES } from '../../components/TabelaParticipantes/mockParticipantes.js'

export default function Admin() {
    // TODO: trocar por useState + useEffect com fetch quando a API estiver pronta
    const participantes = MOCK_PARTICIPANTES

    return (
        <div class="paginaAdmin">
            <div class="corpoAdmin">
                <StatsGrid participantes={participantes} />
                <TabelaParticipantes participantes={participantes} />
            </div>
        </div>
    )
}

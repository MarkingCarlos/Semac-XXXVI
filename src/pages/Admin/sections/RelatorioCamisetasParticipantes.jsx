// Relatório só das camisetas do modelo de participante: total e quantidade
// por tamanho, separada por modelo. Entram as inclusas no kit de
// participante, as de inscritos ainda não confirmados (contam como
// participante) e todas as avulsas — inclusive as compradas pela
// comissão, já que avulsa é sempre do modelo de participante. O filtro é
// feito no backend (RelatorioService.relatorioCamisetasParticipantes).
//
// Dados vêm de GET /api/relatorio/camisetas-participantes.

import { buscarRelatorioCamisetasParticipantes } from '../data/apiRelatorios.js';
import RelatorioCamisetasPorTamanho from './RelatorioCamisetasPorTamanho.jsx';

export default function RelatorioCamisetasParticipantes() {
    return (
        <RelatorioCamisetasPorTamanho
            buscarDados={buscarRelatorioCamisetasParticipantes}
            perfil="participantes"
            rotuloTotal="Camisetas de participantes"
            descricaoTotal="Kit de participante + todas as avulsas (inclusive as da comissão). Conta inscritos ainda não confirmados"
            mensagemVazia="Nenhuma camiseta de participante pedida ainda."
        />
    );
}

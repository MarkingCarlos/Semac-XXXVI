// Relatório só das camisetas da comissão: total e quantidade por tamanho,
// separada por modelo, para fechar o pedido da camiseta exclusiva com o
// fornecedor. Entram só as inclusas no kit de quem tem role de comissão —
// avulsas são do modelo de participante e ficam de fora, mesmo quando
// compradas pela comissão. O filtro é feito no backend
// (RelatorioService.relatorioCamisetasComissao).
//
// Dados vêm de GET /api/relatorio/camisetas-comissao.

import { buscarRelatorioCamisetasComissao } from '../data/apiRelatorios.js';
import RelatorioCamisetasPorTamanho from './RelatorioCamisetasPorTamanho.jsx';

export default function RelatorioCamisetasComissao() {
    return (
        <RelatorioCamisetasPorTamanho
            buscarDados={buscarRelatorioCamisetasComissao}
            perfil="comissao"
            rotuloTotal="Camisetas da comissão"
            descricaoTotal="Só as inclusas no kit da comissão — avulsas não entram"
            mensagemVazia="Nenhuma camiseta da comissão pedida ainda."
        />
    );
}

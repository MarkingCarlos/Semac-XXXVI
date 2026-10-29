/* Liga/desliga o ranking oculto (coluna `ranking_oculto` de
   `configuracao_inscricao`): editado no /admin (Informações SEMAC >
   Gamificação). Ligado, o backend deixa de mandar o ranking de XP dos
   participantes e dos times — o /participantes e o /time mostram um aviso
   no lugar. O XP do próprio participante continua aparecendo. */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_CONFIGURACAO = `${API_URL}/api/configuracao-inscricao/ranking`;

/* Ano ainda sem configuração volta visível (o backend responde 200 com
   rankingOculto=false). */
export async function lerRankingOculto(ano) {
    const resposta = await apiFetch(`${ROTA_CONFIGURACAO}?ano=${ano}`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error('Falha ao carregar a visibilidade do ranking.');
    }
    const config = await resposta.json();
    return Boolean(config.rankingOculto);
}

export async function salvarRankingOculto(ano, rankingOculto) {
    const resposta = await apiFetch(ROTA_CONFIGURACAO, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, rankingOculto }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao salvar a visibilidade do ranking.');
    }
    const config = await resposta.json();
    return Boolean(config.rankingOculto);
}

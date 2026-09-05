/* Ranking de XP real (GET /api/pessoa/ranking) — lista completa, ordenada
   do maior pro menor, com `voce` já marcado pelo backend (pelo id do
   token, nunca por nome). O front fatia pódio/vizinhança a partir dela em
   rankingParticipantes.js. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Para onde o login devolve o usuário quando a sessão expira no meio. */
const ROTA_RETORNO = '/participantes';

export async function buscarRankingParticipante() {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/ranking`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) throw new Error('Falha ao carregar o ranking.');
    return await resposta.json();
}

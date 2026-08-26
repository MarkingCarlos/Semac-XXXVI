/* Camada de acesso à API de sorteio (tabelas `sorteio` / `ganhadores_sorteio`).
   Usada pela tela /sorteio. `registrarGanhador` exige sessão (o backend
   identifica o organizador pelo token) — por isso envia cabecalhosAuth(). */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/sorteio`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

/* Pessoas com presença confirmada no evento e que ainda não ganharam
   nenhum brinde — a pool que alimenta o rolo de nomes do sorteio. */
export async function listarElegiveis(eventoId) {
    const resposta = await apiFetch(`${ROTA}/elegiveis?eventoId=${eventoId}`);
    return lerOuFalhar(resposta, 'Falha ao carregar os participantes elegíveis.');
}

/* Confirma o ganhador (botão "ENTREGUE"): grava o sorteio e decrementa
   a quantidade disponível do brinde. */
export async function registrarGanhador({ eventoId, brindeId, participanteId }) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ eventoId, brindeId, participanteId }),
    });
    if (tratarErroAuth(resposta, '/sorteio')) {
        throw new Error('Sessão expirada.');
    }
    return lerOuFalhar(resposta, 'Falha ao registrar o ganhador.');
}

/* Camada de acesso à API de sorteios (tabelas `sorteio` / `ganhadores_sorteio`).
   O CRUD (nome + evento) é usado pelo /admin, aba Brindes → Sorteios; a
   realização (elegíveis + entrega) pela tela /sorteio. `registrarGanhador`
   exige sessão (o backend identifica quem realizou pelo token). */

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

function paraRequisicao(sorteio) {
    return {
        nome: sorteio.nome,
        eventoId: Number(sorteio.eventoId),
    };
}

// ── CRUD ────────────────────────────────────────────────────────────

export async function listarSorteios() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar os sorteios.');
}

export async function criarSorteio(sorteio) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(sorteio)),
    });
    return lerOuFalhar(resposta, 'Falha ao criar o sorteio.');
}

export async function atualizarSorteio(id, sorteio) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(sorteio)),
    });
    return lerOuFalhar(resposta, 'Falha ao atualizar o sorteio.');
}

export async function excluirSorteio(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir o sorteio.');
    }
}

// ── Realização ──────────────────────────────────────────────────────

/* Pessoas com presença confirmada no evento do sorteio e que ainda não
   ganharam nenhum brinde — a pool que alimenta o rolo de nomes. */
export async function listarElegiveis(sorteioId) {
    const resposta = await apiFetch(`${ROTA}/${sorteioId}/elegiveis`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar os participantes elegíveis.');
}

/* Confirma o ganhador (botão "ENTREGUE"): grava quem ganhou, qual brinde
   e quem realizou o sorteio. */
export async function registrarGanhador({ sorteioId, brindeId, participanteId }) {
    const resposta = await apiFetch(`${ROTA}/${sorteioId}/entrega`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ brindeId, participanteId }),
    });
    if (tratarErroAuth(resposta, '/sorteio')) {
        throw new Error('Sessão expirada.');
    }
    return lerOuFalhar(resposta, 'Falha ao registrar o ganhador.');
}

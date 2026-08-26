/* Camada de acesso à API de brindes (tabela `brinde`). Gerenciada na
   aba "Brindes" do /admin. `quantidadeEntregue` vem calculada pelo
   backend (contagem de sorteios vinculados) — não é editável aqui. */

import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/brinde`;

function paraRequisicao(brinde) {
    return {
        nome: brinde.nome,
        quantidade: Number(brinde.quantidade),
    };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarBrindes() {
    const resposta = await apiFetch(ROTA);
    return lerOuFalhar(resposta, 'Falha ao carregar os brindes.');
}

export async function criarBrinde(brinde) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paraRequisicao(brinde)),
    });
    return lerOuFalhar(resposta, 'Falha ao criar o brinde.');
}

export async function atualizarBrinde(id, brinde) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paraRequisicao(brinde)),
    });
    return lerOuFalhar(resposta, 'Falha ao atualizar o brinde.');
}

export async function excluirBrinde(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE' });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir o brinde.');
    }
}

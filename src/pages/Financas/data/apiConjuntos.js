import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/conjunto`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarConjuntos() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar conjuntos.');
}

export async function buscarConjunto(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar o conjunto.');
}

export async function criarConjunto(nome) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nome }),
    });
    return lerOuFalhar(resposta, 'Falha ao criar conjunto.');
}

export async function renomearConjunto(id, nome) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nome }),
    });
    return lerOuFalhar(resposta, 'Falha ao renomear conjunto.');
}

export async function excluirConjunto(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir conjunto.');
    }
}

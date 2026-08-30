/* Camada de acesso à API de trilhas (tabela `trilha`). Alimenta o seletor
   de trilha no formulário de Conteúdo e o painel de gerenciamento de
   trilhas na mesma seção. GET é público (também usado pelo filtro da
   Programação); escrita exige sessão de comissão. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/trilha`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarTrilhas() {
    const resposta = await apiFetch(ROTA);
    return lerOuFalhar(resposta, 'Falha ao carregar trilhas.');
}

export async function criarTrilha(trilha) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nome: trilha.nome }),
    });
    return lerOuFalhar(resposta, 'Falha ao criar trilha.');
}

export async function atualizarTrilha(id, trilha) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nome: trilha.nome }),
    });
    return lerOuFalhar(resposta, 'Falha ao atualizar trilha.');
}

export async function excluirTrilha(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir trilha.');
    }
}

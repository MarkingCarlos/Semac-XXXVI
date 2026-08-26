import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

/* Camada de acesso à API de níveis de participante (tabela `nivel`):
   nome + xp mínimo.

   O GET é público (sem header). As escritas são restritas a
   DIRETOR_SITE/PRESIDENTE no backend — sem cabecalhosAuth() elas voltam
   401. Gerenciados no /admin, seção "Informações SEMAC". */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/nivel`;

function paraRequisicao(nivel) {
    return { nome: nivel.nome, xpMinimo: Number(nivel.xpMinimo) };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarNiveis() {
    const resposta = await apiFetch(ROTA);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar níveis.');
    }
    return resposta.json();
}

export async function criarNivel(nivel) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(nivel)),
    });
    return lerOuFalhar(resposta, 'Falha ao criar nível.');
}

export async function atualizarNivel(id, nivel) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(nivel)),
    });
    return lerOuFalhar(resposta, 'Falha ao atualizar nível.');
}

export async function excluirNivel(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir nível.');
    }
}

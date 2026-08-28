/* Camada de acesso à API de tipos de evento (tabela `tipo_evento`).
   Alimenta o seletor de tipo no formulário de Conteúdo e o painel de
   gerenciamento de tipos na mesma seção. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/tipo-evento`;

/* `exigeInscricao` distingue minicurso (participante escolhe, vagas
   limitadas) de evento aberto (todo participante confirmado entra
   automaticamente). Ver InscricaoEventoService no backend. */
function paraRequisicao(tipo) {
    return {
        nome: tipo.nome,
        pontos: Number(tipo.pontos),
        exigeInscricao: Boolean(tipo.exigeInscricao),
    };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarTiposEvento() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar tipos de evento.');
}

export async function criarTipoEvento(tipo) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(tipo)),
    });
    return lerOuFalhar(resposta, 'Falha ao criar tipo de evento.');
}

export async function atualizarTipoEvento(id, tipo) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(tipo)),
    });
    return lerOuFalhar(resposta, 'Falha ao atualizar tipo de evento.');
}

export async function excluirTipoEvento(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir tipo de evento.');
    }
}

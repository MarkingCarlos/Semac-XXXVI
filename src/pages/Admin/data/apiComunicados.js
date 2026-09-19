/* Camada de acesso à API de comunicados avulsos (tabela `comunicado`).
   Gerenciada na aba "Comunicados" do /admin.

   Diferente de apiMensagens.js, que edita o texto de mensagens
   automáticas reaproveitadas: aqui cada disparo é um envio único, já
   acontecido, e a listagem é histórico — não há edição nem exclusão. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/comunicados`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarPublicos() {
    const resposta = await apiFetch(`${ROTA}/publicos`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar os públicos.');
}

export async function contarDestinatarios(publico, eventoId) {
    const parametros = new URLSearchParams({ publico });
    if (eventoId) parametros.set('eventoId', eventoId);
    const resposta = await apiFetch(`${ROTA}/destinatarios?${parametros}`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao contar os destinatários.');
}

export async function previaComunicado({ assunto, corpoMarkdown }) {
    const resposta = await apiFetch(`${ROTA}/previa`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assunto, corpoMarkdown }),
    });
    return lerOuFalhar(resposta, 'Falha ao gerar a prévia.');
}

export async function enviarTesteComunicado({ assunto, corpoMarkdown }) {
    const resposta = await apiFetch(`${ROTA}/teste`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assunto, corpoMarkdown }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao enviar o e-mail de teste.');
    }
}

export async function dispararComunicado({ assunto, corpoMarkdown, publico, eventoId }) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assunto, corpoMarkdown, publico, eventoId: eventoId || null }),
    });
    return lerOuFalhar(resposta, 'Falha ao disparar o comunicado.');
}

export async function listarHistorico() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar o histórico.');
}

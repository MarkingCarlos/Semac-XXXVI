/* Camada de acesso à API dos textos de e-mail (tabela `modelo_email`).
   Gerenciada na aba "Mensagens" do /admin.

   `chave` (ex.: INSCRICAO_CONFIRMADA) é dona do código: identifica qual
   acontecimento dispara a mensagem. Assunto e corpo são da comissão.
   `variaveis` vem do backend — é a lista fechada do que o corpo pode usar. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/admin/modelos-email`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarMensagens() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar as mensagens.');
}

export async function salvarMensagem(chave, { assunto, corpoMarkdown, ativo }) {
    const resposta = await apiFetch(`${ROTA}/${chave}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assunto, corpoMarkdown, ativo }),
    });
    return lerOuFalhar(resposta, 'Falha ao salvar a mensagem.');
}

/* Renderiza o que está na tela, sem salvar — alimenta o iframe de prévia. */
export async function previaMensagem(chave, { assunto, corpoMarkdown }) {
    const resposta = await apiFetch(`${ROTA}/${chave}/previa`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assunto, corpoMarkdown }),
    });
    return lerOuFalhar(resposta, 'Falha ao gerar a prévia.');
}

export async function enviarTesteMensagem(chave, { assunto, corpoMarkdown }) {
    const resposta = await apiFetch(`${ROTA}/${chave}/teste`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assunto, corpoMarkdown }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao enviar o e-mail de teste.');
    }
}

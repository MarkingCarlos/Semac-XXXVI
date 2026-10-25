/* Camada de acesso às perguntas dos debates.

   - Liga/desliga (coluna `perguntas_debate_abertas` de
     `configuracao_inscricao`): editado no /admin (Informações SEMAC) e
     lido pelo /participantes. Desligado, o glow e o botão "Mande sua
     pergunta" somem e o backend recusa novas perguntas com 409.
   - Lista de perguntas de um debate, inclusão à mão e exclusão: só
     diretoria e presidência (aba Conteúdo do /admin). */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_CONFIGURACAO = `${API_URL}/api/configuracao-inscricao/perguntas-debate`;
const ROTA_EVENTO = `${API_URL}/api/evento`;
const ROTA_PERGUNTAS = `${API_URL}/api/perguntas`;

/* Ano ainda sem configuração volta fechado (o backend responde 200 com
   perguntasDebateAbertas=false) até alguém liberar no /admin. */
export async function lerPerguntasDebateAbertas(ano) {
    const resposta = await apiFetch(`${ROTA_CONFIGURACAO}?ano=${ano}`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error('Falha ao carregar a liberação das perguntas para os debates.');
    }
    const config = await resposta.json();
    return Boolean(config.perguntasDebateAbertas);
}

export async function salvarPerguntasDebateAbertas(ano, perguntasDebateAbertas) {
    const resposta = await apiFetch(ROTA_CONFIGURACAO, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, perguntasDebateAbertas }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao salvar a liberação das perguntas para os debates.');
    }
    const config = await resposta.json();
    return Boolean(config.perguntasDebateAbertas);
}

/* Perguntas de um debate, mais antigas primeiro:
   [{ id, texto, nomeParticipante, autorIdentificado, enviadaEm }] —
   `autorIdentificado` false = enviada sem login (nome digitado ou "Anônimo"). */
export async function listarPerguntasDebate(eventoId) {
    const resposta = await apiFetch(`${ROTA_EVENTO}/${eventoId}/perguntas`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao carregar as perguntas.');
    }
    return resposta.json();
}

/* Pergunta incluída à mão pela comissão (ex.: entregue em papel). Vale
   com as perguntas fechadas; `nomeAutor` vazio aparece como "Anônimo".
   Devolve a pergunta no mesmo formato de listarPerguntasDebate, com
   `nomeCadastradaPor` = quem incluiu. */
export async function adicionarPerguntaDebate(eventoId, texto, nomeAutor) {
    const resposta = await apiFetch(`${ROTA_EVENTO}/${eventoId}/perguntas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ texto, nomeAutor }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao adicionar a pergunta.');
    }
    return resposta.json();
}

/* ── Roteiro do debate (painel /debate/<id>) ─────────────────────
   Cada pergunta traz `bloco` (null = fora dos blocos) e `daMediacao`. */

async function lerRespostaPergunta(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

/* Pergunta escrita pela mediação, já no bloco. */
export async function adicionarPerguntaMediacao(eventoId, texto, bloco) {
    const resposta = await apiFetch(`${ROTA_EVENTO}/${eventoId}/perguntas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ texto, bloco, daMediacao: true }),
    });
    return lerRespostaPergunta(resposta, 'Falha ao salvar a pergunta.');
}

/* Só pergunta da mediação: o backend recusa (409) a do público. */
export async function editarPerguntaMediacao(perguntaId, texto, bloco) {
    const resposta = await apiFetch(`${ROTA_PERGUNTAS}/${perguntaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ texto, bloco }),
    });
    return lerRespostaPergunta(resposta, 'Falha ao salvar a pergunta.');
}

/* Põe a pergunta num bloco ou tira (bloco null). Do público vai uma por
   bloco: o backend tira do bloco a que estava lá antes. */
export async function definirBlocoPerguntaDebate(perguntaId, bloco) {
    const resposta = await apiFetch(`${ROTA_PERGUNTAS}/${perguntaId}/bloco`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ bloco }),
    });
    return lerRespostaPergunta(resposta, 'Falha ao mudar o bloco da pergunta.');
}

/* Exclusão definitiva de uma pergunta (DELETE /api/perguntas/{id}). */
export async function excluirPerguntaDebate(perguntaId) {
    const resposta = await apiFetch(`${ROTA_PERGUNTAS}/${perguntaId}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir a pergunta.');
    }
}

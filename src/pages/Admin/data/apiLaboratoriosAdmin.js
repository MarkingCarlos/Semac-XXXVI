/* Camada de acesso aos laboratórios do Quiz dos Laboratórios (tabela
   `laboratorio`), a partir do /admin -> Informações SEMAC -> Gamificação.
   Restrito a DIRETOR_SITE/PRESIDENTE/DIRETOR_CONTEUDO, mesmo público da
   Mostra Técnica.

   Cada laboratório volta com as perguntas (com a alternativa correta
   marcada), o `codigoQr` — que a tela usa para montar o link
   /laboratorio/<codigoQr> — e quantos responderam e gabaritaram. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/laboratorio/laboratorios`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta, '/admin')) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || mensagemPadrao);
    }
    return resposta.status === 204 ? null : resposta.json();
}

export async function listarLaboratoriosAdmin(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar os laboratórios.');
}

/* `laboratorio`: { ano, nome, responsaveis, perguntas: [{ enunciado,
   alternativas: [{ texto, correta }] }] } */
export async function criarLaboratorio(laboratorio) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify(laboratorio),
    });
    return lerOuFalhar(resposta, 'Falha ao cadastrar o laboratório.');
}

/* Troca a lista inteira de perguntas. O código do QR não muda: o QR já
   impresso continua valendo. */
export async function atualizarLaboratorio(id, laboratorio) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify(laboratorio),
    });
    return lerOuFalhar(resposta, 'Falha ao salvar o laboratório.');
}

export async function definirQuizAbertoLaboratorio(id, aberto) {
    const resposta = await apiFetch(`${ROTA}/${id}/quiz-aberto`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ aberto }),
    });
    return lerOuFalhar(resposta, aberto ? 'Falha ao abrir o quiz.' : 'Falha ao fechar o quiz.');
}

/* Leva junto as perguntas e as respostas registradas. */
export async function removerLaboratorio(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    return lerOuFalhar(resposta, 'Falha ao remover o laboratório.');
}

/* Link que vai no QR code do laboratório. Usa a origem da página, então o
   QR gerado em produção aponta para o site de produção. */
export const linkQuizLaboratorio = (codigoQr) => `${window.location.origin}/laboratorio/${codigoQr}`;

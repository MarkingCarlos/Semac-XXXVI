/* Lado do participante do Quiz dos Laboratórios: abrir o quiz de um
   laboratório (página /laboratorio/<codigo>) e enviar as respostas. A
   pessoa vem sempre do token, nunca por parâmetro. */

import { cabecalhosAuth, tratarErroAuth } from '../../auth/sessao.js';
import { apiFetch } from '../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/laboratorio/quiz`;
const ROTA_LABORATORIOS = `${API_URL}/api/laboratorio/laboratorios`;

async function lerOuFalhar(resposta, mensagemPadrao, rotaRetorno) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta, rotaRetorno)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || mensagemPadrao);
    }
    return resposta.json();
}

/* Volta as perguntas sem gabarito, ou `resultado` se a pessoa já
   respondeu, ou `quizAberto: false`. */
export async function abrirQuizLaboratorio(codigo) {
    const resposta = await apiFetch(`${ROTA}/${encodeURIComponent(codigo)}`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Não foi possível abrir o quiz.', `/laboratorio/${codigo}`);
}

/* `escolhas`: [{ perguntaId, alternativaId }], uma por pergunta. */
export async function enviarRespostasQuizLaboratorio(codigo, escolhas) {
    const resposta = await apiFetch(`${ROTA}/${encodeURIComponent(codigo)}/resposta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ escolhas }),
    });
    return lerOuFalhar(resposta, 'Não foi possível enviar suas respostas.', `/laboratorio/${codigo}`);
}

/* Modo teste (/laboratorio/teste?laboratorio={id}), aberto pelo botão
   "Testar" do /admin: abre mesmo com o quiz fechado e a correção não
   grava tentativa nem dá XP. */
export async function abrirTesteQuizLaboratorio(laboratorioId) {
    const resposta = await apiFetch(`${ROTA_LABORATORIOS}/${laboratorioId}/teste`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Não foi possível abrir o teste.', '/admin');
}

export async function enviarRespostasTesteQuizLaboratorio(laboratorioId, escolhas) {
    const resposta = await apiFetch(`${ROTA_LABORATORIOS}/${laboratorioId}/teste/resposta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ escolhas }),
    });
    return lerOuFalhar(resposta, 'Não foi possível corrigir o teste.', '/admin');
}

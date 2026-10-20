/* Lado do participante da Mostra Técnica: registrar a visita a um stand
   (página /mostra/<codigo>) e ler o progresso (card da aba Desafios). A
   pessoa vem sempre do token, nunca por parâmetro. */

import { cabecalhosAuth, tratarErroAuth } from '../../auth/sessao.js';
import { apiFetch } from '../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/mostra`;

async function lerOuFalhar(resposta, mensagemPadrao, rotaRetorno) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta, rotaRetorno)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || mensagemPadrao);
    }
    return resposta.json();
}

/* Ler o mesmo QR de novo não é erro: volta `jaVisitado: true`. */
export async function registrarVisitaMostra(codigo) {
    const resposta = await apiFetch(`${ROTA}/visitar/${encodeURIComponent(codigo)}`, {
        method: 'POST',
        headers: cabecalhosAuth(),
    });
    return lerOuFalhar(resposta, 'Não foi possível registrar sua visita.', `/mostra/${codigo}`);
}

export async function lerProgressoMostra() {
    const resposta = await apiFetch(`${ROTA}/minhas`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Não foi possível carregar a Mostra Técnica.', '/participantes?tab=desafios');
}

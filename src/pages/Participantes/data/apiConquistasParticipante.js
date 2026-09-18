import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

/* Conquistas do próprio participante (GET /api/conquista/minhas).

   Vêm só as ativas — o que a presidência ainda não liberou não existe para
   o participante. Cada item traz `desbloqueada`: true mostra o card
   colorido, false mostra em preto e branco. Nome, descrição e pontos
   aparecem nos dois casos; a descrição bloqueada é a meta a perseguir.

   O participante é identificado pela claim do token, nunca por parâmetro. */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/conquista`;

export async function listarMinhasConquistas() {
    const resposta = await apiFetch(`${ROTA}/minhas`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return [];
        throw new Error('Falha ao carregar suas conquistas.');
    }
    return resposta.json();
}

/* Confirma que a animação de desbloqueio desta conquista já foi exibida,
   para ela não reaparecer na próxima abertura. Chamada no fim da animação
   de cada conquista, uma a uma.

   Falha em silêncio de propósito: é uma confirmação de exibição, e não há
   nada de útil a mostrar ao participante se ela não chegar. O pior caso é
   a celebração repetir uma vez. */
export async function marcarConquistaComoVista(conquistaId) {
    try {
        await apiFetch(`${ROTA}/${conquistaId}/vista`, {
            method: 'POST',
            headers: cabecalhosAuth(),
        });
    } catch {
        // sem ação: ver o comentário acima
    }
}

/* URL pública da imagem, com o nome do arquivo como cache-buster (a rota é
   fixa e responde com max-age de um dia). Null quando não há imagem. */
export function urlImagemConquista(id, imagemVersao) {
    if (!imagemVersao) return null;
    return `${ROTA}/${id}/imagem?v=${encodeURIComponent(imagemVersao)}`;
}

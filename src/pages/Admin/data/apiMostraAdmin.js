/* Camada de acesso aos trabalhos da Mostra Técnica (tabela
   `trabalho_mostra`), a partir do /admin -> Informações SEMAC ->
   Gamificação. Restrito a DIRETOR_SITE/PRESIDENTE/DIRETOR_CONTEUDO.

   Cada trabalho volta com o `codigoQr`, que a tela usa para montar o link
   /mostra/<codigoQr> impresso no stand, e com quantas visitas recebeu. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/mostra/trabalhos`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta, '/admin')) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || mensagemPadrao);
    }
    return resposta.status === 204 ? null : resposta.json();
}

export async function listarTrabalhosMostraAdmin(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar os trabalhos da Mostra Técnica.');
}

export async function criarTrabalhoMostra({ ano, titulo, apresentadores, stand }) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, titulo, apresentadores, stand }),
    });
    return lerOuFalhar(resposta, 'Falha ao cadastrar o trabalho.');
}

/* O código do QR não muda na edição: o QR já impresso continua valendo. */
export async function atualizarTrabalhoMostra(id, { ano, titulo, apresentadores, stand }) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, titulo, apresentadores, stand }),
    });
    return lerOuFalhar(resposta, 'Falha ao salvar o trabalho.');
}

/* Leva junto as visitas registradas para o trabalho. */
export async function removerTrabalhoMostra(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    return lerOuFalhar(resposta, 'Falha ao remover o trabalho.');
}

/* Link que vai no QR code do stand. Usa a origem da página, então o QR
   gerado em produção aponta para o site de produção. */
export const linkVisitaTrabalhoMostra = (codigoQr) => `${window.location.origin}/mostra/${codigoQr}`;

/* QR do brinde da comissão (26/10), mostrado no Início do /admin.
   GET /api/brinde-comissao/meu — qualquer papel de comissão; a pessoa vem
   do token. Fora do dia volta `disponivelHoje` false e o cartão não
   aparece. A leitura (baixa) fica no /checkin, ver apiCheckin.js. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function buscarMeuBrindeComissao() {
    const resposta = await apiFetch(`${API_URL}/api/brinde-comissao/meu`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta, '/admin')) return null;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível carregar o QR do brinde.');
    }
    return resposta.json();
}

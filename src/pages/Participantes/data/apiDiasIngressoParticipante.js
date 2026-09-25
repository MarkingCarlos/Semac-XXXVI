/* Dias em que vale o ingresso diário do participante logado
   (GET/PUT /api/pessoa/me/dias-ingresso, ver DiaIngressoService no
   backend). Quem comprou N diárias escolhe N dias; o QR dele só passa no
   check-in desses dias.

   Para quem tem ingresso de valor fixo a API devolve `porDia: false` e a
   área do participante não pede escolha nenhuma. Datas vêm como
   'YYYY-MM-DD', o mesmo id de dia usado pela agenda. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/pessoa/me/dias-ingresso`;

/* Para onde o login devolve o usuário quando a sessão expira no meio. */
const ROTA_RETORNO = '/participantes';

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function buscarDiasIngressoParticipante() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar os dias do seu ingresso.');
}

/* Envia a escolha completa (substitui a anterior) e devolve o estado
   atualizado. Erros de regra (quantidade, dia travado) vêm com a
   mensagem pronta da API. */
export async function salvarDiasIngressoParticipante(dias) {
    const resposta = await apiFetch(ROTA, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ dias }),
    });
    return lerOuFalhar(resposta, 'Não foi possível salvar os dias do seu ingresso.');
}

/* Parâmetros do orçamento da edição — SOMENTE LEITURA.

   Nada aqui é digitado. Os três multiplicadores de escala vêm de
   contagens no banco (inscritos, membros da comissão e palestrantes) e o
   teto vem do saldo da comissão, em lerResumoPrevisao(). Por isso não há
   função de atualizar: a rota só serve para a interface mostrar de onde
   cada número sai. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/orcamento`;

function deResposta(orcamento) {
    return { ...orcamento };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || mensagemPadrao);
    }
    return resposta.json();
}

export async function lerOrcamento() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao carregar o orçamento.'));
}

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

/* Camada de acesso à API do caixa (tabela `caixa`).

   Uma linha por conta — COMISSAO e FUNDUNESP —, por isso a rota é
   endereçada pela conta e não por id. Até a V28 a tabela guardava só o
   saldo da FUNDUNESP e se chamava `caixa_fundunesp`.

   A interface trabalha em CENTAVOS (inteiros); o backend usa reais
   (DECIMAL). */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/caixa`;

export const CONTAS = ['COMISSAO', 'FUNDUNESP'];

export const ROTULO_CONTA = {
    COMISSAO: 'Comissão',
    FUNDUNESP: 'FUNDUNESP',
};

function reaisParaCentavos(reais) {
    return Math.round(Number(reais ?? 0) * 100);
}

function centavosParaReais(centavos) {
    return Number(((centavos ?? 0) / 100).toFixed(2));
}

/* Backend → interface: valor em reais vira centavos. Recebe undefined
   quando tratarErroAuth já redirecionou por 401 — devolve o caixa zerado
   para não estourar durante a navegação. */
function deResposta(caixa) {
    return {
        id: caixa?.id ?? null,
        valor: reaisParaCentavos(caixa?.valor),
        conta: caixa?.conta ?? null,
        dataAtualizacao: caixa?.dataAtualizacao ?? null,
        atualizadoPorNome: caixa?.atualizadoPorNome ?? '',
    };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

/* Todas as contas de uma vez — o card do Resumo exibe as duas. */
export async function listarCaixas() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar o caixa.');
    return (lista ?? []).map(deResposta);
}

export async function lerCaixa(conta) {
    const resposta = await apiFetch(`${ROTA}/${conta}`, { headers: cabecalhosAuth() });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao carregar o caixa.'));
}

/* A data e o autor da alteração são definidos pelo backend. */
export async function atualizarCaixa(conta, valorCentavos) {
    const resposta = await apiFetch(`${ROTA}/${conta}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ valor: centavosParaReais(valorCentavos) }),
    });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao atualizar o caixa.'));
}

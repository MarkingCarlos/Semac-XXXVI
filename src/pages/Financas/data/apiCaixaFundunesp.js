import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

/* Camada de acesso à API do caixa da FundoUnesp (tabela `caixa_fundunesp`).
   Registro único — por isso a rota não tem /{id}. A interface trabalha em
   CENTAVOS (inteiros); o backend usa reais (DECIMAL). */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/caixa-fundunesp`;

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

export async function lerCaixaFundunesp() {
    const resposta = await fetch(ROTA, { headers: cabecalhosAuth() });
    const caixa = await lerOuFalhar(resposta, 'Falha ao carregar o caixa da FundoUnesp.');
    return deResposta(caixa);
}

/* A data e o autor da alteração são definidos pelo backend. */
export async function atualizarCaixaFundunesp(valorCentavos) {
    const resposta = await fetch(ROTA, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ valor: centavosParaReais(valorCentavos) }),
    });
    const atualizado = await lerOuFalhar(resposta, 'Falha ao atualizar o caixa da FundoUnesp.');
    return deResposta(atualizado);
}

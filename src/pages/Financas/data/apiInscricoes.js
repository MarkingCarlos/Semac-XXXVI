

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/pessoa/inscricoes`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

/* Três valores por inscrição: o que a pessoa pagou (bruto), o que a
   maquininha reteve (taxa, zero fora do cartão) e o que sobrou para a
   comissão (líquido). É o líquido que entra no saldo — quem soma aqui
   deve usar `valorLiquido`, nunca o bruto. */
function deResposta(inscricao) {
    return {
        ...inscricao,
        valorBruto: reaisParaCentavos(inscricao.valorBruto),
        taxaCartao: reaisParaCentavos(inscricao.taxaCartao),
        valorLiquido: reaisParaCentavos(inscricao.valorLiquido),
    };
}

export async function listarInscricoes() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return [];
        throw new Error('Falha ao carregar inscrições.');
    }
    const lista = await resposta.json();
    return lista.map(deResposta);
}



import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/pessoa/inscricoes`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}


function deResposta(inscricao) {
    return { ...inscricao, valor: reaisParaCentavos(inscricao.valor) };
}

export async function listarInscricoes() {
    const resposta = await fetch(ROTA, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return [];
        throw new Error('Falha ao carregar inscrições.');
    }
    const lista = await resposta.json();
    return lista.map(deResposta);
}

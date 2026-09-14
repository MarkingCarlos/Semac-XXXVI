/* Camada de acesso ao orçamento da edição (tabela `orcamento`).

   Guarda o teto de gastos e os contadores que alimentam a escala das
   previsões — os mesmos que a planilha tratava como constantes soltas
   nas notas ("estimativa total: 140 pessoas", "comissão: 39 membros").
   Mudar `inscritosPrevistos` aqui recalcula todo item POR_INSCRITO. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/orcamento`;

function deResposta(orcamento) {
    return { ...orcamento, teto: Math.round(Number(orcamento?.teto ?? 0) * 100) };
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

export async function atualizarOrcamento(orcamento) {
    const resposta = await apiFetch(ROTA, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            teto: Number(((orcamento.teto ?? 0) / 100).toFixed(2)),
            inscritosPrevistos: Number(orcamento.inscritosPrevistos),
            membrosComissao: Number(orcamento.membrosComissao),
            palestrantesPrevistos: Number(orcamento.palestrantesPrevistos),
        }),
    });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao atualizar o orçamento.'));
}

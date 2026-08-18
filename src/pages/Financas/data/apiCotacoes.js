import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/cotacao`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

function centavosParaReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

/* Backend → interface: valores em reais viram centavos, em cada linha
   de fornecedor. */
function deResposta(cotacao) {
    return {
        ...cotacao,
        fornecedores: cotacao.fornecedores.map((linha) => ({
            ...linha,
            valorUnitario: reaisParaCentavos(linha.valorUnitario),
        })),
    };
}

/* Interface → backend: centavos viram reais em cada linha de fornecedor. */
function paraRequisicao(cotacao) {
    return {
        descricao: cotacao.descricao,
        categoria: cotacao.categoria,
        quantidade: cotacao.quantidade,
        fornecedores: cotacao.fornecedores.map((linha) => ({
            fornecedorId: linha.fornecedorId,
            valorUnitario: centavosParaReais(linha.valorUnitario),
        })),
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

export async function listarCotacoes() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar cotações.');
    return lista.map(deResposta);
}

export async function criarCotacao(cotacao) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(cotacao)),
    });
    const criada = await lerOuFalhar(resposta, 'Falha ao registrar cotação.');
    return deResposta(criada);
}

export async function atualizarCotacao(id, cotacao) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(cotacao)),
    });
    const atualizada = await lerOuFalhar(resposta, 'Falha ao atualizar cotação.');
    return deResposta(atualizada);
}

export async function excluirCotacao(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir cotação.');
    }
}

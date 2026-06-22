import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/compra`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

function centavosParaReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

/* Backend → interface: valores em reais viram centavos. */
function deResposta(compra) {
    return {
        ...compra,
        valorUnitario: reaisParaCentavos(compra.valorUnitario),
        valorTotal: reaisParaCentavos(compra.valorTotal),
    };
}

/* Interface → backend: centavos viram reais; total/data ficam no backend. */
function paraRequisicao(compra) {
    return {
        descricao: compra.descricao,
        categoria: compra.categoria,
        fornecedorId: compra.fornecedorId,
        valorUnitario: centavosParaReais(compra.valorUnitario),
        quantidade: compra.quantidade,
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

export async function listarCompras() {
    const resposta = await fetch(ROTA, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar compras.');
    return lista.map(deResposta);
}

export async function criarCompra(compra) {
    const resposta = await fetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(compra)),
    });
    const criada = await lerOuFalhar(resposta, 'Falha ao registrar compra.');
    return deResposta(criada);
}

export async function atualizarCompra(id, compra) {
    const resposta = await fetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(compra)),
    });
    const atualizada = await lerOuFalhar(resposta, 'Falha ao atualizar compra.');
    return deResposta(atualizada);
}

export async function excluirCompra(id) {
    const resposta = await fetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir compra.');
    }
}

/* Camada de acesso às categorias de previsão (tabela `previsao_categoria`).

   Cada sub-tabela da planilha de previsão é uma categoria aqui — criar
   uma nova não exige migration. Os totais vêm zerados nesta rota; quem
   os calcula é lerResumoPrevisao(), que tem o orçamento para aplicar as
   escalas. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/previsao-categoria`;

function reaisParaCentavos(reais) {
    return reais == null ? null : Math.round(Number(reais) * 100);
}

function centavosParaReais(centavos) {
    return centavos == null ? null : Number((centavos / 100).toFixed(2));
}

function deResposta(categoria) {
    return { ...categoria, teto: reaisParaCentavos(categoria.teto) };
}

function paraRequisicao(categoria) {
    return {
        nome: categoria.nome,
        cor: categoria.cor,
        teto: categoria.teto ? centavosParaReais(categoria.teto) : null,
        ordem: categoria.ordem ?? 0,
    };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarCategoriasPrevisao() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar as categorias.');
    return lista.map(deResposta);
}

export async function criarCategoriaPrevisao(categoria) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(categoria)),
    });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao criar a categoria.'));
}

export async function atualizarCategoriaPrevisao(id, categoria) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(categoria)),
    });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao atualizar a categoria.'));
}

export async function excluirCategoriaPrevisao(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir a categoria.');
    }
}

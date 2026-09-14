/* Camada de acesso à API de previsão de gastos (tabela `previsao_item`).

   Como no resto do módulo, a interface trabalha com valores em CENTAVOS
   (inteiros) e o backend em reais (DECIMAL) — a conversão acontece aqui,
   nas bordas.

   `valorTotal` e `fator` vêm calculados do backend e são somente leitura:
   dependem da escala e do orçamento vigente, não de campos do formulário. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/previsao`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais ?? 0) * 100);
}

function centavosParaReais(centavos) {
    return Number(((centavos ?? 0) / 100).toFixed(2));
}

function deResposta(item) {
    return {
        ...item,
        valorUnitario: reaisParaCentavos(item.valorUnitario),
        frete: reaisParaCentavos(item.frete),
        valorTotal: reaisParaCentavos(item.valorTotal),
    };
}

/* Interface → backend. `conta` vazia vira null de propósito: a conta é
   legitimamente desconhecida enquanto a comissão não a define. */
function paraRequisicao(item) {
    return {
        descricao: item.descricao,
        categoriaId: Number(item.categoriaId),
        fornecedorId: item.fornecedorId ? Number(item.fornecedorId) : null,
        quantidade: Number(item.quantidade),
        valorUnitario: centavosParaReais(item.valorUnitario),
        frete: centavosParaReais(item.frete),
        escala: item.escala,
        conta: item.conta || null,
        status: item.status,
        dataPrevista: item.dataPrevista || null,
        observacao: item.observacao || null,
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

export async function listarPrevisoes() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar a previsão de gastos.');
    return lista.map(deResposta);
}

/* Consolidado do dashboard: totais, categorias e balanço por conta.
   Os valores monetários também chegam em reais e viram centavos aqui. */
export async function lerResumoPrevisao() {
    const resposta = await apiFetch(`${ROTA}/resumo`, { headers: cabecalhosAuth() });
    const resumo = await lerOuFalhar(resposta, 'Falha ao carregar o resumo da previsão.');
    return {
        previstoAberto: reaisParaCentavos(resumo.previstoAberto),
        realizado: reaisParaCentavos(resumo.realizado),
        projecaoTotal: reaisParaCentavos(resumo.projecaoTotal),
        teto: reaisParaCentavos(resumo.teto),
        margem: reaisParaCentavos(resumo.margem),
        categorias: (resumo.categorias ?? []).map((categoria) => ({
            ...categoria,
            teto: categoria.teto == null ? null : reaisParaCentavos(categoria.teto),
            totalPrevisto: reaisParaCentavos(categoria.totalPrevisto),
            totalRealizado: reaisParaCentavos(categoria.totalRealizado),
        })),
        contas: (resumo.contas ?? []).map((conta) => ({
            conta: conta.conta,
            caixaInicial: reaisParaCentavos(conta.caixaInicial),
            entradas: reaisParaCentavos(conta.entradas),
            saidas: reaisParaCentavos(conta.saidas),
            previsto: reaisParaCentavos(conta.previsto),
            saldo: reaisParaCentavos(conta.saldo),
        })),
        orcamento: resumo.orcamento && {
            ...resumo.orcamento,
            teto: reaisParaCentavos(resumo.orcamento.teto),
        },
    };
}

export async function criarPrevisao(item) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(item)),
    });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao registrar a previsão.'));
}

export async function atualizarPrevisao(id, item) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(item)),
    });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao atualizar a previsão.'));
}

export async function excluirPrevisao(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir a previsão.');
    }
}

/* Converte a previsão em compra: cria a compra correspondente e marca o
   item como PAGO. Caminho de mão única — não há desconversão. */
export async function converterPrevisaoEmCompra(id) {
    const resposta = await apiFetch(`${ROTA}/${id}/converter`, {
        method: 'POST',
        headers: cabecalhosAuth(),
    });
    return deResposta(await lerOuFalhar(resposta, 'Falha ao converter a previsão em compra.'));
}

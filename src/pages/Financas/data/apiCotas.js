import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

/* Camada de acesso à API de cotas (tabela `cota`): nível + valor.
   A interface trabalha em CENTAVOS; o backend usa reais (DECIMAL).

   O GET é público (consumido pela página /cotas por visitante deslogado)
   e por isso não manda header. As escritas são restritas a
   DIRETOR_SITE/PRESIDENTE no backend — sem cabecalhosAuth() elas voltam
   401. Gerenciadas no /admin, seção "Informações SEMAC". */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/cota`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais ?? 0) * 100);
}

function centavosParaReais(centavos) {
    return Number(((centavos ?? 0) / 100).toFixed(2));
}

/* Backend → interface: valor em reais vira centavos. */
function deResposta(cota) {
    return { id: cota.id, nivel: cota.nivel, valor: reaisParaCentavos(cota.valor) };
}

/* Interface → backend: centavos viram reais. */
function paraRequisicao(cota) {
    return { nivel: cota.nivel, valor: centavosParaReais(cota.valor) };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarCotas() {
    const resposta = await fetch(ROTA);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar cotas.');
    }
    const lista = await resposta.json();
    return lista.map(deResposta);
}

export async function criarCota(cota) {
    const resposta = await fetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(cota)),
    });
    const criada = await lerOuFalhar(resposta, 'Falha ao criar cota.');
    return deResposta(criada);
}

export async function atualizarCota(id, cota) {
    const resposta = await fetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(cota)),
    });
    const atualizada = await lerOuFalhar(resposta, 'Falha ao atualizar cota.');
    return deResposta(atualizada);
}

export async function excluirCota(id) {
    const resposta = await fetch(`${ROTA}/${id}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir cota.');
    }
}

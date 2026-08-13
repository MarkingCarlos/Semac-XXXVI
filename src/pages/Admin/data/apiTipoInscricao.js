/* Camada de acesso à API de tipos de ingresso (tabela `tipo_inscricao`).
   Gerenciada no /admin (seção "Informações SEMAC"). A interface trabalha
   com valores em CENTAVOS para reaproveitar o CampoMoeda; o backend usa
   reais (DECIMAL). A conversão acontece aqui, nas bordas. */

import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/tipo-inscricao`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

function centavosParaReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

/* Backend → interface: valor em reais vira centavos. */
function deResposta(tipo) {
    return { ...tipo, valor: reaisParaCentavos(tipo.valor) };
}

/* Interface → backend: centavos viram reais. */
function paraRequisicao(tipo) {
    return {
        nome: tipo.nome,
        valor: centavosParaReais(tipo.valor),
        ano: tipo.ano,
        ativo: tipo.ativo,
    };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarTiposInscricao(ano) {
    const url = ano != null ? `${ROTA}?ano=${ano}` : ROTA;
    const resposta = await apiFetch(url);
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar ingressos.');
    return lista.map(deResposta);
}

export async function criarTipoInscricao(tipo) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paraRequisicao(tipo)),
    });
    const criado = await lerOuFalhar(resposta, 'Falha ao criar ingresso.');
    return deResposta(criado);
}

export async function atualizarTipoInscricao(id, tipo) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paraRequisicao(tipo)),
    });
    const atualizado = await lerOuFalhar(resposta, 'Falha ao atualizar ingresso.');
    return deResposta(atualizado);
}

export async function excluirTipoInscricao(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE' });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir ingresso.');
    }
}

/* Camada de acesso aos dias e palavras do Termo (tabelas `termo_dia` e
   `termo_palavra`), a partir do /admin -> Termo. Restrito a
   DIRETOR_SITE/PRESIDENTE.

   Cada dia tem uma data e um conjunto de palavras (5 a 10 letras); cada
   participante recebe uma delas por sorteio quando abre o jogo.

   A leitura NÃO devolve as palavras — só o tamanho de cada uma e quantos
   participantes a receberam. É de propósito: nem quem cadastrou a lê de
   volta pela API, mesmo critério do `codigoDefinido` do tipo de ingresso.
   Quem esquecer qual era remove e cadastra de novo. */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/termo`;

async function mensagemDeErro(resposta, padrao) {
    const corpo = await resposta.json().catch(() => null);
    return corpo?.mensagem || corpo?.message || padrao;
}

/* Sempre volta os quatro dias; os ainda não cadastrados vêm com data null
   e lista de palavras vazia, para a tela ter os quatro cards desde o início. */
export async function listarDiasTermoAdmin(ano) {
    const resposta = await apiFetch(`${ROTA}/dias?ano=${ano}`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Falha ao carregar os dias do Termo.'));
    }
    return resposta.json();
}

/* As respostas abaixo devolvem o dia inteiro já atualizado, com a lista
   de palavras como ficou. */

export async function salvarDataDiaTermo(dia, { ano, data }) {
    const resposta = await apiFetch(`${ROTA}/dias/${dia}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, data }),
    });
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Falha ao salvar a data do dia.'));
    }
    return resposta.json();
}

export async function adicionarPalavrasTermo(dia, { ano, palavras }) {
    const resposta = await apiFetch(`${ROTA}/dias/${dia}/palavras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, palavras }),
    });
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Falha ao adicionar as palavras.'));
    }
    return resposta.json();
}

/* Recusado (409) se a palavra já foi sorteada para alguém. */
export async function removerPalavraTermo(id) {
    const resposta = await apiFetch(`${ROTA}/palavras/${id}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Falha ao remover a palavra.'));
    }
    return resposta.json();
}

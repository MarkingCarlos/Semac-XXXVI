/* Camada de acesso às palavras do Termo (tabela `termo_palavra`), a partir
   do /admin -> Termo. Restrito a DIRETOR_SITE/PRESIDENTE.

   A leitura NÃO devolve a palavra — só `definida`, dizendo se aquele dia
   já tem uma cadastrada. É de propósito: nem quem cadastrou a lê de volta
   pela API, mesmo critério do `codigoDefinido` do tipo de ingresso. Quem
   esquecer qual era cadastra de novo. */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/termo/palavras`;

async function mensagemDeErro(resposta, padrao) {
    const corpo = await resposta.json().catch(() => null);
    return corpo?.mensagem || corpo?.message || padrao;
}

/* Sempre volta os quatro dias; os ainda não cadastrados vêm com data null
   e `definida` false, para a tela ter as quatro linhas desde o início. */
export async function listarPalavrasTermo(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Falha ao carregar as palavras do Termo.'));
    }
    return resposta.json();
}

export async function salvarPalavraTermo(dia, { ano, data, palavra }) {
    const resposta = await apiFetch(`${ROTA}/${dia}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, data, palavra }),
    });
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Falha ao salvar a palavra do dia.'));
    }
    return resposta.json();
}

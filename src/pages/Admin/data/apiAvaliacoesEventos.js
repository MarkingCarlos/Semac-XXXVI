/* Resumo da pesquisa de satisfação (tabela `avaliacao_evento`): média e
   quantidade de notas por evento avaliável, mais quantos tiveram
   presença — para a taxa de resposta. Só leitura; quem avalia é o
   participante, no /participantes. Diretoria e presidência (aba
   Conteúdo do /admin). */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_RESUMO_AVALIACOES = `${API_URL}/api/evento/avaliacoes`;

export async function listarResumoAvaliacoesEventos() {
    const resposta = await apiFetch(ROTA_RESUMO_AVALIACOES, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error('Falha ao carregar as avaliações dos eventos.');
    }
    return resposta.json();
}

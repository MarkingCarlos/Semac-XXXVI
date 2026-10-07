/* Camada de acesso ao botão "Escolha de minicursos" (coluna
   `escolha_minicursos_aberta` de `configuracao_inscricao`). Editado no
   /admin (aba Conteúdo) e lido pelo /participantes. Fechada, ninguém
   entra nem sai de minicurso — o backend recusa com 409. */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/configuracao-inscricao/minicursos`;

/* Ano ainda sem configuração volta fechado (o backend responde 200 com
   escolhaMinicursosAberta=false) até alguém liberar no /admin. */
export async function lerEscolhaMinicursos(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error('Falha ao carregar a liberação da escolha de minicursos.');
    }
    const config = await resposta.json();
    return Boolean(config.escolhaMinicursosAberta);
}

export async function salvarEscolhaMinicursos(ano, escolhaMinicursosAberta) {
    const resposta = await apiFetch(ROTA, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, escolhaMinicursosAberta }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao salvar a liberação da escolha de minicursos.');
    }
    const config = await resposta.json();
    return Boolean(config.escolhaMinicursosAberta);
}

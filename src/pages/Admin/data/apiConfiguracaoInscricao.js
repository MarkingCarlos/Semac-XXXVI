/* Camada de acesso à configuração de inscrições (tabela
   `configuracao_inscricao`). Registro único por edição, gerenciado no
   /admin (seção "Informações SEMAC"). Controla se o botão "Inscreva-se"
   aparece na Home pública. */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/configuracao-inscricao`;

/* Ano ainda sem configuração cadastrada volta aberto (o backend responde
   200 com inscricoesAbertas=true), então o botão continua visível por
   padrão até um admin desativá-lo explicitamente. */
export async function lerConfiguracaoInscricao(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar a configuração de inscrições.');
    }
    const config = await resposta.json();
    return config.inscricoesAbertas;
}

export async function salvarConfiguracaoInscricao(ano, inscricoesAbertas) {
    const resposta = await apiFetch(ROTA, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, inscricoesAbertas }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao salvar a configuração de inscrições.');
    }
    const config = await resposta.json();
    return config.inscricoesAbertas;
}

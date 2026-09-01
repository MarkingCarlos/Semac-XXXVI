/* Comunicação com a API de relatórios (java_api). Base: /api/relatorio.
   Usada pela aba Relatórios do /admin. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Camisetas a comprar no total, divididas entre dadas (inclusas no
   ingresso) e avulsas (compra à parte), mais a quantidade por modelo e
   tamanho para orientar a compra real. */
export async function buscarRelatorioCamisetas() {
    const resposta = await apiFetch(`${API_URL}/api/relatorio/camisetas`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Não foi possível carregar o relatório de camisetas.');
    return resposta.json();
}

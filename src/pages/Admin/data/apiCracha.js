/* Comunicação com a API de crachás (java_api). Base: /api/cracha.
   Usada pela subaba Crachás da aba Pessoas do /admin. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Todo mundo que recebe crachá impresso: participantes (confirmados e
   pendentes), comissão e palestrantes, em ordem alfabética. Cada item:
   { id, nome, uuid, perfil } — perfil PARTICIPANTE | COMISSAO |
   PALESTRANTE; palestrante vem com uuid null (sai sem QR). */
export async function listarCrachas() {
    const resposta = await apiFetch(`${API_URL}/api/cracha`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Não foi possível carregar a lista de crachás.');
    return resposta.json();
}

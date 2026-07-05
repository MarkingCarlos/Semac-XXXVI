/* Perfil do próprio usuário logado — usado pela seção "Início" do /admin.
   Base: /api/pessoa/me. Ambos os endpoints exigem Bearer token; o usuário
   é identificado pela claim do token, nunca por parâmetro. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/pessoa/me`;

/* Carrega nome, e-mail, função (read-only), RA e camiseta (editáveis).
   Retorna null quando a sessão expirou (tratarErroAuth já redireciona). */
export async function buscarPerfil() {
    const resposta = await fetch(ROTA, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta)) return null;
    if (!resposta.ok) throw new Error('Não foi possível carregar seu perfil.');
    return resposta.json();
}

/* Salva os campos editáveis: RA (opcional) e a camiseta (modelo + tamanho).
   Retorna o perfil atualizado, ou null quando a sessão expirou. */
export async function atualizarPerfil({ ra, modelo, tamanho }) {
    const resposta = await fetch(ROTA, {
        method: 'PATCH',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ra: ra?.trim() || null, modelo, tamanho }),
    });
    if (tratarErroAuth(resposta)) return null;
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || 'Não foi possível salvar as alterações.');
    }
    return resposta.json();
}

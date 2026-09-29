/* Recuperação de senha (java_api) — base /api/auth/recuperar-senha.
   Fluxo público, sem token: quem usa é justamente quem não consegue
   entrar. Regras (validade, uso único, bloqueio) ficam no backend, em
   RecuperacaoSenhaService. */

import { apiFetch } from '../../lib/apiFetch.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/* Lança um Error com a `mensagem` da API. Em 429 (bloqueio por
   tentativas) o erro carrega `segundosRestantes` para a contagem
   regressiva do modal. */
async function postar(caminho, corpo, mensagemPadrao) {
    const resposta = await apiFetch(`${API_URL}/api/auth/recuperar-senha/${caminho}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
    })
    if (!resposta.ok) {
        const erroCorpo = await resposta.json().catch(() => null)
        const erro = new Error(erroCorpo?.mensagem || mensagemPadrao)
        erro.status = resposta.status
        erro.segundosRestantes = erroCorpo?.segundosRestantes ?? null
        throw erro
    }
    return resposta.status === 204 ? null : resposta.json().catch(() => null)
}

/* Sempre "dá certo", exista o e-mail ou não — o backend não revela quem
   tem conta. */
export function solicitarCodigoRecuperacaoSenha(email) {
    return postar('solicitar', { email }, 'Não foi possível enviar o código.')
}

/* Devolve o tokenTroca que autoriza a etapa seguinte. */
export async function verificarCodigoRecuperacaoSenha(email, codigo) {
    const corpo = await postar('verificar', { email, codigo }, 'Não foi possível verificar o código.')
    return corpo.tokenTroca
}

export function redefinirSenhaRecuperacao(tokenTroca, novaSenha) {
    return postar('redefinir', { tokenTroca, novaSenha }, 'Não foi possível trocar a senha.')
}

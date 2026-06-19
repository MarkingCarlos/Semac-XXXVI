/* Sessão do usuário autenticado (Bearer token / JWT).

   Guarda o token e os dados básicos do usuário no localStorage, para
   sobreviver a reload e à navegação por URL. O token é enviado em
   Authorization: Bearer em cada requisição protegida.

   Ressalva consciente: localStorage é legível por JS (vulnerável a XSS).
   Aceitável pelo perfil interno do sistema; migrar para cookie httpOnly
   se os dados se tornarem mais sensíveis. */

const CHAVE_SESSAO = 'semacSessao';

/* Papéis com acesso ao módulo financeiro (/financeiro). */
const PAPEIS_FINANCEIRO = ['DIRETOR_SITE', 'PRESIDENTE'];

export function salvarSessao({ token, id, nome, email, role }) {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, id, nome, email, role }));
}

export function lerSessao() {
    try {
        const bruto = localStorage.getItem(CHAVE_SESSAO);
        return bruto ? JSON.parse(bruto) : null;
    } catch {
        return null;
    }
}

export function limparSessao() {
    localStorage.removeItem(CHAVE_SESSAO);
}

export function usuarioLogado() {
    return lerSessao();
}

export function temAcessoFinanceiro() {
    const sessao = lerSessao();
    return !!sessao && PAPEIS_FINANCEIRO.includes(sessao.role);
}

/* Mescla o cabeçalho Authorization (quando há token) aos cabeçalhos
   informados. Inofensivo em endpoints abertos. */
export function cabecalhosAuth(extra = {}) {
    const sessao = lerSessao();
    return sessao?.token
        ? { ...extra, Authorization: `Bearer ${sessao.token}` }
        : { ...extra };
}

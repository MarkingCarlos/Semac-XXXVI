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

/* Papéis que podem VER a aba Previsão do /financeiro, sem editar nada.
   Espelha PAPEIS_LEITURA_PREVISAO do backend (SecurityConfig). */
const PAPEIS_LEITURA_PREVISAO = [...PAPEIS_FINANCEIRO, 'DIRETOR_CONTEUDO', 'DIRETOR_PATROCINIO', 'DIRETOR_APOIO', 'DIRETOR_MARKETING'];

/* Papéis com acesso ao módulo de administração (/admin). */
const PAPEIS_ADMIN = ['MEMBRO', 'DIRETOR_CONTEUDO', 'DIRETOR_PATROCINIO', 'DIRETOR_APOIO', 'DIRETOR_MARKETING', 'DIRETOR_SITE', 'PRESIDENTE'];

/* Diretoria: todos os diretores mais a presidência — ou seja, comissão
   exceto MEMBRO. Espelha PAPEIS_ADMIN_SEM_MEMBRO do backend
   (SecurityConfig), usado por brindes, relatórios e pela concessão de
   conquistas. Derivado de PAPEIS_ADMIN para que um papel novo lá já entre
   aqui automaticamente. */
const PAPEIS_DIRETORIA = PAPEIS_ADMIN.filter((papel) => papel !== 'MEMBRO');

/* Papel com acesso à área do participante (/participantes) — atribuído
   pelo admin quando a inscrição é confirmada (ver apiParticipantes.js). */
const PAPEIS_PARTICIPANTE = ['PARTICIPANTE'];

/* Retorna true se o token JWT no localStorage está expirado ou ausente.
   Decodifica apenas o payload (segunda parte do JWT) sem validar assinatura. */
function sessaoExpirada() {
    const sessao = lerSessao();
    if (!sessao?.token) return true;
    try {
        const payload = JSON.parse(atob(sessao.token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

/* Se a resposta for 401 (token expirado/inválido), limpa a sessão e redireciona
   para o login preservando a rota de retorno. Retorna true se tratou o 401.
   `rotaRetorno` é para onde o login devolve o usuário — o padrão atende o
   módulo financeiro, e a área do participante passa a própria rota. */
export function tratarErroAuth(resposta, rotaRetorno = '/financeiro') {
    if (resposta.status !== 401) return false;
    limparSessao();
    window.location.replace(`/inscricoes?tab=entrar&next=${encodeURIComponent(rotaRetorno)}`);
    return true;
}

export function salvarSessao({ token, id, nome, email, role, uuid }) {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, id, nome, email, role, uuid }));
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
    return !!sessao && PAPEIS_FINANCEIRO.includes(sessao.role) && !sessaoExpirada();
}

/* Entrada no /financeiro. Quem tem só esta (e não temAcessoFinanceiro)
   vê apenas a aba Previsão, em modo leitura. */
export function temAcessoPrevisao() {
    const sessao = lerSessao();
    return !!sessao && PAPEIS_LEITURA_PREVISAO.includes(sessao.role) && !sessaoExpirada();
}

export function temAcessoAdmin() {
    const sessao = lerSessao();
    return !!sessao && PAPEIS_ADMIN.includes(sessao.role) && !sessaoExpirada();
}

/* Usado para esconder o que só a diretoria pode fazer — hoje, conceder e
   revogar conquista. Sem isso um MEMBRO veria o botão e só descobriria a
   restrição pelo 403. A checagem de verdade é no backend; esta é de
   interface. */
export function temAcessoDiretoria() {
    const sessao = lerSessao();
    return !!sessao && PAPEIS_DIRETORIA.includes(sessao.role) && !sessaoExpirada();
}

export function temAcessoParticipante() {
    const sessao = lerSessao();
    return !!sessao && PAPEIS_PARTICIPANTE.includes(sessao.role) && !sessaoExpirada();
}

/* Mescla o cabeçalho Authorization (quando há token) aos cabeçalhos
   informados. Inofensivo em endpoints abertos. */
export function cabecalhosAuth(extra = {}) {
    const sessao = lerSessao();
    return sessao?.token
        ? { ...extra, Authorization: `Bearer ${sessao.token}` }
        : { ...extra };
}

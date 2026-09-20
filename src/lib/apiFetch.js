const TIMEOUT_PADRAO = 15000;

/* Liga/desliga o log no console. Manter true durante o diagnóstico. */
const LOGAR = true;

/* Histórico de medições da sessão, exposto em window.__semacTiming.
   Cada item: { metodo, url, status, duracaoMs, ttfbMs, erro, quando }. */
const historicoTiming = [];
if (typeof window !== 'undefined') {
    window.__semacTiming = historicoTiming;
}

/* Marca de tempo monotônica em ms (performance.now quando disponível). */
function agora() {
    return typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
}


function lerTtfb(url) {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) return null;
    const entradas = performance.getEntriesByType('resource');
    for (let i = entradas.length - 1; i >= 0; i--) {
        const entrada = entradas[i];
        if (entrada.name === url || entrada.name.startsWith(url)) {
            const ttfb = entrada.responseStart - entrada.requestStart;
            return ttfb > 0 ? Math.round(ttfb) : null;
        }
    }
    return null;
}

function registrarMedicao(dados) {
    const item = { ...dados, quando: new Date().toISOString() };
    historicoTiming.push(item);
    if (LOGAR && typeof console !== 'undefined') {
        const ttfb = dados.ttfbMs != null ? `${dados.ttfbMs}ms` : 'n/d';
        console.log(
            `[apiFetch] ${dados.metodo} ${dados.url} → ${dados.status} | total=${dados.duracaoMs}ms ttfb=${ttfb}` +
            (dados.erro ? ` | ${dados.erro}` : '')
        );
    }
}

export async function apiFetch(url, opcoes = {}) {
    const { timeout = TIMEOUT_PADRAO, ...resto } = opcoes;
    const metodo = (resto.method || 'GET').toUpperCase();
    const urlTexto = typeof url === 'string' ? url : (url && url.url) || String(url);

    const controlador = new AbortController();
    const idTimeout = setTimeout(() => controlador.abort(), timeout);
    const inicio = agora();

    try {
        const resposta = await fetch(url, { ...resto, signal: controlador.signal });
        const duracaoMs = Math.round(agora() - inicio);
        registrarMedicao({
            metodo,
            url: urlTexto,
            status: resposta.status,
            duracaoMs,
            ttfbMs: lerTtfb(urlTexto),
        });
        return resposta;
    } catch (erro) {
        const duracaoMs = Math.round(agora() - inicio);
        const abortou = erro && erro.name === 'AbortError';
        registrarMedicao({
            metodo,
            url: urlTexto,
            status: abortou ? 'timeout' : 'erro-rede',
            duracaoMs,
            ttfbMs: null,
            erro: erro && erro.message,
        });
        /* Re-lança para o call site tratar como sempre. Um abort por timeout vira
           uma mensagem clara de "servidor não respondeu a tempo". */
        if (abortou) {
            throw new Error(`Tempo esgotado (${timeout} ms) ao acessar o servidor.`);
        }
        throw erro;
    } finally {
        clearTimeout(idTimeout);
    }
}

/* Wrapper de fetch com instrumentação de tempo e timeout.

   Objetivo de diagnóstico: descobrir se a lentidão em produção vem do servidor
   (semac.cc) ou do código do front. Para cada chamada, mede a duração total,
   captura o TTFB real (tempo de espera pela resposta do servidor) via Resource
   Timing API e aborta requisições que passam do timeout — assim "servidor lento"
   vira um erro visível em vez de um spinner infinito.

   É um drop-in de fetch(): mesma assinatura, retorna a mesma Response.
     import { apiFetch } from '<caminho>/lib/apiFetch.js';
     const resposta = await apiFetch(url, opcoes);

   Opção extra suportada: opcoes.timeout (ms) sobrescreve o timeout padrão numa
   chamada específica (ex.: uploads grandes).

   Como ler as medições:
   - Console: cada chamada imprime "[apiFetch] MÉTODO url → status | total=Xms ttfb=Yms".
   - window.__semacTiming: array com todas as medições da sessão, para exportar
     (ex.: copy(JSON.stringify(window.__semacTiming)) no console).

   Interpretação: ttfb alto = servidor; ttfb baixo mas total alto/muitas chamadas
   em cascata = código/rede. Em dev (front e API em origens diferentes) o ttfb pode
   vir "n/d" por falta do header Timing-Allow-Origin; em produção (mesma origem
   semac.cc) ele aparece. */

/* Timeout padrão (ms) de cada requisição. Sobrescrevível por chamada. */
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

/* Lê o TTFB (responseStart - requestStart) da Resource Timing API para a URL
   dada, pegando a entrada mais recente que casa. Retorna null quando a API não
   expõe o timing (ex.: cross-origin sem Timing-Allow-Origin). */
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

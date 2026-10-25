/* Estado do telão do debate guardado no servidor, para o painel poder ser
   controlado de outro aparelho (celular) além do notebook ligado ao
   telão. O BroadcastChannel (canalTelaoDebate.js) continua sendo o
   caminho rápido entre guias do mesmo navegador; este é o que atravessa
   aparelhos, por consulta a cada INTERVALO_SINCRONIA_TELAO_DEBATE_MS.

   Relógio: o timer vai como hora de término (`fimEm`), e o relógio do
   celular pode estar segundos à frente ou atrás do notebook. Por isso
   tudo é medido no relógio do servidor: cada resposta traz
   `servidorAgora`, e agoraServidorDebate() devolve o Date.now() corrigido
   pela diferença. Antes da primeira resposta a correção é zero. */

import { cabecalhosAuth } from '../../auth/sessao.js';
import { apiFetch } from '../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const rotaTelaoDebateApi = (eventoId) => `${API_URL}/api/evento/${eventoId}/telao-debate`;

export const INTERVALO_SINCRONIA_TELAO_DEBATE_MS = 1000;

let diferencaRelogioServidorDebateMs = 0;

export function agoraServidorDebate() {
    return Date.now() + diferencaRelogioServidorDebateMs;
}

/* A resposta chegou em algum ponto entre o envio e o recebimento: o meio
   do caminho é a melhor estimativa de quando o servidor leu o relógio. */
async function lerRespostaTelaoDebate(resposta, enviadoEm) {
    if (!resposta.ok) throw new Error('Não foi possível sincronizar o telão.');
    const corpo = await resposta.json();
    const recebidoEm = Date.now();
    diferencaRelogioServidorDebateMs = corpo.servidorAgora - (enviadoEm + recebidoEm) / 2;
    return corpo;
}

/* { estado, alteradoEm, servidorAgora, telaoVistoEm }. `doTelao` só na
   guia projetada: é o sinal de que ela está aberta. */
export async function buscarEstadoTelaoDebate(eventoId, { doTelao = false } = {}) {
    const enviadoEm = Date.now();
    const resposta = await apiFetch(`${rotaTelaoDebateApi(eventoId)}${doTelao ? '?telao=true' : ''}`, {
        headers: cabecalhosAuth(),
        medir: false,
    });
    return lerRespostaTelaoDebate(resposta, enviadoEm);
}

/* Devolve o estado que ficou valendo no servidor: o enviado, ou um mais
   novo se outro aparelho mexeu depois. */
export async function publicarEstadoTelaoDebate(eventoId, estado, alteradoEm) {
    const enviadoEm = Date.now();
    const resposta = await apiFetch(rotaTelaoDebateApi(eventoId), {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ estado, alteradoEm }),
        medir: false,
    });
    return lerRespostaTelaoDebate(resposta, enviadoEm);
}

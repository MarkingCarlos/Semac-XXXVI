/* Comunicação com a API da dashboard (java_api). Base: /api/dashboard.
   Usada pelos cards da seção Início do /admin. Tudo é só leitura. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/dashboard`;

async function lerOuFalhar(caminho, mensagemErro) {
    const resposta = await apiFetch(`${ROTA}${caminho}`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error(mensagemErro);
    return resposta.json();
}

/* { capacidadeTotal, inscritosTotal, vagasRestantesTotal,
     minicursos: [{ id, nome, dataHoraInicio, local, capacidade, inscritos, vagasRestantes }] } */
export function buscarMinicursosDashboard() {
    return lerOuFalhar('/minicursos', 'Não foi possível carregar as vagas dos minicursos.');
}

/* [{ id, nome, email, presente }] — quem ocupa vaga no minicurso. */
export function buscarInscritosMinicursoDashboard(eventoId) {
    return lerOuFalhar(`/minicursos/${eventoId}/inscritos`, 'Não foi possível carregar os inscritos.');
}

/* [{ posicao, id, nome, email, xp, nivel }] — do maior xp para o menor. */
export function buscarRankingDashboard() {
    return lerOuFalhar('/ranking', 'Não foi possível carregar o ranking.');
}

/* { eventosAgora, eventos, porMembro, totalLeituras }. Cada evento:
   { id, nome, tipo, dataHoraInicio, dataHoraFim, esperados, leituras };
   cada membro: { operadorId, operadorNome, leituras } (id nulo =
   check-ins antigos, sem operador registrado). */
export function buscarCheckinsDashboard() {
    return lerOuFalhar('/checkins', 'Não foi possível carregar as leituras de QR code.');
}

/* { evento, porMembro, leituras: [{ participanteId, participanteNome,
     operadorId, operadorNome, lidoEm }] } */
export function buscarDetalheCheckinDashboard(eventoId) {
    return lerOuFalhar(`/checkins/eventos/${eventoId}`, 'Não foi possível carregar as leituras do evento.');
}

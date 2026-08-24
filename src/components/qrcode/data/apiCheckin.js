/* Comunicação com a API de check-in (java_api). Usada pela ferramenta
   de leitura de QR code em /checkin para marcar presença nas palestras. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* '2026-09-08T19:00:00' → { data: '2026-09-08', hora: '19:00' } */
function separarDataHora(iso) {
    if (!iso) return { data: '', hora: '' };
    const [data, resto = ''] = iso.split('T');
    return { data, hora: resto.slice(0, 5) };
}

/* Lista achatada de eventos (todos os tipos — palestras e minicursos),
   já com data/hora separadas para os dois seletores da tela de check-in. */
export async function listarEventosCheckin() {
    const resposta = await apiFetch(`${API_URL}/api/evento`);
    if (!resposta.ok) throw new Error('Falha ao carregar os eventos.');
    const eventos = await resposta.json();

    return eventos
        .map((evento) => {
            const { data, hora } = separarDataHora(evento.dataHoraInicio);
            return { id: evento.id, nome: evento.nome, data, hora };
        })
        .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}

async function lerErroOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

/* Registra a presença do dono do `uuid` lido no QR code do crachá na
   palestra `eventoId`. O backend distingue "não cadastrado" (404) de
   "já registrado" (409) pela mensagem, que já vem pronta para exibir. */
export async function registrarPresencaPorQrCode(eventoId, uuid) {
    const resposta = await apiFetch(`${API_URL}/api/evento/${eventoId}/presenca`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ uuid }),
    });
    return lerErroOuFalhar(resposta, 'Não foi possível registrar a presença.');
}

/* Confirmação manual (busca por nome/e-mail), para quando a leitura do
   QR falha ou o participante não tem o crachá em mãos. */
export async function registrarPresencaManual(eventoId, participanteId) {
    const resposta = await apiFetch(`${API_URL}/api/evento/${eventoId}/presenca/${participanteId}`, {
        method: 'POST',
        headers: cabecalhosAuth(),
    });
    return lerErroOuFalhar(resposta, 'Não foi possível registrar a presença.');
}

/* Busca manual por nome/e-mail — reaproveita a listagem de participantes
   já usada no /admin, filtrando no cliente. */
export async function buscarParticipantesPorTermo(termo) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/participantes`, {
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) throw new Error('Falha ao buscar participantes.');
    const participantes = await resposta.json();

    const alvo = termo.trim().toLowerCase();
    if (!alvo) return participantes;
    return participantes.filter(
        (p) => p.nome.toLowerCase().includes(alvo) || p.email.toLowerCase().includes(alvo)
    );
}

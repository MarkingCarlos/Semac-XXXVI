/* Comunicação com a API de check-in (java_api). Usada pela ferramenta
   de leitura de QR code em /checkin para marcar presença nas palestras. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth, temAcessoGestaoParticipantes } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* '2026-09-08T19:00:00' → { data: '2026-09-08', hora: '19:00' } */
function separarDataHora(iso) {
    if (!iso) return { data: '', hora: '' };
    const [data, resto = ''] = iso.split('T');
    return { data, hora: resto.slice(0, 5) };
}

/* Lista achatada de eventos (todos os tipos — palestras e minicursos),
   já com data/hora separadas para os dois seletores da tela de check-in.
   `horaFim`, `tipo` e `local` alimentam o cartão de cada evento. */
export async function listarEventosCheckin() {
    // Com o token, como as demais telas da comissão (ver EventoController).
    const resposta = await apiFetch(`${API_URL}/api/evento`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Falha ao carregar os eventos.');
    const eventos = await resposta.json();

    return eventos
        .map((evento) => {
            const { data, hora } = separarDataHora(evento.dataHoraInicio);
            return {
                id: evento.id,
                nome: evento.nome,
                data,
                hora,
                horaFim: separarDataHora(evento.dataHoraFim).hora,
                tipo: evento.tipoEvento?.nome ?? '',
                local: evento.local ?? '',
            };
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

/* ── Conquistas manuais ──────────────────────────────────────────
   O /checkin tem dois modos: marcar presença (acima) e conceder
   conquista (aqui). A câmera é a mesma; só muda
   o que acontece quando o participante é identificado.

   Conceder é restrito a diretores e presidência no backend — MEMBRO
   recebe 403. A interface esconde o modo com temAcessoDiretoria(). */

/* Só as conquistas MANUAIS e já ativas: as automáticas o sistema concede
   sozinho, e as inativas ainda não valem. Com o prazo (`concessaoAte`)
   vencido a conquista também some — menos para diretoria de site e
   presidência, que concedem a qualquer momento. A checagem de verdade é
   no backend (ConquistaService.exigirPrazoDeConcessao). */
export async function listarConquistasManuaisCheckin() {
    const resposta = await apiFetch(`${API_URL}/api/conquista`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Falha ao carregar as conquistas.');
    const conquistas = await resposta.json();
    const concedeForaDoPrazo = temAcessoGestaoParticipantes();
    return conquistas.filter((c) => c.tipoValidacao === 'MANUAL'
        && c.ativa
        && (concedeForaDoPrazo || !prazoConcessaoVencido(c.concessaoAte)));
}

/* '2026-10-26' vale até o fim desse dia, no fuso de quem está olhando.
   Comparar as strings 'AAAA-MM-DD' evita o UTC de new Date('2026-10-26'). */
function prazoConcessaoVencido(concessaoAte) {
    if (!concessaoAte) return false;
    const hoje = new Date();
    const hojeTexto = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    return hojeTexto > concessaoAte;
}

export async function concederConquistaPorQrCode(conquistaId, uuid) {
    const resposta = await apiFetch(`${API_URL}/api/conquista/${conquistaId}/conceder`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ uuid }),
    });
    return lerErroOuFalhar(resposta, 'Não foi possível conceder a conquista.');
}

/* Modo "Testar leitura": só confere a quem pertence o QR lido. Não grava
   nada no backend (sem presença, xp, conquista ou log de tentativa).
   Devolve { nome, situacao }; QR desconhecido volta como erro (404). */
export async function testarLeituraQrCode(uuid) {
    const resposta = await apiFetch(`${API_URL}/api/checkin/teste/${encodeURIComponent(uuid)}`, {
        headers: cabecalhosAuth(),
    });
    return lerErroOuFalhar(resposta, 'Não foi possível ler este QR code.');
}

/* Brinde da comissão (26/10): dá baixa no QR lido, que é o do /admin da
   pessoa (não o do crachá). Leitura única — o backend recusa QR já usado,
   QR de crachá e leitura fora do dia, com a mensagem pronta para exibir. */
export async function retirarBrindeComissaoPorQrCode(qrCode) {
    const resposta = await apiFetch(`${API_URL}/api/brinde-comissao/retirada`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ qrCode }),
    });
    return lerErroOuFalhar(resposta, 'Não foi possível entregar o brinde.');
}

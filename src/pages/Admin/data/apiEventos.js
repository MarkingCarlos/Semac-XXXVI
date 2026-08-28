/* Camada de acesso à API de eventos (tabela `evento` + `palestrante`).
   Gerenciada no /admin (seção "Conteúdo").

   A interface trabalha com data e horários separados (`data`, `horaInicio`,
   `horaFim`); o backend usa `dataHoraInicio`/`dataHoraFim` (DATETIME). A
   combinação/separação acontece aqui, nas bordas. O tipo é uma FK
   (`tipoEventoId`); guardamos também o rótulo (`tipo`) para exibição. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/evento`;

/* '2026-09-08T19:00:00' → { data: '2026-09-08', hora: '19:00' } */
function separarDataHora(iso) {
    if (!iso) return { data: '', hora: '' };
    const [data, resto = ''] = iso.split('T');
    return { data, hora: resto.slice(0, 5) };
}

/* Backend → interface */
function deResposta(evento) {
    const inicio = separarDataHora(evento.dataHoraInicio);
    const fim = separarDataHora(evento.dataHoraFim);
    return {
        id: evento.id,
        nome: evento.nome,
        tipoEventoId: evento.tipoEvento ? evento.tipoEvento.id : null,
        tipo: evento.tipoEvento ? evento.tipoEvento.nome : '',
        local: evento.local || '',
        descricao: evento.descricao || '',
        data: inicio.data,
        horaInicio: inicio.hora,
        horaFim: fim.hora,
        capacidadeMaxima: evento.capacidadeMaxima,
        palestrantes: (evento.palestrantes || []).map((p) => ({
            id: p.id,
            nome: p.nome,
            descricao: p.descricao || '',
        })),
    };
}

/* Interface → backend */
function paraRequisicao(evento) {
    return {
        nome: evento.nome,
        tipoEventoId: Number(evento.tipoEventoId),
        local: evento.local || null,
        descricao: evento.descricao || null,
        dataHoraInicio: `${evento.data}T${evento.horaInicio}:00`,
        dataHoraFim: `${evento.data}T${evento.horaFim}:00`,
        capacidadeMaxima: Number(evento.capacidadeMaxima),
        palestrantes: (evento.palestrantes || []).map((p) => ({
            id: p.id ?? null,
            nome: p.nome,
            descricao: p.descricao || null,
        })),
    };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarEventos() {
    const resposta = await apiFetch(ROTA);
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar eventos.');
    return lista.map(deResposta);
}

export async function criarEvento(evento) {
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(evento)),
    });
    const criado = await lerOuFalhar(resposta, 'Falha ao criar evento.');
    return deResposta(criado);
}

export async function atualizarEvento(id, evento) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(evento)),
    });
    const atualizado = await lerOuFalhar(resposta, 'Falha ao atualizar evento.');
    return deResposta(atualizado);
}

export async function excluirEvento(id) {
    const resposta = await apiFetch(`${ROTA}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir evento.');
    }
}

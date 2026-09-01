/* Comunicação com a API de participantes (java_api).
   Base: /api/pessoa. Usada pela aba Participantes do /admin. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Lista participantes confirmados (role = PARTICIPANTE) e os recém-inscritos
   aguardando confirmação (role = NULL). Cada item já vem com a lista
   eventoParticipantes:[{ status }] usada pelas estatísticas e pela tabela. */
export async function listarParticipantes() {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/participantes`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Falha ao carregar participantes.');
    return resposta.json();
}

/* Lista a comissão organizadora: pessoas com papel definido diferente de
   PARTICIPANTE (MEMBRO, DIRETOR_* e PRESIDENTE). Mesmo formato de
   ParticipanteResponseDTO (tipoInscricao virá null). */
export async function listarComissao() {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/comissao`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Falha ao carregar a comissão.');
    return resposta.json();
}

/* Confirma a inscrição atribuindo o papel: 'PARTICIPANTE' ou 'MEMBRO'.
   Para PARTICIPANTE, tipoInscricaoId é obrigatório (o ingresso escolhido).
   Retorna o participante atualizado. Em caso de erro, lança com a
   mensagem vinda do backend ({ mensagem }) para exibição. */
export async function atribuirRole(id, role, tipoInscricaoId = null) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/role`, {
        method: 'PATCH',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ role, tipoInscricaoId }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível confirmar o participante.');
    }
    return resposta.json();
}

/* Ativa/desativa uma pessoa (ex.: suspender membro da comissão).
   Retorna a pessoa atualizada. */
export async function definirAtivo(id, ativo) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/ativo`, {
        method: 'PATCH',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ativo }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível alterar o status do membro.');
    }
    return resposta.json();
}

/* Substitui a lista inteira de camisetas da pessoa (replace-all) — editor
   restrito a DIRETOR_SITE/PRESIDENTE (mesmo acesso do financeiro). Cada
   item é { modelo, tamanho, avulsa }. Retorna a pessoa atualizada. */
export async function atualizarCamisetas(id, camisetas) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/camisetas`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ camisetas }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível salvar as camisetas.');
    }
    return resposta.json();
}

/* Exclui definitivamente um participante ou membro da comissão. Ação
   irreversível: o backend recusa (409) quem organizou sorteios ou fez
   ajustes no caixa do Fundunesp, para não perder esse histórico. */
export async function excluirParticipante(id) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível excluir esta pessoa.');
    }
}

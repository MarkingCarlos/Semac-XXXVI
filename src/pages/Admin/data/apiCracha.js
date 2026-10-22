/* Comunicação com a API de crachás (java_api). Base: /api/cracha.
   Usada pela subaba Crachás da aba Pessoas do /admin. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Todo mundo que recebe crachá impresso: participantes (confirmados e
   pendentes), comissão e palestrantes, em ordem alfabética. Cada item:
   { id, nome, uuid, perfil } — perfil PARTICIPANTE | COMISSAO |
   PALESTRANTE; palestrante vem com uuid null (sai sem QR). */
export async function listarCrachas() {
    const resposta = await apiFetch(`${API_URL}/api/cracha`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Não foi possível carregar a lista de crachás.');
    return resposta.json();
}

/* Professores convidados (tabela `professor_convidado`), cadastrados na
   própria subaba Crachás. Cada item: { id, nome, genero } — genero 'M'
   (crachá PROFESSOR) ou 'F' (crachá PROFESSORA). Não têm QR. */
const ROTA_PROFESSORES = `${API_URL}/api/professor-convidado`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarProfessoresConvidados() {
    const resposta = await apiFetch(ROTA_PROFESSORES, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Não foi possível carregar os professores convidados.');
}

export async function criarProfessorConvidado(professor) {
    const resposta = await apiFetch(ROTA_PROFESSORES, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nome: professor.nome, genero: professor.genero }),
    });
    return lerOuFalhar(resposta, 'Falha ao adicionar o professor.');
}

export async function atualizarProfessorConvidado(id, professor) {
    const resposta = await apiFetch(`${ROTA_PROFESSORES}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nome: professor.nome, genero: professor.genero }),
    });
    return lerOuFalhar(resposta, 'Falha ao atualizar o professor.');
}

export async function excluirProfessorConvidado(id) {
    const resposta = await apiFetch(`${ROTA_PROFESSORES}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir o professor.');
    }
}

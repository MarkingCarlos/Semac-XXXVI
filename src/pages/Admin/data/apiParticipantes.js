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

/* Cadastra uma pessoa manualmente (inscrição de balcão: dinheiro,
   cortesia, quem se inscreveu presencialmente). `dados` traz nome, cpf,
   email, senha, ra, telefone (só dígitos em cpf/telefone), ehUnesp,
   tipoInscricaoId, dias, camisetas (sempre [] — já encomendadas) e
   `confirmar` — true já cria como PARTICIPANTE confirmado, false deixa
   aguardando confirmação. Retorna a pessoa criada no mesmo formato da
   listagem, pronta para entrar na tabela. */
export async function cadastrarParticipante(dados) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa`, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(dados),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível cadastrar esta pessoa.');
    }
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

/* Desfaz a confirmação: volta a pessoa para "aguardando confirmação"
   (role = NULL). O backend recusa (409) quando já há presença registrada
   em algum evento, para não perder esse histórico. Retorna a pessoa
   atualizada. */
export async function desconfirmarParticipante(id) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/desconfirmar`, {
        method: 'PATCH',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível desconfirmar esta pessoa.');
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

/* Busca o arquivo do comprovante de pagamento anexado no cadastro (imagem
   ou PDF). Devolve um Blob — a rota exige o Bearer token, então não dá pra
   usar a URL direto num <img src>; o chamador monta um object URL local
   (URL.createObjectURL) pra exibir e revoga (URL.revokeObjectURL) depois. */
export async function buscarComprovante(id) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/comprovante`, {
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        throw new Error(resposta.status === 404
            ? 'Nenhum comprovante encontrado para esta pessoa.'
            : 'Não foi possível carregar o comprovante.');
    }
    return resposta.blob();
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

/* ── Gestão pela diretoria (Diretor de Site e Presidência) ───────── */

/* Corrige nome, e-mail, RA e telefone de um participante ou membro da
   comissão. `dados` = { nome, email, ra, telefone } (telefone só dígitos).
   O backend recusa (409) e-mail que já é de outra pessoa. Retorna a
   pessoa atualizada no formato da listagem. */
export async function atualizarDadosPessoa(id, dados) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/dados`, {
        method: 'PATCH',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(dados),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível salvar os dados.');
    }
    return resposta.json();
}

/* Minicursos em que o participante está: [{ evento, status }], com o
   evento no formato do backend (EventoResponseDTO). */
export async function listarMinicursosDoParticipante(id) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/minicursos`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Falha ao carregar os minicursos do participante.');
    return resposta.json();
}

/* Todos os minicursos (eventos cujo tipo exige inscrição), com
   vagasRestantes — opções do "adicionar a um minicurso". */
export async function listarTodosMinicursos() {
    const resposta = await apiFetch(`${API_URL}/api/evento`);
    if (!resposta.ok) throw new Error('Falha ao carregar os minicursos.');
    const eventos = await resposta.json();
    return eventos.filter(evento => evento.tipoEvento?.exigeInscricao);
}

/* Coloca o participante no minicurso. Regras do minicurso (vagas, choque
   de horário, dia do ingresso diário) voltam como erro com a mensagem do
   backend. */
export async function adicionarParticipanteMinicurso(id, eventoId) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/minicursos/${eventoId}`, {
        method: 'POST',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível adicionar ao minicurso.');
    }
}

/* Tira o participante do minicurso, liberando a vaga. Recusado (409) se
   a presença já foi registrada. */
export async function removerParticipanteMinicurso(id, eventoId) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${id}/minicursos/${eventoId}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Não foi possível remover do minicurso.');
    }
}

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

/* Camada de acesso à API do catálogo de conquistas (tabela `conquista`).

   Conquista não se cria nem se exclui por aqui: cada uma nasce de uma
   entrada em CatalogoConquistas no backend e é materializada no boot.
   O que existe é edição (nome, pontos, descrição, raridade, ordem),
   upload da imagem e o interruptor `ativa`.

   Tudo é restrito a DIRETOR_SITE/PRESIDENTE no backend, exceto a leitura
   do catálogo (qualquer comissão) e a imagem (pública). Gerenciado no
   /admin, seção "Informações SEMAC". */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/conquista`;

function paraRequisicao(conquista) {
    return {
        nome: conquista.nome,
        descricao: conquista.descricao || null,
        pontosBase: Number(conquista.pontosBase),
        raridade: Number(conquista.raridade),
        ordem: Number(conquista.ordem),
    };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarConquistas() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar conquistas.');
}

export async function atualizarConquista(id, conquista) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(conquista)),
    });
    return lerOuFalhar(resposta, 'Falha ao salvar a conquista.');
}

/* Liga/desliga. O backend devolve 409 com o motivo quando barrado — sem
   imagem para ativar, ou com participantes vinculados para desativar —, e
   a mensagem já vem pronta para exibir. */
export async function alterarAtivaConquista(id, ativa) {
    const resposta = await apiFetch(`${ROTA}/${id}/ativa`, {
        method: 'PATCH',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ativo: ativa }),
    });
    return lerOuFalhar(resposta, 'Falha ao alterar o estado da conquista.');
}

export async function enviarImagemConquista(id, arquivo) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    const resposta = await apiFetch(`${ROTA}/${id}/imagem`, {
        method: 'POST',
        headers: cabecalhosAuth(),
        body: formData,
        timeout: 60000, // upload de arquivo: janela maior que o padrão
    });
    return lerOuFalhar(resposta, 'Falha ao enviar a imagem.');
}

/* URL pública da imagem. `imagemVersao` (o nome do arquivo em disco) entra
   como cache-buster: a rota em si é fixa e responde com max-age de um dia,
   então sem isso uma troca de imagem só apareceria no dia seguinte.
   Devolve null quando a conquista ainda não tem imagem. */
export function urlImagemConquista(id, imagemVersao) {
    if (!imagemVersao) return null;
    return `${ROTA}/${id}/imagem?v=${encodeURIComponent(imagemVersao)}`;
}

/* Reavalia as regras automáticas para todo participante. É a saída
   durante a semana: ativada uma conquista, este botão a faz alcançar quem
   já cumpriu a regra, sem esperar o próximo boot da API. */
export async function reavaliarConquistas() {
    const resposta = await apiFetch(`${ROTA}/reavaliar`, {
        method: 'POST',
        headers: cabecalhosAuth(),
        timeout: 60000, // percorre todos os participantes
    });
    return lerOuFalhar(resposta, 'Falha ao reavaliar as conquistas.');
}

/* ── Conquistas de um participante (painel de revogação) ─────────
   Restrito a diretores e presidência no backend. Revogar remove o
   vínculo, estorna o xp que ele creditou e recalcula o nível — é a
   saída para um QR lido por engano, e o único jeito de destravar a
   desativação de uma conquista que já tem gente. */

export async function listarConquistasDoParticipante(participanteId) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${participanteId}/conquistas`, {
        headers: cabecalhosAuth(),
    });
    return lerOuFalhar(resposta, 'Falha ao carregar as conquistas do participante.');
}

export async function revogarConquistaDoParticipante(participanteId, conquistaId) {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/${participanteId}/conquistas/${conquistaId}`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao revogar a conquista.');
    }
}

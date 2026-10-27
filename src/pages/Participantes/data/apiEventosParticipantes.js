/* Camada de acesso aos eventos na área do participante (tabelas `evento`
   e `evento_participante`).

   Dois fluxos, espelhando o backend (InscricaoEventoService):

   - Eventos abertos (palestra, mesa redonda, debate): o participante já
     entra neles quando a inscrição é confirmada no /admin. Aparecem na
     agenda, mas não têm botão nenhum.
   - Minicursos (`tipoEvento.exigeInscricao`): vagas limitadas, o
     participante escolhe aqui. `vagasRestantes` vem calculado pela API e
     só é preenchido nesses eventos.

   `GET /api/evento` é público; `meus`, `inscrição` e `cancelamento`
   exigem Bearer token de quem tem role PARTICIPANTE. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/evento`;

/* Para onde o login devolve o usuário quando a sessão expira no meio. */
const ROTA_RETORNO = '/participantes';

/* Tipos fora da pesquisa de satisfação. Espelha TIPOS_AVALIAVEIS do
   backend (AvaliacaoEventoService) — aqui só some o botão, lá a regra é
   garantida. */
const TIPOS_FORA_AVALIACAO = ['ABERTURA', 'CREDENCIAMENTO', 'COFFEE_BREAK', 'ENCERRAMENTO'];

/* Backend → interface. Mantém os campos com os mesmos nomes da API e
   acrescenta só o que a interface usa em toda parte. */
function deResposta(evento) {
    const palestrantes = (evento.palestrantes || []).map((palestrante) => palestrante.nome);
    const descricao = evento.descricao || '';
    const codigoTipo = evento.tipoEvento?.codigo;
    const avaliavel = Boolean(codigoTipo) && !TIPOS_FORA_AVALIACAO.includes(codigoTipo);
    return {
        id: evento.id,
        nome: evento.nome,
        tipo: evento.tipoEvento?.nome ?? '',
        pontos: evento.tipoEvento?.pontos ?? 0,
        exigeInscricao: Boolean(evento.tipoEvento?.exigeInscricao),
        /* Pela chave estável do tipo (CodigoTipoEvento), nunca pelo nome
           editável: debates recebem perguntas prévias dos participantes. */
        ehDebate: evento.tipoEvento?.codigo === 'DEBATE',
        local: evento.local || '',
        descricao,
        dataHoraInicio: evento.dataHoraInicio,
        dataHoraFim: evento.dataHoraFim,
        capacidadeMaxima: evento.capacidadeMaxima,
        vagasRestantes: evento.vagasRestantes ?? null,
        palestrantes,
        /* Entra na pesquisa de satisfação (nota de 0 a 10). Se pode ou não
           avaliar agora — presença e horário — é decidido na tela. */
        avaliavel,
        /* Sem palestrante e sem descrição (abertura, coffee-break…) o card
           de detalhe não teria nada a mostrar, então não abre — a não ser
           que o evento seja avaliável: é no detalhe que fica o botão. */
        temDetalhe: palestrantes.length > 0 || descricao.trim() !== '' || avaliavel,
    };
}

/* 401 no meio da navegação vira redirecionamento para o login (e não um
   erro na tela); o resto vira Error com a mensagem que a API mandou. */
async function falharSeErro(resposta, mensagemPadrao) {
    if (resposta.ok) return;
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return;
    const corpo = await resposta.json().catch(() => null);
    throw new Error(corpo?.mensagem || mensagemPadrao);
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    await falharSeErro(resposta, mensagemPadrao);
    return resposta.ok ? resposta.json() : null;
}

/* Programação completa da semana. A rota é pública, mas vai com o token:
   sem ele a API não manda lotação e vagas, que a escolha de minicursos usa. */
export async function listarEventosParticipantes() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar a programação.');
    return (lista || []).map(deResposta);
}

/* Eventos em que o participante logado está, com o status dele em cada
   um (INSCRITO | PRESENTE | AUSENTE). */
export async function listarMeusEventosParticipantes() {
    const resposta = await apiFetch(`${ROTA}/meus`, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar a sua agenda.');
    return (lista || []).map((item) => ({
        ...deResposta(item.evento),
        status: item.status,
    }));
}

/* Entra em um minicurso. Erros de regra (esgotado, choque de horário, já
   inscrito) chegam como 409 e viram Error com a mensagem da API. */
export async function inscreverEmMinicurso(eventoId) {
    const resposta = await apiFetch(`${ROTA}/${eventoId}/inscricao`, {
        method: 'POST',
        headers: cabecalhosAuth(),
    });
    await falharSeErro(resposta, 'Não foi possível entrar nesse minicurso.');
}

/* Desiste do minicurso e libera a vaga. */
export async function cancelarMinicurso(eventoId) {
    const resposta = await apiFetch(`${ROTA}/${eventoId}/inscricao`, {
        method: 'DELETE',
        headers: cabecalhosAuth(),
    });
    await falharSeErro(resposta, 'Não foi possível sair desse minicurso.');
}

/* Envia uma pergunta prévia para um debate pela rota pública
   (/api/perguntas), com o token: a pergunta fica ligada ao participante.
   Perguntas encerradas e o limite por participante chegam como 409 com a
   mensagem da API. Devolve `{ conquistaConcedida }`: true quando esta
   pergunta destravou a conquista de mandar pergunta. */
export async function enviarPerguntaDebate(eventoId, texto) {
    const resposta = await apiFetch(`${API_URL}/api/perguntas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ eventoId, texto }),
    });
    return lerOuFalhar(resposta, 'Não foi possível enviar sua pergunta.');
}

/* Notas que o participante já deu, como { [eventoId]: nota }. */
export async function listarMinhasAvaliacoesEventos() {
    const resposta = await apiFetch(`${ROTA}/avaliacoes/minhas`, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar suas avaliações.');
    return Object.fromEntries((lista || []).map((avaliacao) => [avaliacao.eventoId, avaliacao.nota]));
}

/* Dá (ou troca) a nota de 0 a 10 de um evento. Fora das regras (evento
   não terminou, sem presença confirmada) chega 409 com a mensagem da API.
   Devolve `{ eventoId, nota, conquistaConcedida }`: true quando esta nota
   destravou a conquista de avaliar tudo o que assistiu. */
export async function avaliarEvento(eventoId, nota) {
    const resposta = await apiFetch(`${ROTA}/${eventoId}/avaliacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ nota }),
    });
    return lerOuFalhar(resposta, 'Não foi possível enviar sua avaliação.');
}

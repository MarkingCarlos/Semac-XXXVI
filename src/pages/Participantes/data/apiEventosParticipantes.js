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

/* Backend → interface. Mantém os campos com os mesmos nomes da API e
   acrescenta só o que a interface usa em toda parte. */
function deResposta(evento) {
    return {
        id: evento.id,
        nome: evento.nome,
        tipo: evento.tipoEvento?.nome ?? '',
        pontos: evento.tipoEvento?.pontos ?? 0,
        exigeInscricao: Boolean(evento.tipoEvento?.exigeInscricao),
        local: evento.local || '',
        descricao: evento.descricao || '',
        dataHoraInicio: evento.dataHoraInicio,
        dataHoraFim: evento.dataHoraFim,
        capacidadeMaxima: evento.capacidadeMaxima,
        vagasRestantes: evento.vagasRestantes ?? null,
        palestrantes: (evento.palestrantes || []).map((palestrante) => palestrante.nome),
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

/* Programação completa da semana — pública, não depende de sessão. */
export async function listarEventosParticipantes() {
    const resposta = await apiFetch(ROTA);
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

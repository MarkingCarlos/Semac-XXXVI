/* Acesso ao desafio diário "Cifra do Dia" (tabelas `desafio_cifra`,
   `desafio_cifra_etapa`, `desafio_cifra_jogo`).

   A resposta não trafega: a tentativa vai para a API e volta só se
   acertou, junto do estado como ficou. Nem ao perder as 5 tentativas a
   resposta é revelada.

   Todas as rotas exigem participante logado — o acerto credita xp e as
   tentativas são contadas por pessoa no servidor. */

import { cabecalhosAuth, tratarErroAuth } from '../../auth/sessao.js';
import { apiFetch } from '../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/desafio-cifra`;

const ROTA_RETORNO = '/desafio-cifra';

async function mensagemDeErro(resposta, padrao) {
    const corpo = await resposta.json().catch(() => null);
    return corpo?.mensagem || corpo?.message || padrao;
}

/* Estado do desafio de hoje, já retomando a partida. `disponivel` false =
   hoje não tem desafio. */
export async function lerEstadoDesafioCifra() {
    const resposta = await apiFetch(`${ROTA}/hoje`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível carregar o desafio de hoje.'));
    }
    return resposta.json();
}

/* Os dias que já aconteceram, com o que o participante fez em cada um —
   os cards da aba "Desafios". Sem senha e sem resposta. */
export async function listarDiasDesafioCifra() {
    const resposta = await apiFetch(`${ROTA}/meus`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível carregar a Cifra do Dia.'));
    }
    return resposta.json();
}

/* Devolve { acertou, estado }. */
export async function enviarTentativaDesafioCifra(respostaDigitada) {
    const resposta = await apiFetch(`${ROTA}/tentativa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ resposta: respostaDigitada }),
    });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível enviar a resposta.'));
    }
    return resposta.json();
}

/* Modo teste (/desafio-cifra/teste?desafio={id}), aberto pelo botão
   "Testar" do /admin -> Cifra do Dia. Só quem gerencia a gamificação.
   Nada é gravado: sem jogo, sem tentativa no banco e sem xp — as 5
   tentativas e a troca de etapa são contadas na tela. */

const ROTA_RETORNO_TESTE = '/admin';

/* O desafio com todas as etapas (casas, dicas), sem as respostas. */
export async function lerTesteDesafioCifra(desafioId) {
    const resposta = await apiFetch(`${ROTA}/teste/${desafioId}`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO_TESTE)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível abrir o teste.'));
    }
    return resposta.json();
}

/* Devolve { acertou }. */
export async function enviarTentativaTesteDesafioCifra(desafioId, ordem, respostaDigitada) {
    const resposta = await apiFetch(`${ROTA}/teste/tentativa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ desafioId, ordem, resposta: respostaDigitada }),
    });
    if (tratarErroAuth(resposta, ROTA_RETORNO_TESTE)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível enviar a resposta.'));
    }
    return resposta.json();
}

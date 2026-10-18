/* Acesso ao jogo do Termo (tabelas `termo_palavra`, `termo_jogo`,
   `termo_tentativa`).

   A palavra secreta não trafega: o palpite vai para a API e volta só o
   padrão de cores (`resultado`, uma letra por posição — C certo,
   P presente, A ausente). O campo `palavra` só vem preenchido quando o
   jogo acabou, para a tela de fim revelar a resposta.

   Todas as rotas exigem participante logado — a vitória credita xp e as
   tentativas são contadas por pessoa no servidor. */

import { cabecalhosAuth, tratarErroAuth } from '../../auth/sessao.js';
import { apiFetch } from '../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/termo`;

const ROTA_RETORNO = '/termo';

/* Palpite recusado pelo dicionário do servidor (422). Vira um recado na
   tela em vez de um erro — é jogo, não falha. */
export class PalpiteInvalidoErro extends Error {}

async function mensagemDeErro(resposta, padrao) {
    const corpo = await resposta.json().catch(() => null);
    return corpo?.mensagem || corpo?.message || padrao;
}

/* Estado do jogo de hoje, já com as tentativas anteriores: reabrir a
   página retoma a partida onde parou. `tamanho` é quantas letras tem a
   palavra sorteada para a pessoa (5 a 10). `disponivel` false = hoje não é
   dia de Termo. */
export async function lerEstadoTermo() {
    const resposta = await apiFetch(`${ROTA}/hoje`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível carregar o jogo de hoje.'));
    }
    return resposta.json();
}

/* Os dias de Termo que já aconteceram, com o que o participante fez em
   cada um — é o que a aba "Desafios" de /participantes lista, um card por
   dia. Dias ainda por vir não vêm, e a palavra secreta não vem em nenhum
   deles: este resumo atravessa vários dias, e revelar a de ontem entregaria
   a resposta de quem ainda não jogou.

   Lista vazia = nenhum dia de Termo aconteceu ainda. */
export async function listarDiasTermo() {
    const resposta = await apiFetch(`${ROTA}/meus`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível carregar os dias do Termo.'));
    }
    return resposta.json();
}

export async function enviarPalpiteTermo(palpite) {
    const resposta = await apiFetch(`${ROTA}/palpite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ palpite }),
    });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (resposta.status === 422) {
        throw new PalpiteInvalidoErro(await mensagemDeErro(resposta, 'Palavra não encontrada'));
    }
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível enviar o palpite.'));
    }
    return resposta.json();
}

/* Modo teste (/termo/teste?palavra={id}), aberto pelo botão "Testar" do
   /admin -> Termo. Só DIRETOR_SITE/PRESIDENTE. Nada é gravado: sem jogo,
   sem tentativa no banco e sem xp — as 6 tentativas são contadas na tela.
   A palavra não volta em resposta nenhuma, nem ao perder. */

const ROTA_RETORNO_TESTE = '/admin';

/* Só o tamanho da palavra, para a grade se montar. */
export async function lerTesteTermo(palavraId) {
    const resposta = await apiFetch(`${ROTA}/teste/${palavraId}`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO_TESTE)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível abrir o teste.'));
    }
    return resposta.json();
}

export async function enviarPalpiteTesteTermo(palavraId, palpite) {
    const resposta = await apiFetch(`${ROTA}/teste/palpite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ palavraId, palpite }),
    });
    if (tratarErroAuth(resposta, ROTA_RETORNO_TESTE)) return null;
    if (resposta.status === 422) {
        throw new PalpiteInvalidoErro(await mensagemDeErro(resposta, 'Palavra não encontrada'));
    }
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível enviar o palpite.'));
    }
    return resposta.json();
}

/* Se a palavra está no dicionário de palpites. Só o modo treino usa: a
   partida valendo já é validada pelo próprio POST /palpite. O dicionário
   (5 a 10 letras) é grande demais para ir no bundle, por isso a consulta.

   Falha de rede conta como válida — no treino nada está em jogo, e travar
   a rodada por isso seria pior do que aceitar uma palavra inventada. */
export async function palavraValidaTermo(palavra) {
    try {
        const resposta = await apiFetch(`${ROTA}/validar?palavra=${encodeURIComponent(palavra)}`, {
            headers: cabecalhosAuth(),
        });
        if (!resposta.ok) return true;
        return (await resposta.json()).valida;
    } catch {
        return true;
    }
}

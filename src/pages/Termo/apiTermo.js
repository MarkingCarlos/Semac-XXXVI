/* Acesso ao jogo do Termo (tabelas `termo_palavra`, `termo_jogo`,
   `termo_tentativa`).

   A palavra do dia não trafega: o palpite vai para a API e volta só o
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
   página retoma a partida onde parou. `disponivel` false = hoje não é dia
   de Termo. */
export async function lerEstadoTermo() {
    const resposta = await apiFetch(`${ROTA}/hoje`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Não foi possível carregar o jogo de hoje.'));
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

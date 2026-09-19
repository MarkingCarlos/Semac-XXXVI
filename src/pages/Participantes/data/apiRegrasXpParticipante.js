/* Regras de XP reais (GET /api/regra-xp) para o card "COMO GANHAR XP" da
   aba Ranking. A lista vem do backend já juntando duas fontes: os tipos
   de evento (quanto vale cada presença, `origem: 'TIPO_EVENTO'`) e as
   regras fixas — acerto do Termo e os dois cortes de atraso do check-in
   (`origem: 'REGRA'`). Tudo editável em /admin -> Informações SEMAC.

   `unidade` separa o que é ponto do que é minuto: PONTOS vira linha
   "+N" na lista, MINUTOS vira a nota de atraso no rodapé do card. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Para onde o login devolve o usuário quando a sessão expira no meio. */
const ROTA_RETORNO = '/participantes';

/* A presença é a única regra cujo nome guardado é o do tipo de evento
   ("Palestra"), porque é o mesmo nome usado na programação — a frase da
   tela se monta aqui. */
function rotuloDaRegra(regra) {
    return regra.origem === 'TIPO_EVENTO'
        ? `Presença em ${regra.nome.toLowerCase()}`
        : regra.nome;
}

function deResposta(regras) {
    return regras.map((regra) => ({
        chave: regra.chave,
        rotulo: rotuloDaRegra(regra),
        valor: regra.valor,
        unidade: regra.unidade,
    }));
}

export async function buscarRegrasXpParticipante() {
    const resposta = await apiFetch(`${API_URL}/api/regra-xp`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) throw new Error('Falha ao carregar as regras de XP.');
    return deResposta(await resposta.json());
}

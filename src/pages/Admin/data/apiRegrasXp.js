/* Camada de acesso às regras de XP (GET/PUT /api/regra-xp).

   A lista vem do backend juntando duas fontes (ver RegraXpService):
   `tipo_evento` — quanto vale a presença em cada tipo, chave
   "TIPO_EVENTO:<id>" — e `regra_xp`, com o acerto do Termo e os dois
   cortes de atraso do check-in. Nada é criado nem excluído por aqui: o
   conjunto é fixo, só nome e valor mudam.

   Editar uma linha de tipo de evento renomeia/repontua o próprio tipo,
   então o nome novo aparece também na programação pública e no
   formulário de evento da aba Conteúdo.

   Escrita restrita a DIRETOR_SITE/PRESIDENTE no backend. */

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/regra-xp`;

function paraRequisicao(regra) {
    return { nome: regra.nome, valor: Number(regra.valor) };
}

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarRegrasXp() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar as regras de XP.');
}

/* A chave carrega ":" (TIPO_EVENTO:3), daí o encodeURIComponent. */
export async function atualizarRegraXp(chave, regra) {
    const resposta = await apiFetch(`${ROTA}/${encodeURIComponent(chave)}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(regra)),
    });
    return lerOuFalhar(resposta, 'Falha ao salvar a regra de XP.');
}

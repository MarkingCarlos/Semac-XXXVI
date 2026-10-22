/* Envio público de perguntas para os debates (POST /api/perguntas) e os
   debates abertos para receber perguntas (GET /api/perguntas/debates).

   As duas rotas aceitam quem não tem login. Com sessão válida, o envio vai
   com o token: a pergunta fica ligada à conta e o participante pode ganhar
   a conquista. Token vencido não vai — o Spring recusaria a requisição
   inteira com 401, e aqui quem não tem login também pode perguntar. */

import { cabecalhosAuth, temSessaoValida } from '../../auth/sessao.js';
import { apiFetch } from '../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/perguntas`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || corpo?.message || mensagemPadrao);
    }
    return resposta.json();
}

/* [{ id, nome, dataHoraInicio }] — vazio quando nada está aberto. */
export async function listarDebatesAbertosPerguntas() {
    const resposta = await apiFetch(`${ROTA}/debates`);
    return lerOuFalhar(resposta, 'Não foi possível carregar os debates.');
}

/* `nome` só vale sem login (com login, o nome é o da conta). Devolve
   `{ conquistaConcedida }`. */
export async function enviarPerguntaPublica({ eventoId, texto, nome }) {
    const cabecalhos = { 'Content-Type': 'application/json' };
    const resposta = await apiFetch(ROTA, {
        method: 'POST',
        headers: temSessaoValida() ? cabecalhosAuth(cabecalhos) : cabecalhos,
        body: JSON.stringify({ eventoId, texto, nome: nome || null }),
    });
    return lerOuFalhar(resposta, 'Não foi possível enviar sua pergunta.');
}

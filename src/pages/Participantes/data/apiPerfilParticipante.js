/* Nível/xp reais do participante logado (GET /api/pessoa/me). Mesmo
   endpoint usado pela seção "Início" do /admin — aqui só a parte de
   gamificação é usada; os campos de conta (nome, email, camisetas) já vêm
   da sessão/perfil mockado. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Para onde o login devolve o usuário quando a sessão expira no meio. */
const ROTA_RETORNO = '/participantes';

/* Backend → formato usado pelos cards de nível (SecaoInicioParticipantes,
   SecaoPerfilParticipantes). `xp`/`nivel` vêm null até a inscrição ser
   confirmada com um nível cadastrado — nesse caso devolve null e quem
   chama decide o que mostrar. */
function deResposta(perfil) {
    if (perfil.xp == null || perfil.nivel == null) return null;
    return {
        nome: perfil.nivel.nome,
        xp: perfil.xp,
        xpFaltanteProximoNivel: perfil.xpFaltanteProximoNivel,
        proximoNivelNome: perfil.proximoNivelNome,
        posicaoRanking: perfil.posicaoRanking,
        totalParticipantesRanking: perfil.totalParticipantesRanking,
    };
}

export async function buscarNivelParticipante() {
    const resposta = await apiFetch(`${API_URL}/api/pessoa/me`, { headers: cabecalhosAuth() });
    if (tratarErroAuth(resposta, ROTA_RETORNO)) return null;
    if (!resposta.ok) throw new Error('Falha ao carregar seu nível.');
    return deResposta(await resposta.json());
}

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/compra`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

/* Backend → interface: valores em reais viram centavos. */
function deResposta(compra) {
    return {
        ...compra,
        valorUnitario: reaisParaCentavos(compra.valorUnitario),
        valorTotal: reaisParaCentavos(compra.valorTotal),
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

export async function listarCompras() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    const lista = await lerOuFalhar(resposta, 'Falha ao carregar compras.');
    return lista.map(deResposta);
}

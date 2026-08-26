/* Camada de acesso ao preço da camiseta avulsa (tabela `camiseta_extra`).
   Registro único por edição, gerenciado no /admin (seção "Informações
   SEMAC"). Mesma convenção de apiTipoInscricao.js: a interface trabalha em
   CENTAVOS para reaproveitar o CampoMoeda e a conversão para reais
   acontece aqui, na borda. */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/camiseta-extra`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

function centavosParaReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

/* Ano ainda sem preço cadastrado volta zerado (o backend responde 200 com
   valor 0), então a tela sempre tem o que renderizar. */
export async function lerCamisetaExtra(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar o preço da camiseta.');
    }
    const preco = await resposta.json();
    return reaisParaCentavos(preco.valor);
}

export async function salvarCamisetaExtra(ano, valorCentavos) {
    const resposta = await apiFetch(ROTA, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, valor: centavosParaReais(valorCentavos) }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao salvar o preço da camiseta.');
    }
    const preco = await resposta.json();
    return reaisParaCentavos(preco.valor);
}

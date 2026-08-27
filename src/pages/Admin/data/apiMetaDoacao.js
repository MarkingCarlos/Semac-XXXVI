/* Camada de acesso à meta de arrecadação da campanha de doação (tabela
   `meta_doacao`). Registro único por edição, gerenciado no /admin (seção
   "Informações SEMAC"). Mesma convenção de apiCamisetaExtra.js: a
   interface trabalha em CENTAVOS para reaproveitar o CampoMoeda e a
   conversão para reais acontece aqui, na borda. */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/meta-doacao`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

function centavosParaReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

/* Ano ainda sem meta cadastrada volta zerado (o backend responde 200 com
   valor 0), então a tela sempre tem o que renderizar. */
export async function lerMetaDoacao(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar a meta de doação.');
    }
    const meta = await resposta.json();
    return reaisParaCentavos(meta.valor);
}

export async function salvarMetaDoacao(ano, valorCentavos) {
    const resposta = await apiFetch(ROTA, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabecalhosAuth() },
        body: JSON.stringify({ ano, valor: centavosParaReais(valorCentavos) }),
    });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao salvar a meta de doação.');
    }
    const meta = await resposta.json();
    return reaisParaCentavos(meta.valor);
}

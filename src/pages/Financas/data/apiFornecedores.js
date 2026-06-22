import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_FORNECEDORES = `${API_URL}/api/fornecedor`;

function paraRequisicao(fornecedor) {
    return {
        nome: fornecedor.nome,
        contato: fornecedor.contato || null,
        observacao: fornecedor.observacao || null,
    };
}

async function lerRespostaOuFalhar(resposta, mensagemErro) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        throw new Error(mensagemErro);
    }
    return resposta.json();
}

export async function listarFornecedores() {
    const resposta = await fetch(ROTA_FORNECEDORES, { headers: cabecalhosAuth() });
    return lerRespostaOuFalhar(resposta, 'Falha ao carregar fornecedores.');
}

export async function criarFornecedor(fornecedor) {
    const resposta = await fetch(ROTA_FORNECEDORES, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(fornecedor)),
    });
    return lerRespostaOuFalhar(resposta, 'Falha ao cadastrar fornecedor.');
}

export async function atualizarFornecedor(id, fornecedor) {
    const resposta = await fetch(`${ROTA_FORNECEDORES}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(fornecedor)),
    });
    return lerRespostaOuFalhar(resposta, 'Falha ao atualizar fornecedor.');
}

export async function excluirFornecedor(id) {
    const resposta = await fetch(`${ROTA_FORNECEDORES}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error('Falha ao excluir fornecedor.');
    }
}

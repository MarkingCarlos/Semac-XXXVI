/* Camada de acesso à API de tipos de evento (tabela `tipo_evento`).
   Alimenta o seletor de tipo no formulário de Conteúdo e o painel de
   gerenciamento de tipos na mesma seção. */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/tipo-evento`;

async function lerOuFalhar(resposta, mensagemPadrao) {
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function listarTiposEvento() {
    const resposta = await fetch(ROTA);
    return lerOuFalhar(resposta, 'Falha ao carregar tipos de evento.');
}

export async function criarTipoEvento(tipo) {
    const resposta = await fetch(ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: tipo.nome, pontos: Number(tipo.pontos) }),
    });
    return lerOuFalhar(resposta, 'Falha ao criar tipo de evento.');
}

export async function atualizarTipoEvento(id, tipo) {
    const resposta = await fetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: tipo.nome, pontos: Number(tipo.pontos) }),
    });
    return lerOuFalhar(resposta, 'Falha ao atualizar tipo de evento.');
}

export async function excluirTipoEvento(id) {
    const resposta = await fetch(`${ROTA}/${id}`, { method: 'DELETE' });
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || 'Falha ao excluir tipo de evento.');
    }
}

import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_PATROCINADORES = `${API_URL}/api/patrocinador`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais ?? 0) * 100);
}

function centavosParaReais(centavos) {
    return Number(((centavos ?? 0) / 100).toFixed(2));
}

function deResposta(patrocinador) {
    const cota = patrocinador.cota ?? null;
    return {
        id: patrocinador.id,
        nome: patrocinador.nome,
        descricao: patrocinador.descricao ?? '',
        logoUrl: patrocinador.logoUrl ?? '',
        cotaId: cota?.id ?? null,
        nivel: cota?.nivel ?? '',
        valorCota: cota ? reaisParaCentavos(cota.valor) : 0,
        desconto: reaisParaCentavos(patrocinador.desconto),
        adicao: reaisParaCentavos(patrocinador.adicao),
        valorFinal: reaisParaCentavos(patrocinador.valorFinal),
        statusPagamento: patrocinador.statusPagamento ?? 'A_RECEBER',
        dataRecebimento: patrocinador.dataRecebimento ?? null,
        observacao: patrocinador.observacao ?? '',
    };
}

/* Interface → backend: centavos viram reais; envia cotaId.
   `valorCota`/`valorFinal` são auxiliares da interface e não são enviados
   (o backend calcula o valorFinal a partir da cota). */
function paraRequisicao(patrocinador) {
    return {
        nome: patrocinador.nome,
        descricao: patrocinador.descricao || null,
        logoUrl: patrocinador.logoUrl || null,
        cotaId: patrocinador.cotaId,
        desconto: centavosParaReais(patrocinador.desconto),
        adicao: centavosParaReais(patrocinador.adicao),
        statusPagamento: patrocinador.statusPagamento,
        dataRecebimento: patrocinador.dataRecebimento ?? null,
        observacao: patrocinador.observacao || null,
    };
}

async function lerRespostaOuFalhar(resposta, mensagemErro) {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta)) return;
        throw new Error(mensagemErro);
    }
    return resposta.json();
}

export async function listarPatrocinadores() {
    const resposta = await fetch(ROTA_PATROCINADORES, { headers: cabecalhosAuth() });
    const lista = await lerRespostaOuFalhar(resposta, 'Falha ao carregar patrocinadores.');
    return lista.map(deResposta);
}

export async function criarPatrocinador(patrocinador) {
    const resposta = await fetch(ROTA_PATROCINADORES, {
        method: 'POST',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(patrocinador)),
    });
    const criado = await lerRespostaOuFalhar(resposta, 'Falha ao cadastrar patrocinador.');
    return deResposta(criado);
}

export async function atualizarPatrocinador(id, patrocinador) {
    const resposta = await fetch(`${ROTA_PATROCINADORES}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(paraRequisicao(patrocinador)),
    });
    const atualizado = await lerRespostaOuFalhar(resposta, 'Falha ao atualizar patrocinador.');
    return deResposta(atualizado);
}

export async function atualizarStatusPagamento(id, statusPagamento) {
    const resposta = await fetch(`${ROTA_PATROCINADORES}/${id}/status`, {
        method: 'PATCH',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ statusPagamento }),
    });
    const atualizado = await lerRespostaOuFalhar(resposta, 'Falha ao atualizar o status do pagamento.');
    return deResposta(atualizado);
}

export async function excluirPatrocinador(id) {
    const resposta = await fetch(`${ROTA_PATROCINADORES}/${id}`, { method: 'DELETE', headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error('Falha ao excluir patrocinador.');
    }
}

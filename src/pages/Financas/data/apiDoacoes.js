/* Camada de acesso à API de doações (tabela `doador` do backend java_api).
   Vive no módulo financeiro por ser uma primitiva financeira: o /admin
   cadastra as doações e o /financeiro as contabiliza no caixa.

   A interface trabalha com valores em CENTAVOS (inteiros) para reaproveitar
   o CampoMoeda; o backend usa reais (DECIMAL). A conversão acontece aqui,
   nas bordas da aplicação. */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_DOADORES = `${API_URL}/api/doador`;

export function reaisParaCentavos(reais) {
    return Math.round(Number(reais) * 100);
}

export function centavosParaReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

/* Backend → interface: valor em reais (number) vira centavos (inteiro). */
function deResposta(doador) {
    return { ...doador, valor: reaisParaCentavos(doador.valor) };
}

/* Interface → backend: centavos viram reais. */
function paraRequisicao(doador) {
    return {
        nome: doador.nome,
        valor: centavosParaReais(doador.valor),
        data: doador.data,
    };
}

async function lerRespostaOuFalhar(resposta, mensagemErro) {
    if (!resposta.ok) {
        throw new Error(mensagemErro);
    }
    return resposta.json();
}

export async function listarDoadores() {
    const resposta = await fetch(ROTA_DOADORES);
    const lista = await lerRespostaOuFalhar(resposta, 'Falha ao carregar doações.');
    return lista.map(deResposta);
}

export async function criarDoador(doador) {
    const resposta = await fetch(ROTA_DOADORES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paraRequisicao(doador)),
    });
    const criado = await lerRespostaOuFalhar(resposta, 'Falha ao registrar doação.');
    return deResposta(criado);
}

export async function atualizarDoador(id, doador) {
    const resposta = await fetch(`${ROTA_DOADORES}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paraRequisicao(doador)),
    });
    const atualizado = await lerRespostaOuFalhar(resposta, 'Falha ao atualizar doação.');
    return deResposta(atualizado);
}

export async function excluirDoador(id) {
    const resposta = await fetch(`${ROTA_DOADORES}/${id}`, { method: 'DELETE' });
    if (!resposta.ok) {
        throw new Error('Falha ao excluir doação.');
    }
}

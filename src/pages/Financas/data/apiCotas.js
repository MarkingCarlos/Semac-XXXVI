/* Camada de acesso à API de cotas (tabela `cota`): nível + valor.
   A interface trabalha em CENTAVOS; o backend usa reais (DECIMAL). */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/cota`;

function reaisParaCentavos(reais) {
    return Math.round(Number(reais ?? 0) * 100);
}

/* Backend → interface: valor em reais vira centavos. */
function deResposta(cota) {
    return { id: cota.id, nivel: cota.nivel, valor: reaisParaCentavos(cota.valor) };
}

export async function listarCotas() {
    const resposta = await fetch(ROTA);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar cotas.');
    }
    const lista = await resposta.json();
    return lista.map(deResposta);
}

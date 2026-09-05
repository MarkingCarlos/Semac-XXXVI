/* Comunicação com a API de pagamento por cartão (java_api).
   Base: /api/pagamento. Chamada depois que a inscrição já existe -- fluxo
   público, sem token de auth, mesmo padrão de /api/inscricao. */

import { apiFetch } from '../../lib/apiFetch.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/* Cobra o cartão tokenizado pelo Card Payment Brick. `dados` traz
   pessoaUuid, token, paymentMethodId, issuerId, installments, payerEmail
   e payerCpf -- nunca um valor: o total é sempre recalculado no backend.
   Devolve { mpPaymentId, status, statusDetail, parcelas, valorCobrado }
   mesmo quando o cartão é recusado (status !== 'approved' não é erro
   HTTP); só lança quando a chamada em si falha. */
export async function criarPagamentoCartao(dados) {
    const resposta = await apiFetch(`${API_URL}/api/pagamento/cartao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
        timeout: 30000, // chamada à API da Mercado Pago pode ser mais lenta que o padrão
    })
    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null)
        throw new Error(corpo?.mensagem || 'Não foi possível processar o pagamento.')
    }
    return resposta.json()
}

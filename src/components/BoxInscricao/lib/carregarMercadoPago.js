const URL_SDK_MERCADO_PAGO = 'https://sdk.mercadopago.com/js/v2'

let promessaCarregamento = null

/* Injeta o SDK da Mercado Pago sob demanda -- só quando a pessoa abre a
   aba "Cartão" na etapa de pagamento -- em vez de carregá-lo em toda
   página do site via index.html. Idempotente: chamadas repetidas
   reaproveitam a mesma promise/script. */
export function carregarMercadoPago() {
    if (window.MercadoPago) return Promise.resolve(window.MercadoPago)
    if (promessaCarregamento) return promessaCarregamento

    promessaCarregamento = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = URL_SDK_MERCADO_PAGO
        script.async = true
        script.onload = () => resolve(window.MercadoPago)
        script.onerror = () => {
            promessaCarregamento = null
            reject(new Error('Não foi possível carregar o Mercado Pago.'))
        }
        document.head.appendChild(script)
    })

    return promessaCarregamento
}

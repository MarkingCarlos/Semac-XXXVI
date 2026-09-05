import { useState, useEffect } from 'preact/hooks'
import './contadorDiasEvento.css'

const DATA_INICIO_EVENTO = new Date(2026, 9, 26)
const TEXTO_DATA_INICIO_EVENTO = DATA_INICIO_EVENTO.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
})

function calcularDiasRestantes() {
    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const diferencaEmMs = DATA_INICIO_EVENTO - inicioHoje
    return Math.ceil(diferencaEmMs / (1000 * 60 * 60 * 24))
}

const ContadorDiasEvento = () => {
    const [diasRestantes, setDiasRestantes] = useState(calcularDiasRestantes)

    useEffect(() => {
        const intervaloAtualizacaoContagem = setInterval(() => {
            setDiasRestantes(calcularDiasRestantes())
        }, 1000 * 60 * 60)
        return () => clearInterval(intervaloAtualizacaoContagem)
    }, [])

    const eventoJaComecou = diasRestantes <= 0

    return (
        <section id="contadorDias" className="containerFaixaContadorDias">
            {eventoJaComecou ? (
                <p className="textoEventoIniciadoContadorDias">A SEMAC XXXVI começou!</p>
            ) : (
                <>
                    <span className="numeroDiasContadorDias">{diasRestantes}</span>
                    <span className="divisorContadorDias" aria-hidden="true" />
                    <div className="colunaLegendaContadorDias">
                        <p className="textoLegendaContadorDias">
                            {diasRestantes === 1 ? 'dia' : 'dias'} para a SEMAC XXXVI
                        </p>
                        <p className="textoDataContadorDias">Começa em {TEXTO_DATA_INICIO_EVENTO}</p>
                    </div>
                </>
            )}
        </section>
    )
}

export default ContadorDiasEvento

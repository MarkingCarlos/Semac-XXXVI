import { useState, useEffect } from 'preact/hooks'
import './contadorDiasEvento.css'

const DATA_INICIO_EVENTO = '2026-10-26T08:00:00-03:00'

function calcularTempoRestante() {
    const alvo = new Date(DATA_INICIO_EVENTO).getTime()
    const diferencaEmMs = Math.max(0, alvo - Date.now())
    const segundosTotais = Math.floor(diferencaEmMs / 1000)
    const doisDigitos = (numero) => String(numero).padStart(2, '0')

    const dias = Math.floor(segundosTotais / 86400)
    const horas = Math.floor((segundosTotais % 86400) / 3600)
    const minutos = Math.floor((segundosTotais % 3600) / 60)
    const segundos = segundosTotais % 60

    return {
        dias: String(dias),
        textoTempoRestante: `${doisDigitos(horas)}H ${doisDigitos(minutos)}M ${doisDigitos(segundos)}S`,
    }
}

const ContadorDiasEvento = () => {
    const [tempoRestante, setTempoRestante] = useState(calcularTempoRestante)

    useEffect(() => {
        const intervaloAtualizacaoContagem = setInterval(() => {
            setTempoRestante(calcularTempoRestante())
        }, 1000)
        return () => clearInterval(intervaloAtualizacaoContagem)
    }, [])

    return (
        <section id="contadorDias" className="containerFaixaContadorDias">
            <div className="conteudoContadorDias">
                <div className="blocoNumeroContadorDias">
                    <div className="divTituloContadorDias">
                        <span className="numeroDiasContadorDias">{tempoRestante.dias}</span>
                        <span className="rotuloDiasContadorDias">DIAS</span>{' '}
                        <span className="textoChamadaContadorDias">PARA A XXXVI SEMANA DA COMPUTAÇÃO</span>
                    </div>
                    <div className="linhaDataLocalContadorDias">
                        <span className="tracoAmareloContadorDias" aria-hidden="true" />
                        <span className="textoDataLocalContadorDias">
                            <span className="textoDataEventoContadorDias">26 a 30 de outubro de 2026</span>{' '}
                            <span className="separadorDataLocalContadorDias" aria-hidden="true">·</span>{' '}
                            <span className="textoLocalEventoContadorDias">IBILCE/UNESP</span>
                        </span>
                    </div>
                </div>
                <div className="colunaTextoContadorDias">
                    {/*<p className="tituloContadorDias">PARA A XXXVI SEMANA DA COMPUTAÇÃO</p>*/}

                    {/*<p className="textoTempoRestanteContadorDias">{tempoRestante.textoTempoRestante} RESTANTES</p>*/}
                </div>

            </div>

        </section>
    )
}

export default ContadorDiasEvento

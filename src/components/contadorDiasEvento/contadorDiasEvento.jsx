import { useState, useEffect } from 'preact/hooks'
import './contadorDiasEvento.css'

const DATA_INICIO_EVENTO = '2026-10-26T08:00:00-03:00'

// Singular quando falta exatamente 1 ("1 DIA", "1 HORA").
function rotuloUnidadeContadorDias(quantidade, singular, plural) {
    return quantidade === 1 ? singular : plural
}

/* Mostra a maior unidade que ainda cabe: dias enquanto falta 1 dia ou
   mais, depois horas e, na última hora, minutos (arredondados para cima,
   para não mostrar "0 MINUTOS" nos últimos segundos). `eventoComecou`
   vira true às 08:00 do dia 26, quando a faixa some da página. */
function calcularTempoRestante() {
    const alvo = new Date(DATA_INICIO_EVENTO).getTime()
    const diferencaEmMs = Math.max(0, alvo - Date.now())
    const segundosTotais = Math.floor(diferencaEmMs / 1000)
    const doisDigitos = (numero) => String(numero).padStart(2, '0')

    const dias = Math.floor(segundosTotais / 86400)
    const horas = Math.floor((segundosTotais % 86400) / 3600)
    const minutos = Math.floor((segundosTotais % 3600) / 60)
    const segundos = segundosTotais % 60

    let quantidadeContadorDias
    let unidadeContadorDias
    if (dias >= 1) {
        quantidadeContadorDias = dias
        unidadeContadorDias = rotuloUnidadeContadorDias(dias, 'DIA', 'DIAS')
    } else if (horas >= 1 || Math.ceil(segundosTotais / 60) === 60) {
        // O segundo caso: de 59m01s a 59m59s o arredondamento daria "60 MINUTOS".
        quantidadeContadorDias = Math.max(horas, 1)
        unidadeContadorDias = rotuloUnidadeContadorDias(quantidadeContadorDias, 'HORA', 'HORAS')
    } else {
        quantidadeContadorDias = Math.ceil(segundosTotais / 60)
        unidadeContadorDias = rotuloUnidadeContadorDias(quantidadeContadorDias, 'MINUTO', 'MINUTOS')
    }

    return {
        eventoComecou: diferencaEmMs === 0,
        quantidade: String(quantidadeContadorDias),
        unidade: unidadeContadorDias,
        textoTempoRestante: `${doisDigitos(horas)}H ${doisDigitos(minutos)}M ${doisDigitos(segundos)}S`,
    }
}

const ContadorDiasEvento = () => {
    const [tempoRestante, setTempoRestante] = useState(calcularTempoRestante)

    useEffect(() => {
        if (tempoRestante.eventoComecou) return
        const intervaloAtualizacaoContagem = setInterval(() => {
            setTempoRestante(calcularTempoRestante())
        }, 1000)
        return () => clearInterval(intervaloAtualizacaoContagem)
    }, [tempoRestante.eventoComecou])

    // A partir do início do evento não há mais o que contar.
    if (tempoRestante.eventoComecou) return null

    return (
        <section id="contadorDias" className="containerFaixaContadorDias">
            <div className="conteudoContadorDias">
                <div className="blocoNumeroContadorDias">
                    <div className="divTituloContadorDias">
                        <span className="numeroDiasContadorDias">{tempoRestante.quantidade}</span>
                        <span className="rotuloDiasContadorDias">{tempoRestante.unidade}</span>{' '}
                        <span className="textoChamadaContadorDias">PARA A XXXVI SEMANA DA COMPUTAÇÃO</span>
                    </div>
                    <div className="linhaDataLocalContadorDias">
                        <span className="tracoAmareloContadorDias" aria-hidden="true" />
                        <span className="textoDataLocalContadorDias">
                            <span className="textoDataEventoContadorDias">26 a 29 de outubro de 2026</span>{' '}
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

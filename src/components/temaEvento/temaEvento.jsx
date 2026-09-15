import { Fragment } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import './temaEvento.css'

/* Tema da edição — trocar a cada ano junto com os demais conteúdos editáveis.
   O primeiro trecho é o título do tema (recebe destaque); o segundo é o
   complemento que explica o recorte da edição. */
const TRECHOS_FRASE_TEMA = [
    { texto: 'Tecnologia com Responsabilidade:', destaque: true },
    { texto: 'O papel do profissional de TI na sociedade digital', destaque: false },
]

const ATRIBUICAO_TEMA = 'Tema da XXXVI Semana Acadêmica da Computação'

/* Cada trecho vira sua própria linha-bloco (o destaque nunca divide linha com
   o complemento), mas o índice das palavras segue corrido entre os trechos —
   assim o atraso da revelação continua crescendo ao atravessar a fronteira. */
let contadorPalavrasTema = 0
const LINHAS_FRASE_TEMA = TRECHOS_FRASE_TEMA.map(({ texto, destaque }) => ({
    destaque,
    palavras: texto.split(' ').map((palavra) => ({ palavra, indice: contadorPalavrasTema++ })),
}))

const TemaEvento = () => {
    const secaoRef = useRef(null)
    const [revelado, setRevelado] = useState(false)

    useEffect(() => {
        const elementoSecao = secaoRef.current
        if (!elementoSecao) return

        if (typeof IntersectionObserver === 'undefined') {
            setRevelado(true)
            return
        }

        const observador = new IntersectionObserver(
            ([entrada]) => {
                if (!entrada.isIntersecting) return
                setRevelado(true)
                observador.disconnect()
            },
            { threshold: 0.25 },
        )

        observador.observe(elementoSecao)
        return () => observador.disconnect()
    }, [])

    return (
        <section
            id="temaEvento"
            ref={secaoRef}
            className={`containerFaixaTemaEvento${revelado ? ' faixaTemaEventoRevelada' : ''}`}
        >
            <div className="brilhoFundoTemaEvento" aria-hidden="true" />
            <div className="conteudoTemaEvento">
                <blockquote className="blocoFraseTemaEvento">
                    {/* Fica dentro do blockquote para servir aos dois layouts sem
                        duplicar markup: pendurada fora da coluna no desktop,
                        empilhada acima do texto quando a tela aperta. */}
                    <svg
                        className="aspasDecorativasTemaEvento"
                        viewBox="0 0 104 47"
                        role="presentation"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path d="M6 0H40A6 6 0 0 1 46 6V20C46 34 38 43 25 47L21 37C29 35 34 31 35 26H6A6 6 0 0 1 0 20V6A6 6 0 0 1 6 0Z" />
                        <path d="M64 0H98A6 6 0 0 1 104 6V20C104 34 96 43 83 47L79 37C87 35 92 31 93 26H64A6 6 0 0 1 58 20V6A6 6 0 0 1 64 0Z" />
                    </svg>

                    <p className="fraseTemaEvento">
                        {LINHAS_FRASE_TEMA.map(({ palavras, destaque }) => (
                            <span
                                key={palavras[0].indice}
                                className={`trechoFraseTemaEvento${destaque ? ' destaqueFraseTemaEvento' : ''}`}
                            >
                                {palavras.map(({ palavra, indice }) => (
                                    /* O espaço é um nó de texto de verdade, e não margem no
                                       CSS: assim a frase copiada, lida por leitor de tela ou
                                       buscada no Ctrl+F continua tendo palavras separadas. */
                                    <Fragment key={`${indice}-${palavra}`}>
                                        <span
                                            className="palavraFraseTemaEvento"
                                            style={{ '--atrasoPalavraTemaEvento': `${indice * 35}ms` }}
                                        >
                                            {palavra}
                                        </span>
                                        {' '}
                                    </Fragment>
                                ))}
                            </span>
                        ))}
                    </p>
                    <footer className="linhaAtribuicaoTemaEvento">
                        <span className="tracoAmareloTemaEvento" aria-hidden="true" />
                        <cite className="textoAtribuicaoTemaEvento">{ATRIBUICAO_TEMA}</cite>
                    </footer>
                </blockquote>
            </div>
        </section>
    )
}

export default TemaEvento

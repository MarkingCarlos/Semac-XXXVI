import { useState, useEffect } from 'preact/hooks'
import LogoCardPatrocinador from '../LogoCardPatrocinador/LogoCardPatrocinador.jsx'
import './carrosselPatrocinadores.css'

const POR_PAGINA = 5
const INTERVALO_MS = 3000
const FADE_MS = 280

export default function CarrosselPatrocinadores({ patrocinadores }) {
    const [pagina, setPagina] = useState(0)
    const [fase, setFase] = useState('entrando')
    const [pausado, setPausado] = useState(false)

    const totalPaginas = Math.ceil(patrocinadores.length / POR_PAGINA)

    useEffect(() => {
        if (pausado) return
        const tick = setInterval(() => {
            setFase('saindo')
            setTimeout(() => {
                setPagina(p => (p + 1) % totalPaginas)
                setFase('entrando')
            }, FADE_MS)
        }, INTERVALO_MS)
        return () => clearInterval(tick)
    }, [totalPaginas, pausado])

    const grupo = patrocinadores.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

    function irParaPagina(i) {
        if (i === pagina) return
        setFase('saindo')
        setTimeout(() => { setPagina(i); setFase('entrando') }, FADE_MS)
    }

    return (
        <div
            class="carrosselPatrocinadores"
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
        >
            <div class={`grupoCarrosselPatrocinadores carrosselPatrocinadores${fase.charAt(0).toUpperCase() + fase.slice(1)}`}>
                {grupo.map((patrocinador, i) => (
                    <LogoCardPatrocinador key={`${pagina}-${i}`} nome={patrocinador.nome} src={patrocinador.src} />
                ))}
            </div>
            <div class="dotsCarrosselPatrocinadores" role="tablist" aria-label="Grupos de patrocinadores">
                {Array.from({ length: totalPaginas }, (_, i) => (
                    <button
                        key={i}
                        role="tab"
                        aria-selected={i === pagina}
                        aria-label={`Grupo ${i + 1}`}
                        class={`dotCarrosselPatrocinadores ${i === pagina ? 'dotCarrosselPatrocinadoresAtivo' : ''}`}
                        onClick={() => irParaPagina(i)}
                    />
                ))}
                <button
                    class="botaoPausaCarrosselPatrocinadores"
                    aria-label={pausado ? 'Retomar rotação automática' : 'Pausar rotação automática'}
                    onClick={() => setPausado(p => !p)}
                >
                    {pausado ? '▶' : '⏸'}
                </button>
            </div>
        </div>
    )
}

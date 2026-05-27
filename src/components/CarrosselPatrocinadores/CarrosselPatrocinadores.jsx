import { useState, useEffect } from 'preact/hooks'
import LogoCardPatrocinador from '../LogoCardPatrocinador/LogoCardPatrocinador.jsx'
import './carrosselPatrocinadores.css'

const POR_PAGINA = 5
const INTERVALO_MS = 3000
const FADE_MS = 280

export default function CarrosselPatrocinadores({ patrocinadores }) {
    const [pagina, setPagina] = useState(0)
    // 'entrando' | 'saindo' — controla qual animação CSS está ativa
    const [fase, setFase] = useState('entrando')

    const totalPaginas = Math.ceil(patrocinadores.length / POR_PAGINA)

    useEffect(() => {
        const tick = setInterval(() => {
            setFase('saindo')
            setTimeout(() => {
                setPagina(p => (p + 1) % totalPaginas)
                setFase('entrando')
            }, FADE_MS)
        }, INTERVALO_MS)
        return () => clearInterval(tick)
    }, [totalPaginas])

    const grupo = patrocinadores.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

    function irParaPagina(i) {
        if (i === pagina) return
        setFase('saindo')
        setTimeout(() => { setPagina(i); setFase('entrando') }, FADE_MS)
    }

    return (
        <div class="carrossel">
            <div class={`carrossel-grupo carrossel-${fase}`}>
                {grupo.map((p, i) => (
                    <LogoCardPatrocinador key={`${pagina}-${i}`} nome={p.nome} src={p.src} />
                ))}
            </div>
            <div class="carrossel-dots" role="tablist" aria-label="Grupos de patrocinadores">
                {Array.from({ length: totalPaginas }, (_, i) => (
                    <button
                        key={i}
                        role="tab"
                        aria-selected={i === pagina}
                        aria-label={`Grupo ${i + 1}`}
                        class={`carrossel-dot ${i === pagina ? 'carrossel-dot-ativo' : ''}`}
                        onClick={() => irParaPagina(i)}
                    />
                ))}
            </div>
        </div>
    )
}

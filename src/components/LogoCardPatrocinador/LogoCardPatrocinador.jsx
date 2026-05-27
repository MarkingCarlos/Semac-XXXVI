// Card de um patrocinador individual.
// Exibe logo real (src) quando disponível; caso contrário, mostra as iniciais como placeholder.
// Hover: leve elevação + borda laranja.

import './logoCardPatrocinador.css'

// iniciais é opcional: se não vier, calcula automaticamente a partir do nome
export default function LogoCardPatrocinador({ iniciais, nome, src }) {
    const fallback = iniciais ?? nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    return (
        <div class="logo-card-patrocinador">
            {src
                ? <img src={src} alt={nome} class="logo-card-imagem" />
                : <span class="logo-card-iniciais">{fallback}</span>
            }
            <span class="logo-card-nome">{nome}</span>
        </div>
    )
}

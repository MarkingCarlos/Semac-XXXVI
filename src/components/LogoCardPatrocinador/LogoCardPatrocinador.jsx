// Card de um patrocinador individual.
// Exibe logo real (src) quando disponível; caso contrário, mostra as iniciais como placeholder.
// Hover: leve elevação + borda laranja.

import './logoCardPatrocinador.css'

// iniciais é opcional: se não vier, calcula automaticamente a partir do nome
export default function LogoCardPatrocinador({ iniciais, nome, src }) {
    const iniciaisFallback = iniciais ?? nome.split(' ').map(palavra => palavra[0]).join('').slice(0, 2).toUpperCase()
    return (
        <div class="cartaoLogoPatrocinador">
            {src
                ? <img src={src} alt={nome} class="imagemLogoPatrocinador" />
                : <span class="iniciaisLogoPatrocinador">{iniciaisFallback}</span>
            }
            <span class="nomeLogoPatrocinador">{nome}</span>
        </div>
    )
}

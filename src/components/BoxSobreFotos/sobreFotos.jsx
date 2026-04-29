
import './sobreFotos.css'
export function sobreFotos({ titulo, texto }) {
    return (
        <div className="sobreFotosWrapper">
            <div className="boxFotos">
                <div className="boxFotosGlass">
                    <h3 className="tituloFotos">{titulo}</h3>
                    <p className="textoFotos">{texto}</p>
                </div>
            </div>
        </div>
    )

}

export default sobreFotos;


import './sobreFotos.css'
export function sobreFotos({
 titulo,
 texto,
}) {
    return (
        <div>
            <div className="boxFotos">


                <div className="header">

                </div>

                <div >
                    <h3 className="tituloFotos">{titulo}</h3>
                    <p className="textoFotos">
                        {texto}
                    </p>
                </div>


            </div>
        </div>
    )

}

export default sobreFotos;
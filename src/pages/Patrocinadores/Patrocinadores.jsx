import BoxPatrocinadores from "../../components/BoxPatrocinadores/boxPatrocinadores.jsx";
import './patrocinadores.css';

const Patrocinadores = () =>{

    return (
        <div >
            <h1 className="tituloSecao tituloPaginaPatrocinadores" style={{marginBottom: '1rem'}}>Patrocinadores</h1>
            <div className="paginaPatrocinadores">
                <BoxPatrocinadores/>
            </div>
        </div>
    )

}

export default Patrocinadores;

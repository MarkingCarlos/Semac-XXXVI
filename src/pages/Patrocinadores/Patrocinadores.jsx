import BoxPatrocinadores from "../../components/BoxPatrocinadores/boxPatrocinadores.jsx";
import './patrocinadores.css';

const Patrocinadores = () =>{

    return (
        <div>
            <h1 style={{color:'var(--Branco)',marginBottom: '1rem'}}>Patrocinadores</h1>
            <div className="patrocinadores-page">
                <BoxPatrocinadores/>
            </div>
        </div>
    )

}

export default Patrocinadores;

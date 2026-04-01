import './modalPalestra.css';
import closeCircle from '../../assets/closeCircle.svg';
import linkedinIcon from '../../assets/linkedinIcon.svg';
import instagramIcon from '../../assets/instagramIcon.svg';

export default function ModalPalestra ({palestra, redes}) {
    function abrirModal(){
        document.getElementById('modalPalestra-'+palestra.id).style.display = 'flex';
    }

    function fecharModal(){
        document.getElementById('modalPalestra-'+palestra.id).style.display = 'none';
    }

    return (
        <>
            <button onClick={abrirModal}>Abrir Modal</button>
            <div id={'modalPalestra-'+palestra.id} className='modalPalestraFundo' style='display: none;'>
                <div className='modalPalestra'>
                    <div className='divCabecalhoModal'>
                        <div className='infosCabecalho'>
                            <img src={palestra.imagem} className='imgCabecalho'></img>
                            <div>
                                <h2>{palestra.palestrante}</h2>
                                <h3>{palestra.titulo}</h3>
                                <div className='divRedesSociais'>
                                    <div className='linkedin'>
                                        <img src={linkedinIcon}/>
                                        <a href={redes.linkedin.link}>{redes.linkedin.nome}</a>
                                    </div>
                                    <div className='instagram'>
                                        <img src={instagramIcon}/>
                                        <a href={redes.instagram.link}>{redes.instagram.nome}</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='divCloseModal' onClick={fecharModal}>
                            <img src={closeCircle} className='closeModal'></img>
                        </div>
                    </div>
                    <p>{palestra.descricao}</p>
                </div>
            </div>
        </>
    );
}
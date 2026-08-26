import React from 'react';
import './ModalPatrocinadores.css';

const ModalDescPatrocinador = ({item, onClose}) => { 
    if (item == null){
        return null;
    }

    return (
    <div class='card-desc fade-in'>
        <div class = 'card-logo'>
            <img src = {item.logo}/>
        </div>
        <div class="card-btn">
            <button id="btn_close" onClick={onClose}>X</button>
        </div>
        <div class = 'card-text'>
            <p>
                {item.desc}
            </p>
        </div>
    </div>
 )};

export default ModalDescPatrocinador;
import React from 'react';
import './ModalPix.css';

const Modal = ({texto}) => {
  return (
    <div class='main'>
        <div class='main modal-div'>
            <p class='title'>Dados salvos com sucesso!</p>
            <p class='text'>Não se  esqueça de realizar o pagamento para efetivar sua inscrição </p>
        </div>
        <div class='qrcode'></div>
        <p class='text white'>(Você também pode pagar depois acessando a sua página do participante)</p>
    </div>
  );
};

export default Modal;
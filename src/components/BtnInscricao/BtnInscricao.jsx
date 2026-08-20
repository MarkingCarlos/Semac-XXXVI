import React from 'react';
import './BtnInscricao.css';

const Botao = ({ texto, subclass, onClick }) => {
  return (
<button className={`btnInscricao ${subclass}`} onClick={onClick}>
      {texto}
    </button>
  );
};

export default Botao;
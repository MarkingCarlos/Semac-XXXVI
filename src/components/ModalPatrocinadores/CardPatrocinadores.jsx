import React from 'react';
import './ModalPatrocinadores.css';
//import ExpandableCard, { CardItem, Firebase, MetaMask, Upstash} from '@/components/forgeui/expandable-card';


const CardPatrocinadores = ({item, onClick}) => {   //{item} is equal to props[item]
  return (
    <div className="card"  onClick={onClick}> 
      <img src={item.logo} alt = {item.desc}/>
    </div>
 )};

export default CardPatrocinadores;

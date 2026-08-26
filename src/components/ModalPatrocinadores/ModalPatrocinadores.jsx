import React, { useState } from 'react';
import './ModalPatrocinadores.css';
import patrocinadores from './Patrocinadores.json';
import CardPatrocinadores from './CardPatrocinadores'
import ModalDescPatrocinador from './ModalDescPatrocinador'

// separa os patrocinadores por categoria
  const lista_itens = patrocinadores.reduce((categorias, item)=>{ 
    //return <CardPatrocinadores item={item}/> //depreceated
    const categoria = item.category;
    if (!categorias[categoria]) {
        categorias[categoria] = [];
    }
     categorias[categoria].push(item);

    return categorias;
}, {});


/* const Modal = ({texto}) => {

  return (
    <div>
        <h1> Patrocinadores </h1>
        <div className="main">
            <div class = "category" id="platina">
                <div class="title"> Platina </div>
                <div className="content">
                  <div class="card"></div>
                </div>
            </div>
            <div class = "category" id="ouro">
                <div class="title"> Ouro </div>
                <div className="content">
                    <div class="card"></div>
                </div>
                
            </div>
        </div>
    </div>
  );
}; */

const Modal = ({patrocinadores}) =>{

    // variável de controle - ver se o modal está visível ou não
    const [selectedItem, setSelectedItem] = useState(null);

    const changeVisibility = () =>{
        setIsVisible(!isVisible);
        console.log({isVisible})
    }

    const cardClicked = (item) =>{

        if(selectedItem == null){
            setSelectedItem(item)
            const element = document.querySelector('.main');
            element.classList.add('darken');

        }else{
            const card = document.querySelector('.card-desc');
            console.log(card)
            card.classList.add('fade-out');

            const element = document.querySelector('.main');
            element.classList.remove('darken');

            setTimeout(() => {
            setSelectedItem(null);
            }, 300);
        }   

    }

    return (
        <div>
            <div className="main">
            <h1> Patrocinadores </h1>
                {Object.entries(lista_itens).map(([categoria, patrocinadores]) => (
                <div key={categoria} className='category'>  
                    <div class="title"> {categoria} </div>  
                    <div className="content">            
                        {patrocinadores.map((item) => (
                        <CardPatrocinadores key={item.id} item={item}  onClick = {() => cardClicked(item)}/> 
                        ))}
                    </div>
                </div>
            ))}
            </div>

            <ModalDescPatrocinador item = {selectedItem} onClose={() =>cardClicked(null)}/>


        </div>
    )
}

export default Modal;

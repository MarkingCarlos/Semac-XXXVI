import React, { useState, useMemo } from 'react';
import eventsData from './Events.json'; // Mudei o nome aqui para evitar conflito
import './ModalQrCode.css';

// Array dos dias do evento (Ajustado os IDs para começarem em 1, conforme o padrão de day_id)
const days = [
  { id: 1, name: '08/09 - Terça-feira' },
  { id: 2, name: '09/09 - Quarta-feira' },
  { id: 3, name: '10/09 - Quinta-feira' },
  { id: 4, name: '11/09 - Sexta-feira' },
];

// Componente Seletor Universal
const Picker = ({ data = [], title, value, onChange, className }) => {
  const selectedName = `selected ${title}`;
  return (
    <select 
      name={selectedName}
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      className={className} 
    >
      {/* Caso a lista esteja vazia, mostra uma opção padrão */}
      {data.length === 0 && <option value="">Nenhum evento encontrado</option>}
      
      {data.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
};

const ModalQrCode = () => { // Removida a prop vazia para usar o JSON importado

  // Determina o ID padrão como o do primeiro dia (1)
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id || 1);
  const [selectedEventId, setSelectedEventId] = useState('');

  // Organiza e agrupa a lista vinda do JSON
  const events_list = useMemo(() => {
    return Object.values(
      eventsData.reduce((acc, item) => {
        const id = item.day_id;
        if (!acc[id]) acc[id] = [];
        acc[id].push(item);
        return acc;
      }, {})
    ).sort((a, b) => a[0].day_id - b[0].day_id);
  }, []);

  // Determina a lista filtrada e formata os dados para o Picker
  const selected_day_events_list = useMemo(() => {
    const grupoDoDia = events_list.find(gp => Number(gp[0]?.day_id) === Number(selectedDayId)) || [];
    
    // Mapeia os dados garantindo que o Picker receba as propriedades 'id' e 'name'
    return grupoDoDia.map(evento => ({
      id: evento.id, 
      // SE NO SEU JSON O NOME DO EVENTO FOR DIFERENTE (ex: titulo, nome), TROQUE O 'evento.name' ABAIXO:
      name: evento.name || evento.titulo || evento.nome_evento || `Evento ${evento.id}`
    }));
  }, [events_list, selectedDayId]);

  const handleDayChange = (newDayId) => {
    setSelectedDayId(newDayId);
    setSelectedEventId(''); // Reseta o segundo picker ao mudar o dia
  }

  return (
    <div className='main'>
      <div className='left'>
        <div className='title'>
          <h1>Selecione o evento:</h1>
        </div>

        <div className='content-left'>
          <h2>Selecione o dia:</h2>
          <Picker 
            data={days} 
            title="Day" 
            value={selectedDayId} 
            onChange={handleDayChange} 
            className="picker"
          />

          <h2>Selecione o evento:</h2>
          <Picker 
            data={selected_day_events_list} 
            title="Event" 
            value={selectedEventId} 
            onChange={setSelectedEventId} 
            className="picker"
          />

          <button id="GenerateQrCode" className="generate"> Gerar QrCode</button>
        </div>
      </div>
      <div className='right'>
        <div className='content'>
          <p>ID do Evento Selecionado: {selectedEventId}</p>
        </div>
      </div>
    </div>
  );
}

export default ModalQrCode;
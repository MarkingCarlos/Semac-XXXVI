import { useState } from "react";
import "./CronogramaFiltro.css";

const exemplo = [
  {
    titulo: "Sei lá",
    descricao: "aaaaaaaaaaaaaaaaaaa",
    dia: "TERÇA",
    categoria: "IA",
  }
]

const DAYS = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA"];
const CATEGORIES = ["IA", "BIOINFORMÁTICA", "ROBÓTICA", "UI/UX", "SOFTWARE LIVRE"];

// Para que a semana comece na terça
const SEMANA_INICIO = 1;

export default function CronogramaFiltro() {
  const [selectedDay, setSelectedDay] = useState(DAYS[SEMANA_INICIO]);
  // null = sem filtro ativo = mostra todos
  const [selectedFilter, setSelectedFilter] = useState(null);

  function handleFilterClick(category) {
    // Clicar no filtro ativo desativa e volta a mostrar todos
    setSelectedFilter(prev => prev === category ? null : category);
  }

  const eventosFiltrados = exemplo.filter((evento) => {
    const dia = evento.dia === selectedDay;

    const categoria = evento.categoria === null || evento.categoria === selectedFilter;

    return dia && categoria;
  }); 

  return (
    <div className="cronograma-wrapper">
      <div className="cronograma-card">

        <h1 className="cronograma-title">{selectedDay}-FEIRA</h1>

        <div className="days-row">
          {DAYS.map((day, idx) => {
            const isDisabled = idx < SEMANA_INICIO;
            const isActive = day === selectedDay;
            const cls = isDisabled ? "disabled" : isActive ? "active" : "inactive";

            return (
              <button
                key={day}
                className={`day-btn ${cls}`}
                onClick={() => !isDisabled && setSelectedDay(day)}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* <div className="divider" /> */}

        <div className="filters-row">
          <span className="filter-label">Filtrar:</span>

          <button
            className={`filter-btn ${selectedFilter === null ? "active" : "inactive"}`}
            onClick={() => setSelectedFilter(null)}
          >
            TODOS
          </button>

          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`filter-btn ${category === selectedFilter ? "active" : "inactive"}`}
              onClick={() => handleFilterClick(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Exemplo
        <div className="eventos-container">
          {eventosFiltrados.length > 0 ? (
            eventosFiltrados.map((evento, index) => (
              <div className="evento-card" key={index}>
                <h2>{evento.titulo}</h2>

                <p>{evento.descricao}</p>

                <span>{evento.categoria}</span>
              </div>
            ))
          ) : (
            <p className="sem-eventos">
              Nenhum evento
            </p>
          )}
        </div> */}

      </div>
    </div>
  );
}


import { useState } from "react";
import "./CronogramaFiltro.css";
import SplitText from "./SplitText";

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
  const [selectedFilter, setSelectedFilter] = useState(null);

  function handleFilterClick(category) {
    setSelectedFilter(prev => prev === category ? null : category);
  }

  return (
    <div className="cronograma-wrapper">
      <div className="cronograma-card">

        <h1 className="cronograma-title titulo-secao">
          <SplitText
            key={selectedDay}
            tag="span"
            text={`${selectedDay}-FEIRA`}
            textAlign="center"
            delay={40}
            duration={0.5}
            ease="power3.out"
            from={{ opacity: 0, y: 30 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0}
            rootMargin="0px"
          />
        </h1>

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
            <p className="sem-eventos">Nenhum evento</p>
          )}
        </div> */}

      </div>
    </div>
  );
}

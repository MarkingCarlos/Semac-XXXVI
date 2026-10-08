import "./cronogramaFiltro.css";
import SplitText from "./SplitText";
import { formatarDataCronograma } from "./formatarDataCronograma.js";

export default function CronogramaFiltro({
  dias,
  datasDias = {},
  categorias,
  selectedDay,
  setSelectedDay,
  selectedFilter,
  setSelectedFilter,
}) {
  function handleFilterClick(category) {
    setSelectedFilter((prev) => (prev === category ? null : category));
  }

  // Com trilha ativa a lista mostra todos os dias, então o título vira o
  // nome da trilha em vez de uma data.
  const dataDiaSelecionado = datasDias[selectedDay];
  const textoTituloDiaCronograma = selectedFilter !== null
    ? selectedFilter.toUpperCase()
    : dataDiaSelecionado
      ? formatarDataCronograma(dataDiaSelecionado)
      : `${selectedDay}-FEIRA`;

  // Escolher um dia sai do modo "trilha em todos os dias".
  function handleDayClick(day) {
    setSelectedDay(day);
    setSelectedFilter(null);
  }

  return (
    <div className="wrapperCronograma">
      <div className="cartaoCronograma">
        <h1 className="" style={{marginBottom: '0px'}}>
          <SplitText
            key={textoTituloDiaCronograma}
            tag="span"
            text={textoTituloDiaCronograma}
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

        <div className="linhaDiasCronograma">
          {dias.map((day) => {
            const isActive = selectedFilter === null && day === selectedDay;
            const cls = isActive ? "diaAtivoCronograma" : "diaInativoCronograma";

            return (
              <button
                key={day}
                className={`botaoDiaCronograma ${cls}`}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="linhaFiltrosCronograma">
          <span className="rotuloFiltroCronograma">Filtrar:</span>

          <button
            className={`botaoFiltroCronograma ${
              selectedFilter === null ? "filtroAtivoCronograma" : "filtroInativoCronograma"
            }`}
            onClick={() => setSelectedFilter(null)}
          >
            TODOS
          </button>

          {categorias.map((category) => (
            <button
              key={category}
              className={`botaoFiltroCronograma ${
                category === selectedFilter ? "filtroAtivoCronograma" : "filtroInativoCronograma"
              }`}
              onClick={() => handleFilterClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

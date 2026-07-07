import "./cronogramaFiltro.css";
import SplitText from "./SplitText";


export default function CronogramaFiltro({
  dias,
  categorias,
  semanaInicio,
  selectedDay,
  setSelectedDay,
  selectedFilter,
  setSelectedFilter,
}) {
  function handleFilterClick(category) {
    setSelectedFilter((prev) => (prev === category ? null : category));
  }

  return (
    <div className="wrapperCronograma">
      <div className="cartaoCronograma">
        <h1 className="tituloCronograma tituloSecao">
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

        <div className="linhaDiasCronograma">
          {dias.map((day, idx) => {
            const isDisabled = idx < semanaInicio;
            const isActive = day === selectedDay;
            const cls = isDisabled
              ? "diaDesabilitadoCronograma"
              : isActive
              ? "diaAtivoCronograma"
              : "diaInativoCronograma";

            return (
              <button
                key={day}
                className={`botaoDiaCronograma ${cls}`}
                onClick={() => !isDisabled && setSelectedDay(day)}
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

import "./cronogramaFiltro.css";
import SplitText from "./SplitText";

// "26/10" a partir de um Date — rótulo dos botões de dia.
function textoDataBotaoDiaCronograma(data) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

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

  // Título com o dia da semana ("SEGUNDA-FEIRA"); sábado e domingo não
  // levam "-FEIRA". Com trilha ativa a lista mostra todos os dias, então
  // o título vira o nome da trilha. A data ("26/10") fica nos botões.
  const ehFimDeSemanaSelecionado = selectedDay === "SÁBADO" || selectedDay === "DOMINGO";
  const textoTituloDiaCronograma = selectedFilter !== null
    ? selectedFilter.toUpperCase()
    : ehFimDeSemanaSelecionado
      ? selectedDay
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
            // Sem data conhecida para o dia, o botão mostra o nome dele.
            const dataBotaoDia = datasDias[day];
            const textoBotaoDia = dataBotaoDia ? textoDataBotaoDiaCronograma(dataBotaoDia) : day;

            return (
              <button
                key={day}
                className={`botaoDiaCronograma ${cls}`}
                aria-label={dataBotaoDia ? `${day}, ${textoBotaoDia}` : undefined}
                onClick={() => handleDayClick(day)}
              >
                {textoBotaoDia}
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

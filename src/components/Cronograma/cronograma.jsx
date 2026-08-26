import { useEffect, useState } from "react";
import "./cronograma.css";

function ordenarPorHorario(a, b) {
  return a.horarioInicio.localeCompare(b.horarioInicio);
}

// Datas reais da semana do evento: 26 a 30 de outubro de 2026
// (mês em JS é 0-indexado, por isso outubro = 9)
const DIA_PARA_DATA = {
  SEGUNDA: new Date(2026, 9, 26),
  TERÇA: new Date(2026, 9, 27),
  QUARTA: new Date(2026, 9, 28),
  QUINTA: new Date(2026, 9, 29),
  SEXTA: new Date(2026, 9, 30),
};

function getDataHoraEvento(dia, horario) {
  const dataBase = DIA_PARA_DATA[dia];
  const [horas, minutos] = horario.split(":").map(Number);
  const data = new Date(dataBase);
  data.setHours(horas, minutos, 0, 0);
  return data;
}

// Calcula se um evento já passou, está acontecendo agora ou ainda vai
// acontecer, comparando a data/hora real do evento com "agora"
function getStatusEvento(evento, agora) {
  const inicio = getDataHoraEvento(evento.dia, evento.horarioInicio);
  const fim = getDataHoraEvento(evento.dia, evento.horarioFim);

  if (agora >= inicio && agora < fim) return "agora";
  return agora < inicio ? "futuro" : "passado";
}

function getChaveOrdenacao(evento) {
  return getDataHoraEvento(evento.dia, evento.horarioInicio).getTime();
}

function getRotuloEvento(status, ehProximo) {
  if (status === "agora") return "ACONTECENDO AGORA";
  if (ehProximo) return "PRÓXIMO EVENTO";
  if (status === "futuro") return "EM BREVE";
  return "ENCERRADO";
}

/**
 * Recebe a lista de eventos e filtros selecionados em cronogramaFiltro e ordena por horário
 * lista de eventos à esquerda e item selecionado à direita
 */
export default function Cronograma({ eventos, selectedDay, selectedFilter }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [agora, setAgora] = useState(() => new Date());

  // Atualiza o relógio para refletir a hora real sem precisar recarregar a página
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  const eventosFiltrados = eventos
    .filter((evento) => {
      const bateDia = evento.dia === selectedDay;
      const bateCategoria = selectedFilter === null || evento.categoria === selectedFilter;
      return bateDia && bateCategoria;
    })
    .sort(ordenarPorHorario);

  // Garante que sempre haja um evento válido selecionado quando o filtro muda
  useEffect(() => {
    const aindaExiste = eventosFiltrados.some((e) => e.id === selectedEventId);
    if (!aindaExiste) {
      setSelectedEventId(eventosFiltrados[0]?.id ?? null);
    }
  }, [selectedDay, selectedFilter]);

  const eventoSelecionado =
    eventosFiltrados.find((e) => e.id === selectedEventId) ?? eventosFiltrados[0] ?? null;

  const proximoEventoGlobal = eventos
    .map((evento) => ({ evento, status: getStatusEvento(evento, agora) }))
    .filter(({ status }) => status === "futuro")
    .sort((a, b) => getChaveOrdenacao(a.evento) - getChaveOrdenacao(b.evento))[0]
    ?.evento;

  const statusSelecionado = eventoSelecionado && getStatusEvento(eventoSelecionado, agora);
  const ehProximoSelecionado = eventoSelecionado?.id === proximoEventoGlobal?.id;

  return (
    <div className="wrapperCronogramaCorpo">
      <div className="corpoCronograma">
        <div className="listaEventosCronograma">
          {eventosFiltrados.length > 0 ? (
            eventosFiltrados.map((evento) => {
              const isSelected = evento.id === eventoSelecionado?.id;
              const status = getStatusEvento(evento, agora);
              return (
                <button
                  key={evento.id}
                  className={`eventoItemCronograma ${
                    isSelected ? "eventoItemAtivoCronograma" : ""
                  } ${status === "passado" ? "eventoItemPassadoCronograma" : ""}`}
                  onClick={() => setSelectedEventId(evento.id)}
                >
                  <span className="eventoHorarioCronograma">{evento.horarioInicio}</span>
                  <span className="eventoTextoCronograma">
                    <span className="eventoTituloCronograma">{evento.titulo}</span>
                    <span className="eventoPalestranteCronograma">{evento.palestrante}</span>
                  </span>
                  {status === "agora" && <span className="eventoAoVivoCronograma" />}
                </button>
              );
            })
          ) : (
            <p className="semEventosCronograma">Nenhum evento encontrado para este filtro.</p>
          )}
        </div>

        {eventoSelecionado && (
          <div className="destaqueCronograma">
            <div className="destaqueTopoCronograma">
              <span className="destaqueSeloCronograma">
                <span className="destaqueBolinhaCronograma" />
                {getRotuloEvento(statusSelecionado, ehProximoSelecionado)}
              </span>
              <h2 className="destaqueTituloCronograma">{eventoSelecionado.titulo}</h2>
            </div>

            <div className="destaqueConteudoCronograma">
              <span className="destaqueRotuloCronograma">Sobre a palestra</span>
              <p className="destaqueDescricaoCronograma">{eventoSelecionado.descricao}</p>

              <div className="destaqueGradeCronograma">
                <div className="destaqueCampoCronograma">
                  <span className="destaqueRotuloCronograma">Palestrante</span>
                  <span className="destaqueValorCronograma">{eventoSelecionado.palestrante}</span>
                </div>
                <div className="destaqueCampoCronograma">
                  <span className="destaqueRotuloCronograma">Horário</span>
                  <span className="destaqueValorCronograma">
                    {eventoSelecionado.horarioInicio} - {eventoSelecionado.horarioFim}
                  </span>
                </div>
                <div className="destaqueCampoCronograma">
                  <span className="destaqueRotuloCronograma">Local</span>
                  <span className="destaqueValorCronograma">{eventoSelecionado.local}</span>
                </div>
                <div className="destaqueCampoCronograma">
                  <span className="destaqueRotuloCronograma">Veja também em</span>
                  <a
                    className="destaqueLinkCronograma"
                    href={eventoSelecionado.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c2 .6 9.4.6 9.4.6s7.4 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5v-7l6.3 3.5-6.3 3.5Z" />
                    </svg>
                    {eventoSelecionado.linkTexto}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
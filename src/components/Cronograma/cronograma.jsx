import { useEffect, useState } from "react";
import "./cronograma.css";

function ordenarPorHorario(a, b) {
  return a.horarioInicio.localeCompare(b.horarioInicio);
}
const DIA_PARA_INDICE = {
  SEGUNDA: 1,
  TERÇA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
};

function paraMinutos(horario) {
  const [horas, minutos] = horario.split(":").map(Number);
  return horas * 60 + minutos;
}

// Calcula se um evento já passou, está acontecendo agora ou ainda vai acontecer
function getStatusEvento(evento, agora) {
  const diaAtual = agora.getDay();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const diaEvento = DIA_PARA_INDICE[evento.dia];
  const diferencaDias = diaEvento - diaAtual;

  if (diferencaDias === 0) {
    const inicio = paraMinutos(evento.horarioInicio);
    const fim = paraMinutos(evento.horarioFim);
    if (minutosAgora >= inicio && minutosAgora < fim) return "agora";
    return minutosAgora < inicio ? "futuro" : "passado";
  }

  return diferencaDias > 0 ? "futuro" : "passado";
}

function getChaveOrdenacao(evento, agora) {
  const diaAtual = agora.getDay();
  const diferencaDias = DIA_PARA_INDICE[evento.dia] - diaAtual;
  return diferencaDias * 1440 + paraMinutos(evento.horarioInicio);
}

function getRotuloEvento(status, ehProximo) {
  if (status === "agora") return "ACONTECENDO AGORA";
  if (ehProximo) return "PRÓXIMO EVENTO";
  if (status === "futuro") return "A ACONTECER";
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
    .sort((a, b) => getChaveOrdenacao(a.evento, agora) - getChaveOrdenacao(b.evento, agora))[0]
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

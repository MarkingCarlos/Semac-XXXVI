import { useState } from "react";
import CronogramaFiltro from "../../components/cronogramaFiltro/cronogramaFiltro.jsx";
import Cronograma from "../../components/Cronograma/cronograma.jsx";

const DAYS = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA"];
const CATEGORIES = ["IA", "BIOINFORMÁTICA", "ROBÓTICA", "UI/UX", "SOFTWARE LIVRE"];

// Para que a semana comece na terça
const SEMANA_INICIO = 1;

// Array exemplo
const EVENTOS = [
  {
    id: 1,
    titulo: "exemplo 1",
    palestrante: "fulano de tal",
    descricao:
      "teste teste teste",
    dia: "TERÇA",
    categoria: "IA",
    horarioInicio: "08:00",
    horarioFim: "10:00",
    local: "Auditório A",
    linkTexto: "YOUTUBE/SEMAC",
    linkUrl: "https://www.youtube.com/@SEMACsjrp",
  },
  {
    id: 2,
    titulo: "exemplo 2",
    palestrante: "ciclano",
    descricao:
      "palestra interessantíssima",
    dia: "TERÇA",
    categoria: "BIOINFORMÁTICA",
    horarioInicio: "10:00",
    horarioFim: "12:00",
    local: "Auditório A",
    linkTexto: "YOUTUBE/SEMAC",
    linkUrl: "https://youtube.com/@semac",
  },
  {
    id: 3,
    titulo: "robótica",
    palestrante: "diego renan bruno",
    descricao:
      "robôs são mt legais!!!!!!!!!!",
    dia: "TERÇA",
    categoria: "ROBÓTICA",
    horarioInicio: "14:00",
    horarioFim: "16:00",
    local: "Auditório A",
    linkTexto: "YOUTUBE/SEMAC",
    linkUrl: "https://www.youtube.com/@SEMACsjrp",
  },
  {
    id: 4,
    titulo: "computadores",
    palestrante: "beltrano",
    descricao:
      "computers",
    dia: "QUARTA",
    categoria: "UI/UX",
    horarioInicio: "14:00",
    horarioFim: "16:00",
    local: "Auditório A",
    linkTexto: "YOUTUBE/SEMAC",
    linkUrl: "https://www.youtube.com/@SEMACsjrp",
  },
  {
    id: 5,
    titulo: "Linux",
    palestrante: "Linus Torvalds",
    descricao:
      "arch btw",
    dia: "QUINTA",
    categoria: "SOFTWARE LIVRE",
    horarioInicio: "08:00",
    horarioFim: "10:00",
    local: "Auditório A",
    linkTexto: "YOUTUBE/SEMAC",
    linkUrl: "https://www.youtube.com/@SEMACsjrp",
  },
];

/**
 * Junta o filtro e o cronograma em si
 */
export default function CronogramaContainer() {
  const [selectedDay, setSelectedDay] = useState(DAYS[SEMANA_INICIO]);
  const [selectedFilter, setSelectedFilter] = useState(null);

  return (
    <>
      <CronogramaFiltro
        dias={DAYS}
        categorias={CATEGORIES}
        semanaInicio={SEMANA_INICIO}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
      />
      <Cronograma eventos={EVENTOS} selectedDay={selectedDay} selectedFilter={selectedFilter} />
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import CronogramaFiltro from "../../components/cronogramaFiltro/cronogramaFiltro.jsx";
import Cronograma from "../../components/Cronograma/cronograma.jsx";
import { listarEventosProgramacao, listarTrilhasProgramacao } from "./data/apiProgramacao.js";
import "./programacao.css";

/* 'YYYY-MM-DD' no fuso de quem está olhando (evita o problema de
   toISOString() virar o dia seguinte à noite em UTC-3). */
function diaLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/* Dias com evento, na ordem cronológica em que aparecem na semana real —
   não existe mais uma semana fixa de 5 dias: só entram dias que a API
   realmente devolveu. */
function diasComEvento(eventos) {
  const vistos = new Map();
  for (const evento of eventos) {
    const chave = diaLocal(evento.dataHoraInicio);
    if (!vistos.has(chave)) vistos.set(chave, evento.dia);
  }
  return [...vistos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, dia]) => dia);
}

/* Dia inicial: hoje, se houver programação hoje; senão o próximo dia com
   evento; passada a semana toda, o último dia. */
function diaInicial(eventos, dias, agora) {
  if (dias.length === 0) return null;
  const hoje = diaLocal(agora);
  const doDia = eventos.find((evento) => diaLocal(evento.dataHoraInicio) === hoje);
  if (doDia) return doDia.dia;

  const futuro = eventos
    .filter((evento) => evento.dataHoraInicio > agora)
    .sort((a, b) => a.dataHoraInicio - b.dataHoraInicio)[0];
  return futuro ? futuro.dia : dias[dias.length - 1];
}

/**
 * Junta o filtro e o cronograma em si. Dados reais (tabela `evento`),
 * sem mock: dias e horários vêm da data/hora real de cada evento.
 */
export default function CronogramaContainer() {
  const [eventos, setEventos] = useState([]);
  const [trilhas, setTrilhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarEventosProgramacao(), listarTrilhasProgramacao()])
      .then(([listaEventos, listaTrilhas]) => {
        if (!ativo) return;
        setEventos(listaEventos);
        setTrilhas(listaTrilhas);
        setSelectedDay(diaInicial(listaEventos, diasComEvento(listaEventos), new Date()));
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const dias = useMemo(() => diasComEvento(eventos), [eventos]);

  if (carregando) {
    return <p className="carregandoProgramacao">Carregando programação…</p>;
  }

  if (erro) {
    return <p className="erroProgramacao">{erro}</p>;
  }

  if (dias.length === 0) {
    return <p className="carregandoProgramacao">Programação em breve.</p>;
  }

  return (
    <>
      <CronogramaFiltro
        dias={dias}
        categorias={trilhas}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
      />
      <Cronograma eventos={eventos} selectedDay={selectedDay} selectedFilter={selectedFilter} />
    </>
  );
}

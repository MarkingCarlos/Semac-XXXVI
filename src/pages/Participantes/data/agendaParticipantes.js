/* Transforma a resposta de /api/evento no que a área do participante
   exibe: dias com atividade, palestras de cada dia, cards de minicurso e
   o que está acontecendo agora.

   Tudo aqui é função pura sobre a lista de eventos + o instante atual —
   nenhum dado inventado. O status de cada item (`concluido`, `atual`,
   `proximo`) vem do relógio, não de presença: a API ainda não expõe
   check-in por pessoa. */

const ROTULOS_DIA_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

/* Paleta dos cards de minicurso (ver corMinicurso*Participantes no CSS).
   Rotaciona pela ordem de exibição — a API não guarda cor. */
const CORES_MINICURSO_PARTICIPANTES = ['azul', 'rosa', 'vermelho'];

function paraData(textoIso) {
    return textoIso ? new Date(textoIso) : null;
}

/* Data → '2026-10-26' no fuso de quem está olhando. toISOString() não
   serve: à noite ele já devolve o dia seguinte em UTC-3. */
function diaLocal(data) {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
}

/* '2026-10-26T14:00:00' → '2026-10-26' (id do dia na agenda). */
export function diaDoEvento(evento) {
    return (evento.dataHoraInicio || '').slice(0, 10);
}

/* 14:00 → '14H'; 14:30 → '14H30'. */
export function formatarHora(textoIso) {
    const data = paraData(textoIso);
    if (!data) return '';
    const hora = data.getHours();
    const minutos = data.getMinutes();
    return minutos === 0 ? `${hora}H` : `${hora}H${String(minutos).padStart(2, '0')}`;
}

/* '14H — 18H' */
export function formatarFaixaHorario(evento) {
    return `${formatarHora(evento.dataHoraInicio)} — ${formatarHora(evento.dataHoraFim)}`;
}

/* 'SEG 26' — usado nos cards de minicurso, que atravessam dias. */
export function formatarDiaCurto(evento) {
    const data = paraData(evento.dataHoraInicio);
    if (!data) return '';
    return `${ROTULOS_DIA_SEMANA[data.getDay()]} ${data.getDate()}`;
}

/* 'concluido' | 'atual' | 'proximo', pelo horário do evento. */
export function statusPorHorario(evento, agora) {
    const inicio = paraData(evento.dataHoraInicio);
    const fim = paraData(evento.dataHoraFim);
    if (!inicio || !fim) return 'proximo';
    if (fim <= agora) return 'concluido';
    if (inicio <= agora) return 'atual';
    return 'proximo';
}

/* Palestrantes viram uma linha só: 'Mauro Santos e Anderson Lopes'. */
export function nomesPalestrantes(evento) {
    const nomes = evento.palestrantes || [];
    if (nomes.length === 0) return '';
    if (nomes.length === 1) return nomes[0];
    return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/* Detalhe secundário do card: quem apresenta ou, sem palestrante
   cadastrado, o tipo do evento. */
function detalheDoEvento(evento) {
    return nomesPalestrantes(evento) || evento.tipo || '';
}

export function ehMinicurso(evento) {
    return Boolean(evento.exigeInscricao);
}

export function ehEventoAberto(evento) {
    return !evento.exigeInscricao;
}

/* Dias que têm atividade, na ordem: [{ id, rotulo, data, hoje }]. */
export function montarDiasDaSemana(eventos, agora) {
    const hoje = diaLocal(agora);
    const dias = [...new Set(eventos.map(diaDoEvento).filter(Boolean))].sort();
    return dias.map((dia) => {
        const data = new Date(`${dia}T00:00:00`);
        return {
            id: dia,
            rotulo: ROTULOS_DIA_SEMANA[data.getDay()],
            data: data.getDate(),
            hoje: dia === hoje,
        };
    });
}

/* Dia que a agenda abre: hoje, se houver programação hoje; senão o
   próximo dia com atividade; passado o evento, o último dia. */
export function diaInicialAgenda(dias, agora) {
    if (dias.length === 0) return '';
    const hoje = diaLocal(agora);
    const doDia = dias.find((dia) => dia.id === hoje);
    if (doDia) return doDia.id;
    const proximo = dias.find((dia) => dia.id > hoje);
    return proximo ? proximo.id : dias[dias.length - 1].id;
}

/* Eventos abertos (palestra, mesa redonda, debate) de um dia. */
export function palestrasDoDia(eventos, diaId, agora) {
    return eventos
        .filter(ehEventoAberto)
        .filter((evento) => diaDoEvento(evento) === diaId)
        .sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))
        .map((evento) => ({
            id: evento.id,
            horario: formatarHora(evento.dataHoraInicio),
            local: evento.local || 'Local a definir',
            titulo: evento.nome.toUpperCase(),
            detalhe: detalheDoEvento(evento),
            status: statusPorHorario(evento, agora),
        }));
}

/* "Meu dia": tudo do dia em que o participante está — as palestras (em
   que ele já entra ao ser confirmado) e os minicursos que escolheu. */
export function montarMeuDia(eventos, meusEventos, diaId, agora) {
    return eventosDoParticipante(eventos, meusEventos)
        .filter((evento) => diaDoEvento(evento) === diaId)
        .sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))
        .map((evento) => ({
            id: evento.id,
            horario: formatarHora(evento.dataHoraInicio),
            local: evento.local || 'Local a definir',
            titulo: ehMinicurso(evento)
                ? `MINICURSO · ${evento.nome.toUpperCase()}`
                : evento.nome.toUpperCase(),
            detalhe: detalheDoEvento(evento),
            status: statusPorHorario(evento, agora),
        }));
}

/* Agenda do participante: as palestras (em que ele entra ao ser
   confirmado) mais os minicursos que ele escolheu. Minicurso de outra
   turma não é atividade dele. */
export function eventosDoParticipante(eventos, meusEventos) {
    const idsEscolhidos = new Set(meusEventos.filter(ehMinicurso).map((evento) => evento.id));
    return eventos.filter((evento) => ehEventoAberto(evento) || idsEscolhidos.has(evento.id));
}

/* O que está acontecendo agora (null fora do horário de qualquer
   atividade — inclusive antes da semana do evento). */
export function atividadeAgora(eventos, meusEventos, agora) {
    const emCurso = eventosDoParticipante(eventos, meusEventos)
        .find((evento) => statusPorHorario(evento, agora) === 'atual');
    return emCurso ? paraCartaoDestaque(emCurso) : null;
}

/* Próxima atividade a começar. */
export function proximaAtividade(eventos, meusEventos, agora) {
    const proxima = eventosDoParticipante(eventos, meusEventos)
        .filter((evento) => paraData(evento.dataHoraInicio) > agora)
        .sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))[0];
    return proxima ? paraCartaoDestaque(proxima) : null;
}

function paraCartaoDestaque(evento) {
    return {
        id: evento.id,
        tipo: (evento.tipo || 'Atividade').toUpperCase(),
        palestrante: nomesPalestrantes(evento),
        titulo: evento.nome,
        local: evento.local || 'Local a definir',
        horario: formatarFaixaHorario(evento),
        dia: formatarDiaCurto(evento),
        ehMinicurso: ehMinicurso(evento),
    };
}

/* Um minicurso por faixa de horário — a mesma regra que o backend
   valida. Serve para desabilitar o botão antes de chamar a API. */
export function conflitaComEscolhidos(candidato, escolhidos) {
    return escolhidos.some(
        (escolhido) =>
            escolhido.id !== candidato.id &&
            candidato.dataHoraInicio < escolhido.dataHoraFim &&
            escolhido.dataHoraInicio < candidato.dataHoraFim,
    );
}

/* Cards de minicurso da semana inteira, já resolvidos para a interface:
   se é meu, se esgotou, se bate de frente com outro que escolhi. */
export function montarMinicursos(eventos, meusEventos, agora) {
    const escolhidos = meusEventos.filter(ehMinicurso);
    const idsEscolhidos = new Set(escolhidos.map((evento) => evento.id));

    return eventos
        .filter(ehMinicurso)
        .sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))
        .map((evento, indice) => {
            const escolhido = idsEscolhidos.has(evento.id);
            const vagasRestantes = evento.vagasRestantes ?? null;
            return {
                id: evento.id,
                titulo: evento.nome.toUpperCase(),
                professor: (nomesPalestrantes(evento) || 'Palestrante a confirmar').toUpperCase(),
                cor: CORES_MINICURSO_PARTICIPANTES[indice % CORES_MINICURSO_PARTICIPANTES.length],
                horarioLocal: `${evento.local || 'Local a definir'} · ${formatarDiaCurto(evento)} · ${formatarFaixaHorario(evento)}`,
                vagasRestantes,
                capacidadeMaxima: evento.capacidadeMaxima,
                escolhido,
                esgotado: !escolhido && vagasRestantes !== null && vagasRestantes <= 0,
                jaComecou: paraData(evento.dataHoraInicio) <= agora,
                conflita: !escolhido && conflitaComEscolhidos(evento, escolhidos),
                status: statusPorHorario(evento, agora),
                dataHoraInicio: evento.dataHoraInicio,
                dataHoraFim: evento.dataHoraFim,
            };
        });
}

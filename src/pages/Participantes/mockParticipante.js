/* Dados mockados da Área do Participante (perfil e certificados).
   Nenhum endpoint de API expõe isso ainda — nome e e-mail reais vêm da
   sessão (ver Participantes.jsx).

   Conquistas NÃO estão mais aqui: são reais, vindas de
   data/apiConquistasParticipante.js (GET /api/conquista/minhas).

   Nível/xp NÃO está mais aqui: é real, vindo de
   data/apiPerfilParticipante.js (GET /api/pessoa/me).

   Ranking NÃO está mais aqui: é real, vindo de
   data/apiRankingParticipante.js (GET /api/pessoa/ranking).

   Programação, agenda e minicursos NÃO estão aqui: são reais, vindos de
   /api/evento e /api/evento/meus (ver data/apiEventosParticipantes.js e
   data/agendaParticipantes.js). */

export const comoGanharXpMockParticipante = [
    { acao: 'Presença em palestra', valor: 50 },
    { acao: 'Encontro de minicurso', valor: 50 },
    { acao: 'Dia completo sem faltas', valor: 25 },
    { acao: 'Avaliar uma palestra', valor: 10 },
];

export const perfilMockParticipante = {
    curso: 'Ciência da Computação · 3º ano',
    numeroInscricao: '#SM-2026-0187',
    minicursosUsados: 3,
    minicursosTotais: 4,
    presencas: 3,
    presencasTotais: 12,
};

export const certificadosMockParticipante = [
    { id: 'participacao', titulo: 'PARTICIPAÇÃO · SEMAC XXXVI', cargaHoraria: '12 horas', emitidoEm: '25/08' },
    { id: 'figma', titulo: 'MINICURSO · FIGMA', cargaHoraria: '8 horas', emitidoEm: '25/08' },
];

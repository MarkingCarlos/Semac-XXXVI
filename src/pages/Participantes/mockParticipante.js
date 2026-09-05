/* Dados mockados da Área do Participante (conquistas, perfil e
   certificados). Nenhum endpoint de API expõe isso ainda — nome e e-mail
   reais vêm da sessão (ver Participantes.jsx).

   Nível/xp NÃO está mais aqui: é real, vindo de
   data/apiPerfilParticipante.js (GET /api/pessoa/me).

   Ranking NÃO está mais aqui: é real, vindo de
   data/apiRankingParticipante.js (GET /api/pessoa/ranking).

   Programação, agenda e minicursos NÃO estão aqui: são reais, vindos de
   /api/evento e /api/evento/meus (ver data/apiEventosParticipantes.js e
   data/agendaParticipantes.js). */

export const conquistasMockParticipante = [
    { id: 'chegou-cedo', rotulo: 'CHEGOU CEDO', valorExibido: '1º', desbloqueada: true, cor: 'amarelo' },
    { id: 'maratona', rotulo: 'MARATONA', valorExibido: '×3', desbloqueada: true, cor: 'azul' },
    { id: 'perguntou', rotulo: 'PERGUNTOU', valorExibido: 'QA', desbloqueada: true, cor: 'rosa' },
    { id: '4-dias', rotulo: '4 DIAS', valorExibido: '?', desbloqueada: false },
    { id: 'minicurso', rotulo: 'MINICURSO', valorExibido: '?', desbloqueada: false },
    { id: 'doador', rotulo: 'DOADOR', valorExibido: '?', desbloqueada: false },
    { id: 'feedback', rotulo: 'FEEDBACK', valorExibido: '?', desbloqueada: false },
    { id: 'secreta', rotulo: 'SECRETA', valorExibido: '?', desbloqueada: false },
];

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

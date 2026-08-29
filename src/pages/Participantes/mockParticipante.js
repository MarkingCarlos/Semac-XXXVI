/* Dados mockados da Área do Participante (ranking, conquistas, perfil e
   certificados). Nenhum endpoint de API expõe isso ainda — nome e e-mail
   reais vêm da sessão (ver Participantes.jsx).

   Nível/xp NÃO está mais aqui: é real, vindo de
   data/apiPerfilParticipante.js (GET /api/pessoa/me).

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

export const rankingMockParticipante = {
    totalParticipantes: 214,
    atualizadoEm: '19h40',
    podio: [
        { posicao: 2, nome: 'Diego', xp: 380 },
        { posicao: 1, nome: 'Maíra', xp: 400 },
        { posicao: 3, nome: 'Ana', xp: 350 },
    ],
    lista: [
        { posicao: 4, nome: 'Pedro Nakano', xp: 320 },
        { posicao: 5, nome: 'Luana Bispo', xp: 300 },
        { posicao: 11, nome: 'Bruna Lima', xp: 200 },
        { posicao: 12, nome: 'Você', xp: 150, voce: true },
        { posicao: 13, nome: 'Rafael Sato', xp: 150 },
    ],
    listaCompleta: [
        { posicao: 1, nome: 'Maíra Fontes', xp: 400 },
        { posicao: 2, nome: 'Diego Prado', xp: 380 },
        { posicao: 3, nome: 'Ana Ruiz', xp: 350 },
        { posicao: 4, nome: 'Pedro Nakano', xp: 320 },
        { posicao: 5, nome: 'Luana Bispo', xp: 300 },
        { posicao: 12, nome: 'Você', xp: 150, voce: true },
    ],
};

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

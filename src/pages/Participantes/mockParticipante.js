/* Dados mockados da Área do Participante (XP, agenda, ranking, conquistas,
   certificados). Nenhum endpoint de API expõe isso ainda — nome, e-mail e
   nº de inscrição reais vêm da sessão (ver Participantes.jsx); o resto é
   fixo aqui para manter a página visualmente completa até o backend
   expor essas rotas. Trocar por chamadas reais é só substituir os usos
   deste módulo. */

export const nivelMockParticipante = {
    numero: 2,
    nome: 'PRATA',
    xp: 150,
    xpFaltanteProximoNivel: 150,
    proximoNivelNome: 'OURO',
    xpPorPresenca: 50,
    posicaoRanking: 12,
    totalParticipantesRanking: 214,
};

export const aulaAgoraMockParticipante = {
    tipo: 'PALESTRA',
    palestrante: 'Prof. Jonas Lameira',
    titulo: 'Matemática Básica Aplicada no Contexto de Jogos',
    local: 'LAB 5',
    horario: '19H — 20H30',
    checkinFeito: true,
};

export const aSeguirMockParticipante = {
    horario: '21h',
    tipo: 'Minicurso',
    titulo: 'Prototipagem no Figma',
    local: 'LAB 3',
};

export const meuDiaMockParticipante = [
    {
        id: 'abertura',
        horario: '17H',
        local: 'ANFI. 1',
        titulo: 'ABERTURA: CARREIRA EM DADOS',
        detalhe: 'Presença registrada · +50 XP',
        status: 'concluido',
    },
    {
        id: 'palestra-matematica',
        horario: '19H',
        local: 'LAB 5',
        titulo: 'MATEMÁTICA BÁSICA NO CONTEXTO DE JOGOS',
        detalhe: 'Acontecendo agora',
        status: 'atual',
    },
    {
        id: 'minicurso-figma',
        horario: '21H',
        local: 'LAB 3',
        titulo: 'MINICURSO · PROTOTIPAGEM NO FIGMA',
        detalhe: 'Encontro 2 de 4 · turma B',
        status: 'proximo',
    },
];

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

export const diasSemanaMockParticipante = [
    { id: 'seg', rotulo: 'SEG', data: 17 },
    { id: 'ter', rotulo: 'TER', data: 18, hoje: true },
    { id: 'qui', rotulo: 'QUI', data: 20 },
    { id: 'sex', rotulo: 'SEX', data: 21 },
];

export const minicursosMockParticipante = [
    {
        id: 'figma',
        professor: 'PROF. JONAS LAMEIRA · TURMA B',
        titulo: 'PROTOTIPAGEM NO FIGMA — TEORIA E PRÁTICA',
        cor: 'azul',
        tags: [
            { rotulo: 'SEG OK', concluido: true },
            { rotulo: 'TER 21H', atual: true },
            { rotulo: 'QUI' },
            { rotulo: 'SEX' },
        ],
        rodape: 'Presença nos 4 encontros libera o certificado de 8 horas.',
        encontro: '2 de 4 encontros',
        horarioLocal: 'LAB 3 · 21H',
    },
    {
        id: 'liderancas',
        professor: 'PROFA. LARA MENDES · TURMA A',
        titulo: 'LIDERANÇAS EM TIMES DE TECNOLOGIA',
        cor: 'rosa',
        horarioLocal: 'LAB 5 · 19H',
        situacao: 'quinta e sexta',
        situacaoLabel: 'começa quinta',
    },
    {
        id: 'redes-neurais',
        professor: 'PROF. RENATO ÁVILA · TURMA C',
        titulo: 'INTRODUÇÃO A REDES NEURAIS',
        cor: 'vermelho',
        horarioLocal: 'LAB 1 · SEX 14H',
        situacaoLabel: 'encontro único',
    },
];

export const palestrasDoDiaMockParticipante = [
    {
        id: 'abertura',
        horario: '17H',
        local: 'ANFITEATRO 1',
        titulo: 'ABERTURA: CARREIRA EM DADOS',
        detalhe: 'Presença registrada · +50 XP',
        status: 'concluido',
    },
    {
        id: 'palestra-matematica',
        horario: '19H · LAB 5 · AGORA',
        local: 'LAB 5',
        titulo: 'MATEMÁTICA BÁSICA NO CONTEXTO DE JOGOS',
        detalhe: 'Prof. Jonas Lameira',
        status: 'atual',
    },
    {
        id: 'liderancas',
        horario: '22H',
        local: 'ANFITEATRO 1',
        titulo: 'LIDERANÇAS EM TIMES DE TECNOLOGIA',
        detalhe: 'Aberta a todos os inscritos',
        status: 'normal',
    },
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

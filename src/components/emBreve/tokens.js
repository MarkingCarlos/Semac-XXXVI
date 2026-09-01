/* Tokens de design da página Em Breve (Cronograma) — Versão A */

export const CORES = {
  vinho:   '#730835',
  vinho2:  '#3D0118',
  laranja:  '#E79839',
  creme:    '#FCF8F5',
  azul:     '#52ABB1',
  roxo:     '#944D9E',
  rosa:     '#B13571',
  verde:    '#3DAA6A',
  dim:   'rgba(252,248,245,0.65)',
  dim2:  'rgba(252,248,245,0.45)',
  dim3:  'rgba(252,248,245,0.25)',
  linha:  'rgba(252,248,245,0.14)',
  linha2: 'rgba(252,248,245,0.08)',
};

/* Trilhas confirmadas — altere aqui para adicionar/remover trilhas */
export const TRILHAS = [
  { label: 'IA',             cor: '#944D9E' },
  { label: 'BIOINFORMÁTICA', cor: '#B13571' },
  { label: 'ROBÓTICA',       cor: '#E79839' },
  { label: 'UI/UX',          cor: '#52ABB1' },
  { label: 'SOFTWARE LIVRE', cor: '#3DAA6A' },
];

/* Data e hora do anúncio oficial dos palestrantes (America/Sao_Paulo) */
export const DATA_ANUNCIO = new Date('2026-09-01T12:00:00-03:00');

/* Estatísticas exibidas no card lateral */
export const STATS = [
  { valor: '40+', label: 'HORAS DE CONTEÚDO'  },
  { valor: '4',   label: 'DIAS'       },
  { valor: '6',   label: 'MINICURSOS' },
];

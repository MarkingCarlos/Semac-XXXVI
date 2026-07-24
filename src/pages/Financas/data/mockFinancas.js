/* Dados mockados do módulo financeiro — valores em CENTAVOS.
   Substituir pela API (java_api) quando o backend for integrado.
   Modelo de dados documentado no Notion: Banco de dados — semac2026. */

/* As cotas de patrocínio agora vêm da API real (tabela `cota`,
   ver data/apiCotas.js) — cada patrocinador é ligado a uma cota. */

/* Tipos de ingresso e inscrições agora vêm da API real:
   - tipos de ingresso (tabela `tipo_inscricao`) → gerenciados no /admin
   - inscrições confirmadas → GET /api/pessoa/inscricoes (ver data/apiInscricoes.js)
   por isso não há mais mock deles aqui. */

/* O caixa da FundoUnesp agora vem da API real (tabela `caixa_fundunesp`,
   ver data/apiCaixaFundunesp.js) — registro único, editável no card do
   Resumo. Por isso não há mais mock dele aqui. */

/* Patrocinadores agora vêm da API real (ver data/apiPatrocinios.js) —
   por isso não há mais mock deles aqui. As COTAS acima seguem servindo
   para preencher o valor da cota ao selecionar o nível. */

/* Fornecedores agora vêm da API real (ver data/apiFornecedores.js) —
   por isso não há mais mock deles aqui. As compras referenciam
   fornecedores por fornecedorId. */

export const CATEGORIAS_COMPRA = [
    'Kit do Participante',
    'Coffee Break',
    'Decoração',
    'Material Gráfico',
    'Infraestrutura',
    'Marketing',
    'Prêmios',
    'Transporte',
    'Outros',
];

export const CORES_CATEGORIA = {
    'Kit do Participante': { bg: 'rgba(231,152,57,0.15)',  color: '#E79839' },
    'Coffee Break':        { bg: 'rgba(234,88,12,0.15)',   color: '#fb923c' },
    'Decoração':           { bg: 'rgba(177,53,113,0.18)',  color: '#d4609a' },
    'Material Gráfico':    { bg: 'rgba(6,182,212,0.13)',   color: '#22d3ee' },
    'Infraestrutura':      { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
    'Marketing':           { bg: 'rgba(168,85,247,0.13)',  color: '#c084fc' },
    'Prêmios':             { bg: 'rgba(234,179,8,0.13)',   color: '#fbbf24' },
    'Transporte':          { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
    'Outros':              { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

/* As compras agora vêm da API real (ver data/apiCompras.js) — por isso
   não há mais mock delas aqui. CATEGORIAS_COMPRA e CORES_CATEGORIA acima
   seguem servindo ao formulário e aos selos de categoria. */

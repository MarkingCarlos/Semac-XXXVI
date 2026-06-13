/* Dados mockados do módulo financeiro — valores em CENTAVOS.
   Substituir pela API (java_api) quando o backend for integrado.
   Modelo de dados documentado no Notion: Banco de dados — semac2026. */

/* Valores das cotas de patrocínio. Editáveis pelo admin no futuro —
   por enquanto servem para preencher o campo valor automaticamente. */
export const COTAS = {
    APOIADOR: 50000,
    BRONZE: 150000,
    PRATA: 300000,
    OURO: 500000,
    PLATINA: 800000,
    ESPECIAL: 1000000,
};

export const NIVEIS_COTA = Object.keys(COTAS);

export const TIPOS_INSCRICAO = [
    { id: 1, nome: 'Ingresso Normal', valor: 10000 },
    { id: 2, nome: 'Permanência', valor: 1000 },
];

/* Registro único por edição — saldo repassado pela FundoUnesp. */
export const CAIXA_ANTERIOR = {
    valor: 824550,
    observacao: 'Saldo FundoUnesp — SEMAC XXXV',
    atualizadoEm: '2026-05-02T10:00:00',
};

export const MOCK_PATROCINADORES = [
    {
        id: 1,
        nome: 'NIC.br',
        descricao: 'Núcleo de Informação e Coordenação do Ponto BR',
        logoUrl: '',
        nivel: 'PLATINA',
        valorCota: 800000,
        desconto: 0,
        adicao: 100000,
        valorFinal: 900000,
        statusPagamento: 'RECEBIDO',
        dataRecebimento: '2026-05-18T14:30:00',
        observacao: 'Adição referente a estande extra no hall.',
    },
    {
        id: 2,
        nome: 'Vockan',
        descricao: 'Consultoria e desenvolvimento de software',
        logoUrl: '',
        nivel: 'OURO',
        valorCota: 500000,
        desconto: 50000,
        adicao: 0,
        valorFinal: 450000,
        statusPagamento: 'RECEBIDO',
        dataRecebimento: '2026-05-26T09:15:00',
        observacao: 'Desconto negociado por renovação de parceria.',
    },
    {
        id: 3,
        nome: 'Alura',
        descricao: 'Plataforma de cursos de tecnologia',
        logoUrl: '',
        nivel: 'PRATA',
        valorCota: 300000,
        desconto: 0,
        adicao: 0,
        valorFinal: 300000,
        statusPagamento: 'A_RECEBER',
        dataRecebimento: null,
        observacao: '',
    },
];

/* Fornecedores — espelha a tabela `fornecedor` do banco
   (nome, contato, observacao). Compras referenciam por fornecedorId. */
export const MOCK_FORNECEDORES = [
    { id: 1, nome: 'Estamparia Central', contato: '(14) 99876-1234', observacao: 'Pedido mínimo de 100 unidades.' },
    { id: 2, nome: 'Brindes Bauru', contato: 'contato@brindesbauru.com.br', observacao: '' },
    { id: 3, nome: 'Atacadão Bauru', contato: '(14) 3231-0000', observacao: 'Retirada na loja.' },
    { id: 4, nome: 'Gráfica Rápida', contato: '(14) 98123-4567', observacao: '' },
];

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

export const MOCK_COMPRAS = [
    {
        id: 1,
        descricao: 'Camiseta do evento',
        categoria: 'Kit do Participante',
        fornecedorId: 1,
        valorUnitario: 3590,
        quantidade: 200,
        valorTotal: 718000,
        dataCompra: '2026-05-28T11:00:00',
    },
    {
        id: 2,
        descricao: 'Chaveiro emborrachado',
        categoria: 'Kit do Participante',
        fornecedorId: 2,
        valorUnitario: 250,
        quantidade: 300,
        valorTotal: 75000,
        dataCompra: '2026-06-02T15:40:00',
    },
    {
        id: 3,
        descricao: 'Refrigerante 2L (coffee break)',
        categoria: 'Coffee Break',
        fornecedorId: 3,
        valorUnitario: 899,
        quantidade: 60,
        valorTotal: 53940,
        dataCompra: '2026-06-05T09:20:00',
    },
    {
        id: 4,
        descricao: 'Marca-páginas personalizado',
        categoria: 'Material Gráfico',
        fornecedorId: 4,
        valorUnitario: 120,
        quantidade: 500,
        valorTotal: 60000,
        dataCompra: '2026-06-08T16:10:00',
    },
];

/* Geradas automaticamente quando o organizador confirma o participante
   (role = PARTICIPANTE). Somente leitura no módulo financeiro. */
export const MOCK_INSCRICOES = [
    { id: 1, nomePessoa: 'Ana Beatriz Souza', tipoInscricao: 'Ingresso Normal', valor: 10000, dataConfirmacao: '2026-06-01T10:12:00' },
    { id: 2, nomePessoa: 'Pedro Henrique Lima', tipoInscricao: 'Ingresso Normal', valor: 10000, dataConfirmacao: '2026-06-01T10:45:00' },
    { id: 3, nomePessoa: 'Júlia Ferreira', tipoInscricao: 'Permanência', valor: 1000, dataConfirmacao: '2026-06-03T14:02:00' },
    { id: 4, nomePessoa: 'Lucas Almeida', tipoInscricao: 'Ingresso Normal', valor: 10000, dataConfirmacao: '2026-06-04T09:30:00' },
    { id: 5, nomePessoa: 'Mariana Costa', tipoInscricao: 'Permanência', valor: 1000, dataConfirmacao: '2026-06-06T17:55:00' },
    { id: 6, nomePessoa: 'Rafael Oliveira', tipoInscricao: 'Ingresso Normal', valor: 10000, dataConfirmacao: '2026-06-09T11:20:00' },
];

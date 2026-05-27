// ── Dados das cotas de patrocínio ─────────────────────────────────
// corFundo   : cor sólida de fundo do card
// corDestaque: cor usada no nome, ícone ✓ e badge — deve contrastar com corFundo
// corTexto   : cor dos benefícios — use escuro apenas quando corFundo for claro (ex: Ouro)
export const COTAS = [
    {
        id: 'apoiador',
        nome: 'Apoiador',
        corFundo: '#3D0118',
        corDestaque: '#FCF8F5',
        corTexto: 'rgba(252,248,245,0.82)',
        beneficios: [
            'Logo no site do evento',
            'Menção nas redes sociais',
            'Material de divulgação na recepção',
        ],
    },
    {
        id: 'bronze',
        nome: 'Bronze',
        corFundo: '#A10535',
        corDestaque: '#FCF8F5',
        corTexto: 'rgba(252,248,245,0.85)',
        beneficios: [
            'Tudo da cota Apoiador',
            'Logo em materiais impressos',
            'Stand no evento',
            '2 ingressos cortesia',
        ],
    },
    {
        id: 'prata',
        nome: 'Prata',
        corFundo: '#52ABB1',
        corDestaque: '#FCF8F5',
        corTexto: 'rgba(252,248,245,0.9)',
        beneficios: [
            'Tudo da cota Bronze',
            'Logo em banner principal',
            '5 ingressos cortesia',
            'Palestra de 15 min no evento',
            'Post dedicado nas redes sociais',
        ],
    },
    {
        id: 'ouro',
        nome: 'Ouro',
        corFundo: '#E79839',
        corDestaque: '#3D0118', // texto escuro: fundo dourado é claro
        corTexto: 'rgba(61,1,24,0.82)',
        beneficios: [
            'Tudo da cota Prata',
            'Destaque especial no site',
            '10 ingressos cortesia',
            'Workshop exclusivo de 1h',
            'Divulgação por email aos inscritos',
            'Logo na camiseta do evento',
        ],
    },
    {
        id: 'platina',
        nome: 'Platina',
        corFundo: '#1C1C2E',
        corDestaque: '#E8E8FF',
        corTexto: 'rgba(232,232,255,0.85)',
        beneficios: [
            'Tudo da cota Ouro',
            'Naming rights de trilha temática',
            'Apresentação na abertura ou encerramento',
            '20 ingressos cortesia',
            'Destaque máximo em todos os materiais',
            'Relatório pós-evento com métricas',
            'Reunião exclusiva com a organização',
        ],
    },
    {
        id: 'especial',
        nome: 'Especial',
        corFundo: '#94499E',
        corDestaque: '#FCF8F5',
        corTexto: 'rgba(252,248,245,0.88)',
        beneficios: [
            'Tudo da cota Platina',
            'Co-branding exclusivo do evento',
            'Palestra de abertura ou encerramento',
            '30 ingressos cortesia',
            'Logo em destaque absoluto em todos os materiais',
            'Entrevista publicada nas redes da SEMAC',
            'Acesso ao banco de currículos dos inscritos',
            'Pacote personalizado negociado diretamente com a organização',
        ],
    },
]

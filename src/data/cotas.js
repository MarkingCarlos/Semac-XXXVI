// ── Dados das cotas de patrocínio ─────────────────────────────────
// corFundo   : cor sólida de fundo do card
// corDestaque: cor usada no nome, ícone ✓ e badge — deve contrastar com corFundo
// corTexto   : cor dos benefícios — use escuro apenas quando corFundo for claro (ex: Ouro)
export const COTAS = [
    {
        id: 'apoiador',
        nome: 'Apoiador',
        preco: null,
        corFundo: '#f3e8e8',
        corDestaque: '#400505',
        corTexto: 'rgba(0,0,0,0.82)',
        beneficios: [
            'Logo no site do evento',
            'Menção nas redes sociais',
            'Material de divulgação na recepção',
        ],
    },
    {
        id: 'bronze',
        nome: 'Bronze',
        preco: 'R$ 1.500,00',
        corFundo: '#A10535',
        corDestaque: '#FCF8F5',
        corTexto: 'rgba(252,248,245,0.85)',
        beneficios: [
            'Logo da empresa no site da SEMAC',
            'Presença no banner de boas vindas do evento',
            'Participação na Mostra Técnica',
            'Presença no post coletivo de patrocinadores nas redes sociais',
        ],
    },
    {
        id: 'prata',
        nome: 'Prata',
        preco: 'R$ 3.000,00',
        corFundo: '#52ABB1',
        corDestaque: '#FCF8F5',
        corTexto: 'rgba(252,248,245,0.9)',
        beneficios: [
            'Tudo da cota Bronze',
            'Logo da empresa nos cartazes e flyers da SEMAC',
            'Publicação individual da logo da empresa nas redes sociais',
            'Presença da logo da empresa no vídeo de abertura',
        ],
    },
    {
        id: 'ouro',
        nome: 'Ouro',
        preco: 'R$ 6.000,00',
        corFundo: '#E79839',
        corDestaque: '#3D0118', // texto escuro: fundo dourado é claro
        corTexto: 'rgba(61,1,24,0.82)',
        beneficios: [
            'Tudo da cota Prata',
            'Presença no cartaz do auditório principal',
            'Momento de marketing da empresa',
            'Vídeo promocional apresentado nos intervalos',
            'Tráfego pago',
            'Horário para palestras na semana',
            'Publicação carrossel nas redes sociais',
            'Vídeo de abertura colaborativo com a empresa'
        ],
    },
    {
        id: 'platina',
        nome: 'Platina',
        preco: 'R$ 10.000,00',
        corFundo: '#33021A',
        corDestaque: '#E8E8FF',
        corTexto: 'rgba(232,232,255,0.85)',
        beneficios: [
            'Tudo da cota Ouro',
            'Presença no banner na área externa do coffee break',
            'Maior destaque para a logo da empresa nos produtos SEMAC',
            'Miniatura da logo da empresa em todos os posts',
            'Logo da empresa no crachá dos participantes, no púlpito e na faixa principal',
        ],
    },
    {
        id: 'especial',
        nome: 'Especial',
        preco: 'R$ 15.000,00',
        corFundo: '#26002C',
        corDestaque: '#FCF8F5',
        corTexto: 'rgba(252,248,245,0.88)',
        beneficios: [
            'Tudo da cota Platina',
            'Vídeo entrevista da empresa publicado em todas as redes sociais do evento',
            'Agradecimento no início de todas as palestras e eventos da SEMAC',
            'Logo na parte frontal da camiseta da SEMAC',
            'Presença em todos os itens e veículos de marketing da SEMAC',
        ],
    },
]

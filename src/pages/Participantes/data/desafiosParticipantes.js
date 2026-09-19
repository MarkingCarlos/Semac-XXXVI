/* Catálogo dos desafios da aba "Desafios" (/participantes).

   Desafios são jogos que o participante conclui para ganhar XP. Duas
   famílias:

     - DIÁRIOS: valem mais e são elaborados para cada dia do evento.
       Nenhum existe ainda — o bloco mostra o aviso de "em breve".
     - BÁSICOS: sempre disponíveis durante a semana. O Termo é o primeiro.

   Por que o catálogo está em código e não no banco: hoje há um desafio.
   Tabela, CRUD e tela de admin para um item só seria fixar a abstração
   antes de saber a forma dela — são os diários que vão dizer o que um
   desafio precisa ter (regra de conclusão, janela, XP variável). Cada
   desafio novo entra com uma entrada aqui e o seu `carregarCartoes`.
   Quando forem três ou quatro, vale migrar para o banco com liga/desliga
   no /admin, como as conquistas.

   Uma entrada do catálogo pode virar mais de um card: o Termo rende um por
   dia de evento já ocorrido, para que o dia 1 continue na tela depois que
   a semana avançou. Por isso o contrato é `carregarCartoes` (lista) e não
   `carregarEstado` (um estado só). */

import { listarDiasTermo } from '../../Termo/apiTermo.js';

export const CATEGORIA_DIARIO_DESAFIOS = 'diario';
export const CATEGORIA_BASICO_DESAFIOS = 'basico';

/* Situações que um card de desafio sabe desenhar. Todo `carregarCartoes`
   devolve cards com uma delas — é o contrato que mantém o card genérico.

   ENCERRADO e FINALIZADO são os dois jeitos de um desafio ter acabado, e a
   diferença é de quem fechou a porta: ENCERRADO é o tempo (o dia passou, e
   não há mais o que fazer ali nem para quem nunca jogou), FINALIZADO é a
   própria pessoa (gastou as tentativas de hoje e errou). Nenhum dos dois
   tem ação. */
export const SITUACAO_DISPONIVEL_DESAFIOS = 'disponivel';
export const SITUACAO_EM_ANDAMENTO_DESAFIOS = 'emAndamento';
export const SITUACAO_CONCLUIDO_DESAFIOS = 'concluido';
export const SITUACAO_ENCERRADO_DESAFIOS = 'encerrado';
export const SITUACAO_FINALIZADO_DESAFIOS = 'finalizado';
export const SITUACAO_INDISPONIVEL_DESAFIOS = 'indisponivel';

/* Em que ordem as situações aparecem na aba: o que ainda dá para jogar
   primeiro, o que já acabou depois. Sem isso o histórico do Termo empurra
   o jogo de hoje para o fim da lista, e a aba abre mostrando o que a
   pessoa não pode mais fazer.

   Concluído fica acima dos fins porque ainda é clicável (leva ao treino).
   Situação fora do mapa cai no fim, junto dos indisponíveis. */
const ORDEM_SITUACAO_DESAFIOS = [
    SITUACAO_DISPONIVEL_DESAFIOS,
    SITUACAO_EM_ANDAMENTO_DESAFIOS,
    SITUACAO_CONCLUIDO_DESAFIOS,
    SITUACAO_FINALIZADO_DESAFIOS,
    SITUACAO_ENCERRADO_DESAFIOS,
    SITUACAO_INDISPONIVEL_DESAFIOS,
];

const postoDaSituacaoDesafios = (cartao) => {
    const posto = ORDEM_SITUACAO_DESAFIOS.indexOf(cartao.estado?.situacao);
    return posto === -1 ? ORDEM_SITUACAO_DESAFIOS.length : posto;
};

const TOTAL_TENTATIVAS_TERMO = 6;

/* O `?treino=1` faz /termo abrir já na rodada de treino, sem passar pela
   tela de fim — quem clica no card concluído já sabe que acertou. */
const ROTA_TREINO_TERMO = '/termo?treino=1';

/* Estado de um card do Termo a partir de uma linha de GET /api/termo/meus.
   A palavra secreta não entra aqui em momento nenhum — a API não a devolve
   nesse resumo, e o card não precisa dela.

   O dia que já passou não tem ação nenhuma, nem para quem venceu: o treino
   roda a palavra de hoje (ver /termo), não a daquele dia, então um botão
   ali levaria a outro jogo. */
function estadoDoDiaTermo(dia) {
    /* Encerrado e perdido guarda xp 0 de propósito: "+0 XP" é o que conta a
       história de quem tentou e errou. Quem não jogou fica sem xpGanho, e
       o card mostra o que o desafio valia. */
    const xpGanho = dia.encerrado ? (dia.xpGanho ?? 0) : undefined;

    if (!dia.hoje) {
        return {
            situacao: SITUACAO_ENCERRADO_DESAFIOS,
            detalhe: dia.venceu ? 'Você acertou esse dia.' : 'Esse dia já passou.',
            xpGanho,
        };
    }

    if (dia.encerrado) {
        return dia.venceu
            ? {
                situacao: SITUACAO_CONCLUIDO_DESAFIOS,
                detalhe: 'Você acertou o Termo de hoje.',
                xpGanho,
                /* Quem acertou pode repetir a mesma palavra no modo
                   treino, que roda no navegador e não credita XP de novo
                   — por isso o card concluído continua clicável, só que
                   para outra rota. Quem perdeu não treina: o card fica
                   sem botão. */
                rota: ROTA_TREINO_TERMO,
            }
            : {
                situacao: SITUACAO_FINALIZADO_DESAFIOS,
                detalhe: 'Não foi dessa vez.',
                xpGanho,
            };
    }

    if (dia.tentativasUsadas > 0) {
        return {
            situacao: SITUACAO_EM_ANDAMENTO_DESAFIOS,
            detalhe: `${dia.tentativasUsadas} de ${TOTAL_TENTATIVAS_TERMO} tentativas usadas.`,
        };
    }

    return {
        situacao: SITUACAO_DISPONIVEL_DESAFIOS,
        detalhe: `Você tem ${TOTAL_TENTATIVAS_TERMO} tentativas.`,
    };
}

/* Um card por dia de Termo já ocorrido, do dia 1 para o último — o dia de
   hoje fecha a lista, que é onde a pessoa espera encontrá-lo depois dos
   que já passaram. */
async function carregarCartoesTermo(desafio) {
    const dias = await listarDiasTermo();

    /* null = a sessão caiu e listarDiasTermo já está redirecionando para o
       login; não há tela a montar. */
    if (!dias) {
        return [cartaoIndisponivelDesafios(desafio, '')];
    }

    /* Nenhum dia aconteceu ainda: antes da semana do evento o card existe
       para anunciar o jogo, e não para ser jogado. */
    if (dias.length === 0) {
        return [cartaoIndisponivelDesafios(desafio, 'Uma palavra nova em cada dia da SEMAC.')];
    }

    return dias.map((dia) => ({
        ...desafio,
        id: `${desafio.id}-dia-${dia.dia}`,
        nome: `${desafio.nome} · Dia ${dia.dia}`,
        estado: estadoDoDiaTermo(dia),
    }));
}

/* Card sem estado jogável: vale para o desafio que ainda não abriu e para
   o que não pôde ser carregado. Mantém o `id` do catálogo, então é sempre
   um só por desafio. */
function cartaoIndisponivelDesafios(desafio, detalhe) {
    return {
        ...desafio,
        estado: { situacao: SITUACAO_INDISPONIVEL_DESAFIOS, detalhe },
    };
}

export const DESAFIOS_PARTICIPANTES = [
    {
        id: 'termo',
        categoria: CATEGORIA_BASICO_DESAFIOS,
        nome: 'Termo',
        descricao: 'Adivinhe a palavra do dia em 6 tentativas.',
        xp: 5,
        rota: '/termo',
        carregarCartoes: carregarCartoesTermo,
    },
];

export const desafiosDaCategoria = (categoria) =>
    DESAFIOS_PARTICIPANTES.filter((desafio) => desafio.categoria === categoria);

/* Carrega os cards de todos os desafios de uma vez. Um desafio que falhe
   não derruba a aba: ele vira um card indisponível e os outros seguem.

   A lista sai ordenada pela situação (ver ORDEM_SITUACAO_DESAFIOS). O
   `sort` é estável, então dentro de uma mesma situação vale a ordem em que
   cada desafio devolveu seus cards — no Termo, o dia 1 na frente do 2. */
export async function carregarDesafiosParticipantes() {
    const porDesafio = await Promise.all(DESAFIOS_PARTICIPANTES.map(async (desafio) => {
        try {
            return await desafio.carregarCartoes(desafio);
        } catch {
            return [cartaoIndisponivelDesafios(desafio, 'Não foi possível carregar agora.')];
        }
    }));
    return porDesafio
        .flat()
        .sort((um, outro) => postoDaSituacaoDesafios(um) - postoDaSituacaoDesafios(outro));
}

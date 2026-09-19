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
   desafio novo entra com uma entrada aqui e o seu `carregarEstado`.
   Quando forem três ou quatro, vale migrar para o banco com liga/desliga
   no /admin, como as conquistas. */

import { lerEstadoTermo } from '../../Termo/apiTermo.js';

export const CATEGORIA_DIARIO_DESAFIOS = 'diario';
export const CATEGORIA_BASICO_DESAFIOS = 'basico';

/* Situações que um card de desafio sabe desenhar. Todo `carregarEstado`
   devolve uma delas — é o contrato que mantém o card genérico. */
export const SITUACAO_DISPONIVEL_DESAFIOS = 'disponivel';
export const SITUACAO_EM_ANDAMENTO_DESAFIOS = 'emAndamento';
export const SITUACAO_CONCLUIDO_DESAFIOS = 'concluido';
export const SITUACAO_ENCERRADO_DESAFIOS = 'encerrado';
export const SITUACAO_INDISPONIVEL_DESAFIOS = 'indisponivel';

const TOTAL_TENTATIVAS_TERMO = 6;

/* O `?treino=1` faz /termo abrir já na rodada de treino, sem passar pela
   tela de fim — quem clica no card concluído já sabe que acertou. */
const ROTA_TREINO_TERMO = '/termo?treino=1';

/* Traduz GET /api/termo/hoje para o estado que o card entende. A palavra
   secreta não entra aqui em momento nenhum — a API só a devolve com o
   jogo encerrado, e nem nesse caso o card precisa dela. */
async function carregarEstadoTermo() {
    const estado = await lerEstadoTermo();

    /* null = a sessão caiu e lerEstadoTermo já está redirecionando para o
       login; não há tela a montar. */
    if (!estado) {
        return { situacao: SITUACAO_INDISPONIVEL_DESAFIOS, detalhe: '' };
    }

    if (!estado.disponivel) {
        return {
            situacao: SITUACAO_INDISPONIVEL_DESAFIOS,
            detalhe: 'Uma palavra nova em cada dia da SEMAC.',
        };
    }

    const proximaPalavra = estado.ultimoDia
        ? 'Esse era o último Termo da semana.'
        : 'Volte amanhã para a próxima palavra.';

    if (estado.encerrado) {
        return estado.venceu
            ? {
                situacao: SITUACAO_CONCLUIDO_DESAFIOS,
                detalhe: proximaPalavra,
                xpGanho: estado.xpGanho ?? 0,
                /* Quem acertou pode repetir a mesma palavra no modo
                   treino, que roda no navegador e não credita XP de novo
                   — por isso o card concluído continua clicável, só que
                   para outra rota. Quem perdeu não treina: o card fica
                   sem botão, como antes. */
                rota: ROTA_TREINO_TERMO,
            }
            : {
                situacao: SITUACAO_ENCERRADO_DESAFIOS,
                detalhe: `Não foi dessa vez. ${proximaPalavra}`,
            };
    }

    const gastas = estado.tentativas?.length ?? 0;
    if (gastas > 0) {
        return {
            situacao: SITUACAO_EM_ANDAMENTO_DESAFIOS,
            detalhe: `${gastas} de ${TOTAL_TENTATIVAS_TERMO} tentativas usadas.`,
        };
    }

    return {
        situacao: SITUACAO_DISPONIVEL_DESAFIOS,
        detalhe: `Você tem ${TOTAL_TENTATIVAS_TERMO} tentativas.`,
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
        carregarEstado: carregarEstadoTermo,
    },
];

export const desafiosDaCategoria = (categoria) =>
    DESAFIOS_PARTICIPANTES.filter((desafio) => desafio.categoria === categoria);

/* Carrega o estado de todos os desafios de uma vez. Um desafio que falhe
   não derruba a aba: ele aparece indisponível e os outros seguem. */
export async function carregarDesafiosParticipantes() {
    return Promise.all(DESAFIOS_PARTICIPANTES.map(async (desafio) => {
        try {
            return { ...desafio, estado: await desafio.carregarEstado() };
        } catch {
            return {
                ...desafio,
                estado: {
                    situacao: SITUACAO_INDISPONIVEL_DESAFIOS,
                    detalhe: 'Não foi possível carregar agora.',
                },
            };
        }
    }));
}

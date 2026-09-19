/* Aba "Desafios": os jogos que valem XP.

   Dois blocos, nessa ordem — diários primeiro (valem mais, ainda por vir)
   e básicos depois (sempre disponíveis; o Termo é o primeiro deles). O
   catálogo e o estado de cada desafio vêm de
   data/desafiosParticipantes.js; aqui só se desenha. */

import {
    CATEGORIA_DIARIO_DESAFIOS,
    CATEGORIA_BASICO_DESAFIOS,
    SITUACAO_DISPONIVEL_DESAFIOS,
    SITUACAO_EM_ANDAMENTO_DESAFIOS,
    SITUACAO_CONCLUIDO_DESAFIOS,
    SITUACAO_ENCERRADO_DESAFIOS,
    SITUACAO_FINALIZADO_DESAFIOS,
    SITUACAO_INDISPONIVEL_DESAFIOS,
} from '../data/desafiosParticipantes.js';

/* Etiqueta e rótulo do botão por situação. Só quem tem `acao` vira card
   clicável — encerrado, finalizado e indisponível não levam a lugar nenhum.

   Concluído tem botão, mas não é uma segunda chance: o XP já foi
   creditado e a rota de `estado.rota` leva a uma rodada de treino.

   As duas etiquetas de fim dizem quem fechou a porta: "Atividade
   encerrada" é o dia que passou, "Atividade finalizada" é a pessoa que
   gastou as tentativas e errou. */
const APRESENTACAO_SITUACAO_DESAFIOS = {
    [SITUACAO_DISPONIVEL_DESAFIOS]: { etiqueta: 'Disponível', acao: 'JOGAR', classe: 'etiquetaDisponivelDesafiosParticipantes' },
    [SITUACAO_EM_ANDAMENTO_DESAFIOS]: { etiqueta: 'Em andamento', acao: 'CONTINUAR', classe: 'etiquetaEmAndamentoDesafiosParticipantes' },
    [SITUACAO_CONCLUIDO_DESAFIOS]: { etiqueta: 'Concluído', acao: 'JOGAR DE NOVO', classe: 'etiquetaConcluidoDesafiosParticipantes' },
    [SITUACAO_ENCERRADO_DESAFIOS]: { etiqueta: 'Atividade encerrada', acao: null, classe: 'etiquetaEncerradoDesafiosParticipantes' },
    [SITUACAO_FINALIZADO_DESAFIOS]: { etiqueta: 'Atividade finalizada', acao: null, classe: 'etiquetaFinalizadoDesafiosParticipantes' },
    [SITUACAO_INDISPONIVEL_DESAFIOS]: { etiqueta: 'Indisponível', acao: null, classe: 'etiquetaIndisponivelDesafiosParticipantes' },
};

function CartaoDesafioParticipantes({ desafio, onAbrir }) {
    const estado = desafio.estado ?? { situacao: SITUACAO_INDISPONIVEL_DESAFIOS, detalhe: '' };
    const apresentacao = APRESENTACAO_SITUACAO_DESAFIOS[estado.situacao]
        ?? APRESENTACAO_SITUACAO_DESAFIOS[SITUACAO_INDISPONIVEL_DESAFIOS];

    /* Partida encerrada mostra o que rendeu de fato (inclusive "+0 XP" de
       quem errou); as outras mostram o que o desafio vale. O destaque é só
       para xp que entrou — "+0 XP" em verde seria comemorar a derrota. */
    const xpExibido = estado.xpGanho ?? desafio.xp;
    const ganhouXp = estado.xpGanho > 0;

    return (
        <article className="cartaoDesafioParticipantes">
            <div className="cabecalhoCartaoDesafioParticipantes">
                <div className="tituloDesafio">
                    <span className="nomeCartaoDesafioParticipantes">{desafio.nome.toUpperCase()}</span>
                    <span className={`xpCartaoDesafioParticipantes ${ganhouXp ? 'xpGanhoCartaoDesafioParticipantes' : ''}`}>
                    +{xpExibido} XP
                </span>
                </div>

                <span className={`etiquetaCartaoDesafioParticipantes ${apresentacao.classe}`}>
                        {apresentacao.etiqueta}
                </span>
            </div>



            <div className="rodapeCartaoDesafioParticipantes">

                {apresentacao.acao && (
                    <button
                        type="button"
                        className="botaoCartaoDesafioParticipantes"
                        onClick={() => onAbrir(estado.rota ?? desafio.rota)}
                    >
                        {apresentacao.acao}
                    </button>
                )}
            </div>
        </article>
    );
}

function BlocoDesafiosParticipantes({ titulo, subtitulo, desafios, vazio, onAbrir }) {
    return (
        <section className="blocoDesafiosParticipantes">
            <div className="cabecalhoBlocoDesafiosParticipantes">
                <span className="tituloBlocoDesafiosParticipantes">{titulo}</span>
                <span className="subtituloBlocoDesafiosParticipantes">{subtitulo}</span>
            </div>

            {desafios.length === 0 ? (
                <div className="cartaoVazioDesafiosParticipantes">
                    <span className="tituloCartaoVazioDesafiosParticipantes">Em breve</span>
                    <span className="textoCartaoVazioDesafiosParticipantes">{vazio}</span>
                </div>
            ) : (
                <div className="listaCartoesDesafiosParticipantes">
                    {desafios.map((desafio) => (
                        <CartaoDesafioParticipantes key={desafio.id} desafio={desafio} onAbrir={onAbrir} />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function SecaoDesafiosParticipantes({ desafios, carregando, erro, onAbrir }) {
    const diarios = desafios.filter((d) => d.categoria === CATEGORIA_DIARIO_DESAFIOS);
    const basicos = desafios.filter((d) => d.categoria === CATEGORIA_BASICO_DESAFIOS);

    return (
        <div className="secaoDesafiosParticipantes">
            <div className="cabecalhoSecaoDesafiosParticipantes">
                <span className="tituloSecaoDesafiosParticipantes">DESAFIOS</span>
                <span className="subtituloSecaoDesafiosParticipantes">
                    Complete os desafios para ganhar pontos
                </span>
            </div>
            <div className="desafios" >
                {erro && <p className="avisoErroDesafiosParticipantes" role="alert">{erro}</p>}

                {carregando ? (
                    <p className="estadoCarregandoDesafiosParticipantes">Carregando desafios…</p>
                ) : (
                    <>
                        <BlocoDesafiosParticipantes
                            titulo="DESAFIOS DIÁRIOS"
                            subtitulo="Valem mais XP — um para cada dia do evento"
                            desafios={diarios}
                            vazio="Os desafios diários são liberados durante a SEMAC. Volte aqui no evento."
                            onAbrir={onAbrir}
                        />
                        <BlocoDesafiosParticipantes
                            titulo="DESAFIOS BÁSICOS"
                            subtitulo="Disponíveis durante toda a semana"
                            desafios={basicos}
                            vazio="Nenhum desafio básico disponível no momento."
                            onAbrir={onAbrir}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

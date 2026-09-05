/* Fatia a lista completa de GET /api/pessoa/ranking (já ordenada por xp,
   com `voce` marcado pelo backend) no que a UI mostra: pódio (top 3, na
   ordem 2º-1º-3º dos degraus) e uma lista curta — 4º/5º colocados + a
   vizinhança de quem está logado (1 antes, você, 1 depois sempre visível
   e mais alguns só em telas grandes, que preenchem o espaço vazio da
   barra lateral — ver .itemListaExtraRankingParticipantes no CSS). */

const QTD_PODIO = 3;
const QTD_TOPO_LISTA = 2;
const QTD_DEPOIS_VOCE_PADRAO = 1;
const QTD_DEPOIS_VOCE_EXTRA = 5;

export function montarRankingExibicao(resposta) {
    const completa = resposta?.lista ?? [];

    const podio = ordenarPodio(completa.slice(0, QTD_PODIO));
    const topoLista = completa.slice(QTD_PODIO, QTD_PODIO + QTD_TOPO_LISTA);

    const posicoesJaMostradas = new Set([...podio, ...topoLista].map((pessoa) => pessoa.posicao));
    const vizinhanca = montarVizinhancaVoce(completa).filter((pessoa) => !posicoesJaMostradas.has(pessoa.posicao));

    return {
        totalParticipantes: resposta?.totalParticipantes ?? completa.length,
        atualizadoEm: resposta?.atualizadoEm ?? '',
        podio,
        lista: [...topoLista, ...vizinhanca],
    };
}

function ordenarPodio(top3) {
    if (top3.length < 3) return top3;
    const [primeiro, segundo, terceiro] = top3;
    return [segundo, primeiro, terceiro];
}

function montarVizinhancaVoce(completa) {
    const indiceVoce = completa.findIndex((pessoa) => pessoa.voce);
    if (indiceVoce === -1) return [];

    const vizinhanca = [];
    if (indiceVoce > 0) vizinhanca.push(completa[indiceVoce - 1]);
    vizinhanca.push(completa[indiceVoce]);

    const depois = completa.slice(indiceVoce + 1, indiceVoce + 1 + QTD_DEPOIS_VOCE_PADRAO + QTD_DEPOIS_VOCE_EXTRA);
    depois.forEach((pessoa, indice) => {
        vizinhanca.push(indice < QTD_DEPOIS_VOCE_PADRAO ? pessoa : { ...pessoa, extraTelaGrande: true });
    });

    return vizinhanca;
}

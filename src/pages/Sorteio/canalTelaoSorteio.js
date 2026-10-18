/* Conversa entre o painel do organizador (/sorteio) e a guia projetada no
   telão (/sorteio/telao). As duas ficam no mesmo navegador do PC da
   comissão, então um BroadcastChannel basta: nada passa pelo servidor.

   Quem manda é o painel: ele escolhe o sorteio, busca os elegíveis,
   decide o ganhador e publica o estado inteiro a cada mudança. O telão só
   encena o que recebe e avisa quando a revelação apareceu.

   Mensagens do painel → telão
     { tipo: 'estado', estado }
       estado.fase: 'aguardando' | 'preparado' | 'girando' | 'revelado'
       estado.brinde, estado.eventoNome, estado.eventoHora: textos do sorteio selecionado
       estado.nomes: nomes dos presentes concorrendo
       estado.vencedorNome
       estado.idGiro: muda a cada giro, para o telão não repetir a encenação

   Mensagens do telão → painel
     { tipo: 'telaoAberto' }      pede o estado atual (abriu ou recarregou)
     { tipo: 'telaoPresente' }    batimento, a cada INTERVALO_PRESENCA_TELAO_MS
     { tipo: 'telaoFechado' }     a guia está sendo fechada
     { tipo: 'giroConcluido', idGiro } */

const NOME_CANAL_TELAO_SORTEIO = 'semacSorteioTelao';

export const NOME_JANELA_TELAO_SORTEIO = 'semacTelaoSorteio';
export const ROTA_TELAO_SORTEIO = '/sorteio/telao';

/* Tempo do "Prepare-se…" até a revelação no telão (preparo, contagem 3-2-1,
   roleta desacelerando e a pausa com o nome travado). O painel usa o mesmo
   valor como reserva caso o telão feche no meio. */
export const DURACAO_GIRO_TELAO_MS = 13000;

export const INTERVALO_PRESENCA_TELAO_MS = 2000;

export const ESTADO_INICIAL_TELAO = {
    fase: 'aguardando',
    brinde: '',
    eventoNome: '',
    eventoHora: '',
    nomes: [],
    vencedorNome: '',
    idGiro: 0,
};

export function abrirCanalTelaoSorteio(aoReceber) {
    if (typeof BroadcastChannel === 'undefined') {
        return { enviar: () => {}, fechar: () => {} };
    }
    const canal = new BroadcastChannel(NOME_CANAL_TELAO_SORTEIO);
    canal.onmessage = (evento) => aoReceber(evento.data);
    return {
        enviar: (mensagem) => canal.postMessage(mensagem),
        fechar: () => canal.close(),
    };
}

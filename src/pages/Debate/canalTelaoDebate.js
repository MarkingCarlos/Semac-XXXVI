/* Conversa entre o painel do controlador (/debate/<id>) e a guia projetada
   no telão (/debate/<id>/telao). As duas ficam no mesmo navegador do
   notebook ligado ao telão (tela estendida), então um BroadcastChannel
   basta: nada passa pelo servidor — mesmo esquema do sorteio
   (ver Sorteio/canalTelaoSorteio.js).

   Quem manda é o painel: publica o estado inteiro a cada mudança. O telão
   só desenha o que recebe.

   Mensagens do painel → telão
     { tipo: 'estado', estado }   ver ESTADO_INICIAL_TELAO_DEBATE

   Mensagens do telão → painel
     { tipo: 'telaoAberto' }      pede o estado atual (abriu ou recarregou)
     { tipo: 'telaoPresente' }    batimento, a cada INTERVALO_PRESENCA_TELAO_DEBATE_MS
     { tipo: 'telaoFechado' }     a guia está sendo fechada

   O timer não é mandado a cada segundo: vai a hora de término (`fimEm`)
   quando está rodando, ou o que sobrou (`restanteMs`) quando pausado, e
   cada guia calcula o tempo pelo próprio relógio — como as duas estão no
   mesmo computador, o relógio é o mesmo. */

const NOME_CANAL_TELAO_DEBATE = 'semacDebateTelao';

export const INTERVALO_PRESENCA_TELAO_DEBATE_MS = 2000;

export const rotaPainelDebate = (eventoId) => `/debate/${eventoId}`;
export const rotaTelaoDebate = (eventoId) => `/debate/${eventoId}/telao`;
export const nomeJanelaTelaoDebate = (eventoId) => `semacTelaoDebate${eventoId}`;

/* modo: 'vs' (os dois lado a lado) | 'a' | 'b' (fala de um, com timer) |
   'q' (pergunta em destaque na tela toda).
   participantes: [{ id, nome, cargo, temFoto }] — o 1º é o A, o 2º o B. */
export const ESTADO_INICIAL_TELAO_DEBATE = {
    eventoId: null,
    tituloDebate: '',
    participantes: [],
    modo: 'vs',
    rodando: false,
    fimEm: 0,
    restanteMs: 180000,
    duracaoMs: 180000,
    alertaSeg: 30,
    pergunta: '',
};

/* Milissegundos que faltam; negativo depois de esgotado. */
export function restanteTimerDebate(estado, agora = Date.now()) {
    return estado.rodando ? estado.fimEm - agora : estado.restanteMs;
}

export function abrirCanalTelaoDebate(aoReceber) {
    if (typeof BroadcastChannel === 'undefined') {
        return { enviar: () => {}, fechar: () => {} };
    }
    const canal = new BroadcastChannel(NOME_CANAL_TELAO_DEBATE);
    canal.onmessage = (evento) => aoReceber(evento.data);
    return {
        enviar: (mensagem) => canal.postMessage(mensagem),
        fechar: () => canal.close(),
    };
}

import './telaoDebate.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useParams } from 'wouter';
import PalcoTelaoDebate from './PalcoTelaoDebate.jsx';
import {
    abrirCanalTelaoDebate,
    ESTADO_INICIAL_TELAO_DEBATE,
    INTERVALO_PRESENCA_TELAO_DEBATE_MS,
} from './canalTelaoDebate.js';
import { buscarEstadoTelaoDebate, INTERVALO_SINCRONIA_TELAO_DEBATE_MS } from './apiTelaoDebate.js';

/* Guia projetada no telão durante o debate (/debate/<id>/telao). Não tem
   nenhum botão: quem comanda é o painel (/debate/<id>) — no mesmo
   navegador, pelo canal de canalTelaoDebate.js, ou de outro aparelho
   (celular), pelo servidor (apiTelaoDebate.js). Fica com o estado mais
   novo dos dois. A única tecla daqui é o F, que liga e desliga a tela
   cheia (duplo clique também). */

const estaEmTelaCheia = () =>
    Boolean(document.fullscreenElement) || window.innerHeight >= window.screen.height - 2;

function alternarTelaCheia() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
}

export default function TelaoDebate() {
    const eventoId = Number(useParams().id);
    const [estado, setEstado] = useState(ESTADO_INICIAL_TELAO_DEBATE);
    const [recebeuEstado, setRecebeuEstado] = useState(false);
    const [telaCheia, setTelaCheia] = useState(estaEmTelaCheia);
    const alteradoEmTelaoRef = useRef(-1);

    // Igual vale: é o mesmo estado repetido (ex.: resposta ao telaoAberto).
    const receberEstadoTelao = (novoEstado, alteradoEm = 0) => {
        if (!novoEstado || alteradoEm < alteradoEmTelaoRef.current) return;
        alteradoEmTelaoRef.current = alteradoEm;
        setEstado(novoEstado);
        setRecebeuEstado(true);
    };

    useEffect(() => {
        // O canal é um só para todos os debates: cada telão ouve só o seu
        const canal = abrirCanalTelaoDebate((mensagem) => {
            if (mensagem?.tipo === 'estado' && mensagem.estado?.eventoId === eventoId) {
                receberEstadoTelao(mensagem.estado, mensagem.alteradoEm);
            }
        });
        canal.enviar({ tipo: 'telaoAberto', eventoId });

        const intervaloPresenca = setInterval(
            () => canal.enviar({ tipo: 'telaoPresente', eventoId }),
            INTERVALO_PRESENCA_TELAO_DEBATE_MS,
        );
        const avisarFechamento = () => canal.enviar({ tipo: 'telaoFechado', eventoId });
        window.addEventListener('pagehide', avisarFechamento);

        // Consulta ao servidor: traz o que o painel do celular mudou e,
        // por ser do telão, acende "Telão conectado" lá.
        let ativo = true;
        const consultarServidor = () => {
            buscarEstadoTelaoDebate(eventoId, { doTelao: true })
                .then((resposta) => {
                    if (ativo && resposta.estado) receberEstadoTelao(resposta.estado.telao, resposta.alteradoEm);
                })
                .catch(() => {
                    // sem rede: o telão segue com o último estado e o canal local
                });
        };
        consultarServidor();
        const intervaloSincronia = setInterval(consultarServidor, INTERVALO_SINCRONIA_TELAO_DEBATE_MS);

        return () => {
            ativo = false;
            clearInterval(intervaloPresenca);
            clearInterval(intervaloSincronia);
            window.removeEventListener('pagehide', avisarFechamento);
            avisarFechamento();
            canal.fechar();
        };
    }, [eventoId]);

    useEffect(() => {
        const atualizarTelaCheia = () => setTelaCheia(estaEmTelaCheia());
        const teclaTelao = (e) => {
            if (e.key === 'f' || e.key === 'F') alternarTelaCheia();
        };
        window.addEventListener('resize', atualizarTelaCheia);
        document.addEventListener('fullscreenchange', atualizarTelaCheia);
        window.addEventListener('keydown', teclaTelao);
        return () => {
            window.removeEventListener('resize', atualizarTelaCheia);
            document.removeEventListener('fullscreenchange', atualizarTelaCheia);
            window.removeEventListener('keydown', teclaTelao);
        };
    }, []);

    return (
        <main className="mainTelaoDebate" onDblClick={alternarTelaCheia}>
            <PalcoTelaoDebate estado={estado} />
            {!recebeuEstado && (
                <p className="pAguardandoPainelTelaoDebate">Aguardando o painel do debate…</p>
            )}
            {!telaCheia && (
                <p className="pDicaTelaCheiaTelaoDebate">
                    Pressione <kbd className="kbdTeclaTelaoDebate">F</kbd> para tela cheia
                </p>
            )}
        </main>
    );
}

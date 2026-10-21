import './telaoDebate.css';
import { useEffect, useState } from 'preact/hooks';
import { useParams } from 'wouter';
import PalcoTelaoDebate from './PalcoTelaoDebate.jsx';
import {
    abrirCanalTelaoDebate,
    ESTADO_INICIAL_TELAO_DEBATE,
    INTERVALO_PRESENCA_TELAO_DEBATE_MS,
} from './canalTelaoDebate.js';

/* Guia projetada no telão durante o debate (/debate/<id>/telao). Não tem
   nenhum botão: quem comanda é o painel (/debate/<id>), no mesmo
   navegador, pelo canal de canalTelaoDebate.js. A única tecla daqui é o F,
   que liga e desliga a tela cheia (duplo clique também). */

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

    useEffect(() => {
        // O canal é um só para todos os debates: cada telão ouve só o seu
        const canal = abrirCanalTelaoDebate((mensagem) => {
            if (mensagem?.tipo === 'estado' && mensagem.estado?.eventoId === eventoId) {
                setEstado(mensagem.estado);
                setRecebeuEstado(true);
            }
        });
        canal.enviar({ tipo: 'telaoAberto', eventoId });

        const intervaloPresenca = setInterval(
            () => canal.enviar({ tipo: 'telaoPresente', eventoId }),
            INTERVALO_PRESENCA_TELAO_DEBATE_MS,
        );
        const avisarFechamento = () => canal.enviar({ tipo: 'telaoFechado', eventoId });
        window.addEventListener('pagehide', avisarFechamento);

        return () => {
            clearInterval(intervaloPresenca);
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

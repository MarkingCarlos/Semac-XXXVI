import { useRef, useState } from 'preact/hooks';
import { useLeitorQrCodeCamera } from './hooks/useLeitorQrCodeCamera.js';
import ModalSucessoPresenca from './ModalSucessoPresenca.jsx';
import ModalErroPresenca from './ModalErroPresenca.jsx';
import './TelaCameraCheckin.css';

const DURACAO_MODAL_SUCESSO_MS = 2200;

// TEMPORÁRIO — ajuste visual: mantém o modal de sucesso sempre aberto
// (com dados de exemplo) para posicionar pelo CSS. Voltar para false
// antes de subir.
const FIXAR_MODAL_SUCESSO_PARA_AJUSTE = false;
const RESULTADO_EXEMPLO_MODAL_SUCESSO = {
    titulo: 'PRESENÇA CONFIRMADA',
    nome: 'Fulano de Tal da Silva',
    info: 'Participante confirmado',
    xpTexto: '+50 XP',
    xpZerado: false,
    detalhe: 'atraso de 5 min',
};

/* Leitura contínua de QR code, usada pelos dois modos do /checkin.

   Não sabe o que está fazendo com o código lido: recebe uma `operacao`
   com o que mostrar na barra do topo e o que chamar quando identifica um
   participante pelo uuid do crachá. Marcar presença e conceder
   conquista entram por aqui do mesmo jeito. Não há busca manual: toda
   leitura passa pelo QR, para ficar registrado quem leu o crachá.

   operacao = { titulo, subtitulo, porUuid, normalizar } */
export default function TelaCameraCheckin({ operacao, onVoltar }) {
    const [modal, setModal] = useState(null); // null | 'sucesso' | 'erro'
    const [participanteConfirmado, setParticipanteConfirmado] = useState(null);
    const [mensagemErro, setMensagemErro] = useState('');
    const [lidos, setLidos] = useState(0);
    const [processando, setProcessando] = useState(false);

    const [repeticaoModalAjuste, setRepeticaoModalAjuste] = useState(0);

    const processandoRef = useRef(false);

    async function lerCodigo(uuid) {
        if (processandoRef.current) return;
        processandoRef.current = true;
        setProcessando(true);
        try {
            const dto = await operacao.porUuid(uuid);
            setParticipanteConfirmado(operacao.normalizar(dto));
            setLidos((valor) => valor + 1);
            setModal('sucesso');
        } catch (erro) {
            setMensagemErro(erro.message);
            setModal('erro');
        } finally {
            processandoRef.current = false;
            setProcessando(false);
        }
    }

    const { videoRef, cameraOk, liberarUltimoLido } = useLeitorQrCodeCamera({
        ativo: true,
        pausado: modal !== null || processando,
        onLeitura: lerCodigo,
    });

    // Chamado pelo modal só depois da animação de saída: é aqui que a
    // câmera volta a ler.
    function fecharModal() {
        setModal(null);
        setParticipanteConfirmado(null);
        setMensagemErro('');
        liberarUltimoLido();
    }

    return (
        <div className="containerTelaCameraCheckin">
            <div className="barraEventoTelaCameraCheckin">
                <div className="infoEventoTelaCameraCheckin">
                    <div className="dataEventoTelaCameraCheckin">{operacao.titulo}</div>
                    <div className="nomeEventoTelaCameraCheckin">{operacao.subtitulo}</div>
                </div>
                <button type="button" onClick={onVoltar} className="botaoTrocarTelaCameraCheckin">
                    TROCAR
                </button>
            </div>

            <div className="visorCameraTelaCameraCheckin">
                <video ref={videoRef} muted playsInline autoPlay className="videoTelaCameraCheckin" />
                {!cameraOk && (
                    <div className="marcadorPosicaoTelaCameraCheckin">
                        <span>Ativando câmera...</span>
                    </div>
                )}

                <div className="molduraMiraTelaCameraCheckin">
                    <div className="miraContainerTelaCameraCheckin">
                        <div className="cantoSuperiorEsquerdoTelaCameraCheckin" />
                        <div className="cantoSuperiorDireitoTelaCameraCheckin" />
                        <div className="cantoInferiorEsquerdoTelaCameraCheckin" />
                        <div className="cantoInferiorDireitoTelaCameraCheckin" />
                        <div className="linhaEscaneamentoTelaCameraCheckin" />
                    </div>
                </div>

                <div className="legendaTelaCameraCheckin">
                    <div className="tituloLegendaTelaCameraCheckin">APONTE PARA O QR CODE</div>
                    <div className="subtituloLegendaTelaCameraCheckin">
                        A leitura é contínua — não precisa tocar em nada entre participantes.
                    </div>
                </div>
            </div>

            <div className="rodapeTelaCameraCheckin">
                <div className="contadorTelaCameraCheckin">{lidos} LIDOS</div>
            </div>

            {FIXAR_MODAL_SUCESSO_PARA_AJUSTE ? (
                // Remonta ao fechar: o painel desce e sobe de novo, para ver as duas animações.
                <ModalSucessoPresenca
                    key={repeticaoModalAjuste}
                    resultado={RESULTADO_EXEMPLO_MODAL_SUCESSO}
                    onFechar={() => setRepeticaoModalAjuste((valor) => valor + 1)}
                />
            ) : modal === 'sucesso' && participanteConfirmado && (
                <ModalSucessoPresenca
                    resultado={participanteConfirmado}
                    onFechar={fecharModal}
                    fecharEmMs={DURACAO_MODAL_SUCESSO_MS}
                />
            )}
            {modal === 'erro' && (
                <ModalErroPresenca mensagem={mensagemErro} onFechar={fecharModal} />
            )}
        </div>
    );
}

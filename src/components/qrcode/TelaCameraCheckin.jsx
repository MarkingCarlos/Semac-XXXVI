import { useEffect, useRef, useState } from 'preact/hooks';
import { useLeitorQrCodeCamera } from './hooks/useLeitorQrCodeCamera.js';
import ModalSucessoPresenca from './ModalSucessoPresenca.jsx';
import ModalErroPresenca from './ModalErroPresenca.jsx';
import './TelaCameraCheckin.css';

const DURACAO_MODAL_SUCESSO_MS = 2200;

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

    const processandoRef = useRef(false);
    const timeoutFechamentoRef = useRef(null);

    async function lerCodigo(uuid) {
        if (processandoRef.current) return;
        processandoRef.current = true;
        setProcessando(true);
        try {
            const dto = await operacao.porUuid(uuid);
            setParticipanteConfirmado(operacao.normalizar(dto));
            setLidos((valor) => valor + 1);
            setModal('sucesso');
            timeoutFechamentoRef.current = setTimeout(fecharModal, DURACAO_MODAL_SUCESSO_MS);
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

    useEffect(() => () => clearTimeout(timeoutFechamentoRef.current), []);

    function fecharModal() {
        clearTimeout(timeoutFechamentoRef.current);
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

            {modal === 'sucesso' && participanteConfirmado && (
                <ModalSucessoPresenca resultado={participanteConfirmado} onFechar={fecharModal} />
            )}
            {modal === 'erro' && (
                <ModalErroPresenca mensagem={mensagemErro} onFechar={fecharModal} />
            )}
        </div>
    );
}

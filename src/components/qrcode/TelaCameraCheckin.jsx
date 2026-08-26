import { useEffect, useRef, useState } from 'preact/hooks';
import { useLeitorQrCodeCamera } from './hooks/useLeitorQrCodeCamera.js';
import { registrarPresencaPorQrCode } from './data/apiCheckin.js';
import ModalSucessoPresenca from './ModalSucessoPresenca.jsx';
import ModalErroPresenca from './ModalErroPresenca.jsx';
import ModalBuscaManualPresenca from './ModalBuscaManualPresenca.jsx';
import './TelaCameraCheckin.css';

const DURACAO_MODAL_SUCESSO_MS = 2200;

export default function TelaCameraCheckin({ evento, onVoltar }) {
    const [modal, setModal] = useState(null); // null | 'sucesso' | 'erro'
    const [buscaAberta, setBuscaAberta] = useState(false);
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
            const dto = await registrarPresencaPorQrCode(evento.id, uuid);
            setParticipanteConfirmado(dto);
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
        pausado: modal !== null || buscaAberta || processando,
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

    function abrirBusca() {
        clearTimeout(timeoutFechamentoRef.current);
        setModal(null);
        setBuscaAberta(true);
    }

    function fecharBusca() {
        setBuscaAberta(false);
    }

    function confirmadoNaBusca(dto) {
        setBuscaAberta(false);
        setParticipanteConfirmado(dto);
        setLidos((valor) => valor + 1);
        setModal('sucesso');
        timeoutFechamentoRef.current = setTimeout(fecharModal, DURACAO_MODAL_SUCESSO_MS);
    }

    function erroNaBusca(mensagem) {
        setBuscaAberta(false);
        setMensagemErro(mensagem);
        setModal('erro');
    }

    return (
        <div className="containerTelaCameraCheckin">
            <div className="barraEventoTelaCameraCheckin">
                <div className="infoEventoTelaCameraCheckin">
                    <div className="dataEventoTelaCameraCheckin">
                        {evento.data.split('-').reverse().slice(0, 2).join('/')} · {evento.hora}
                    </div>
                    <div className="nomeEventoTelaCameraCheckin">{evento.nome}</div>
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
                <button type="button" onClick={abrirBusca} className="botaoBuscarManualmenteTelaCameraCheckin">
                    BUSCAR MANUALMENTE
                </button>
            </div>

            {modal === 'sucesso' && participanteConfirmado && (
                <ModalSucessoPresenca participante={participanteConfirmado} onFechar={fecharModal} />
            )}
            {modal === 'erro' && (
                <ModalErroPresenca mensagem={mensagemErro} onBuscarManualmente={abrirBusca} onFechar={fecharModal} />
            )}
            {buscaAberta && (
                <ModalBuscaManualPresenca
                    eventoId={evento.id}
                    onFechar={fecharBusca}
                    onConfirmado={confirmadoNaBusca}
                    onErro={erroNaBusca}
                />
            )}
        </div>
    );
}

// Tela cheia de câmera aberta pelo "Marcar kit como entregue" no celular:
// antes de entregar, lê o QR do crachá para confirmar que quem está no
// balcão é mesmo a pessoa da linha. Só participante passa por aqui — a
// comissão e o desktop marcam direto (ver EntregaKits).
//
// A tela não compara nada sozinha: a lista de kits não traz o uuid de
// ninguém, então o QR lido vai junto no PATCH e o backend confere se é da
// pessoa. Se for de outra, a mensagem aparece aqui e a câmera continua
// lendo, sem precisar fechar.
//
// Se não der para ler (crachá esquecido, câmera ruim), "Entregar sem ler
// QR code" pausa a câmera e pede o motivo, que fica gravado na entrega.

import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useLeitorQrCodeCamera } from '../../../components/qrcode/hooks/useLeitorQrCodeCamera.js';
import { marcarKitEntregue } from '../data/apiParticipantes.js';
import './telaVerificacaoQrKits.css';

// Depois de um erro, o mesmo QR volta a valer: dá para tentar de novo
// (ex.: a rede caiu) sem trocar de crachá.
const ESPERA_RELER_APOS_ERRO_KITS_MS = 2500;

// Mesmo limite da coluna kit_justificativa_sem_qr.
const LIMITE_JUSTIFICATIVA_SEM_QR_KITS = 255;

export default function TelaVerificacaoQrKits({ pessoa, onConfirmar, onCancelar }) {
    const [processandoLeituraKits, setProcessandoLeituraKits] = useState(false);
    const [erroLeituraKits, setErroLeituraKits] = useState('');
    const [justificandoSemQrKits, setJustificandoSemQrKits] = useState(false);
    const [justificativaSemQrKits, setJustificativaSemQrKits] = useState('');
    const [enviandoSemQrKits, setEnviandoSemQrKits] = useState(false);
    const [erroSemQrKits, setErroSemQrKits] = useState('');
    const processandoLeituraRef = useRef(false);
    const temporizadorReleituraRef = useRef(null);

    async function conferirQrKits(uuid) {
        if (processandoLeituraRef.current) return;
        processandoLeituraRef.current = true;
        setProcessandoLeituraKits(true);
        setErroLeituraKits('');
        try {
            const atualizada = await marcarKitEntregue(pessoa.id, true, { uuid });
            onConfirmar(atualizada);
        } catch (e) {
            setErroLeituraKits(e.message);
            clearTimeout(temporizadorReleituraRef.current);
            temporizadorReleituraRef.current = setTimeout(liberarUltimoLido, ESPERA_RELER_APOS_ERRO_KITS_MS);
        } finally {
            processandoLeituraRef.current = false;
            setProcessandoLeituraKits(false);
        }
    }

    const { videoRef, cameraOk, liberarUltimoLido } = useLeitorQrCodeCamera({
        ativo: true,
        pausado: processandoLeituraKits || justificandoSemQrKits,
        onLeitura: conferirQrKits,
    });

    async function entregarSemQrKits(evento) {
        evento.preventDefault();
        const justificativa = justificativaSemQrKits.trim();
        if (!justificativa) return;
        setEnviandoSemQrKits(true);
        setErroSemQrKits('');
        try {
            const atualizada = await marcarKitEntregue(pessoa.id, true, { justificativaSemQr: justificativa });
            onConfirmar(atualizada);
        } catch (e) {
            setErroSemQrKits(e.message);
            setEnviandoSemQrKits(false);
        }
    }

    function voltarParaCameraKits() {
        setJustificandoSemQrKits(false);
        setErroSemQrKits('');
    }

    // A página não rola por baixo enquanto a câmera ocupa a tela.
    useEffect(() => {
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = overflowAnterior;
            clearTimeout(temporizadorReleituraRef.current);
        };
    }, []);

    // No body: um ancestral com transform (animações do /admin) quebraria o fixed.
    return createPortal(
        <div class="telaVerificacaoQrKits" role="dialog" aria-modal="true" aria-label={`Ler QR code de ${pessoa.nome}`} data-lenis-prevent>
            <div class="barraTopoVerificacaoQrKits">
                <div class="infoPessoaVerificacaoQrKits">
                    <span class="rotuloVerificacaoQrKits">Leia o QR code de</span>
                    <span class="nomePessoaVerificacaoQrKits">{pessoa.nome}</span>
                </div>
                <button type="button" class="botaoCancelarVerificacaoQrKits" onClick={onCancelar}>
                    Cancelar
                </button>
            </div>

            <div class="visorCameraVerificacaoQrKits">
                <video ref={videoRef} muted playsInline autoPlay class="videoCameraVerificacaoQrKits" />
                {!cameraOk && (
                    <div class="estadoCameraVerificacaoQrKits">
                        <span>Ativando câmera...</span>
                    </div>
                )}

                <div class="molduraMiraVerificacaoQrKits" aria-hidden="true">
                    <div class="miraVerificacaoQrKits" />
                </div>

                <div class="legendaVerificacaoQrKits" role="status">
                    {processandoLeituraKits ? (
                        <span class="textoConferindoVerificacaoQrKits">Conferindo...</span>
                    ) : erroLeituraKits ? (
                        <span class="textoErroVerificacaoQrKits">{erroLeituraKits}</span>
                    ) : (
                        <span>Aponte para o QR code do crachá da pessoa</span>
                    )}
                </div>
            </div>

            {justificandoSemQrKits ? (
                <form class="formularioSemQrKits" onSubmit={entregarSemQrKits}>
                    <label class="rotuloJustificativaSemQrKits" for="campoJustificativaSemQrKits">
                        Por que não foi possível ler o QR code?
                    </label>
                    <textarea
                        id="campoJustificativaSemQrKits"
                        class="campoJustificativaSemQrKits"
                        rows={3}
                        maxLength={LIMITE_JUSTIFICATIVA_SEM_QR_KITS}
                        placeholder="Ex.: esqueceu o crachá, conferi pelo documento"
                        value={justificativaSemQrKits}
                        onInput={e => setJustificativaSemQrKits(e.target.value)}
                        autoFocus
                    />
                    {erroSemQrKits && <p class="textoErroSemQrKits">{erroSemQrKits}</p>}
                    <div class="acoesSemQrKits">
                        <button type="button" class="botaoVoltarSemQrKits" onClick={voltarParaCameraKits} disabled={enviandoSemQrKits}>
                            Voltar
                        </button>
                        <button
                            type="submit"
                            class="botaoConfirmarSemQrKits"
                            disabled={enviandoSemQrKits || !justificativaSemQrKits.trim()}
                        >
                            {enviandoSemQrKits ? 'Salvando...' : 'Confirmar entrega'}
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    type="button"
                    class="botaoEntregarSemQrKits"
                    disabled={processandoLeituraKits}
                    onClick={() => setJustificandoSemQrKits(true)}
                >
                    Entregar sem ler QR code
                </button>
            )}
        </div>,
        document.body
    );
}

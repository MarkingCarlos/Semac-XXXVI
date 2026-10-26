import { useEffect, useState } from 'preact/hooks';
import QRCode from 'qrcode';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';
import { buscarMeuBrindeComissao } from '../data/apiBrindeComissao.js';

/* Cartão "Brinde da comissão" no Início do /admin: só no dia do brinde
   (o backend diz, em `disponivelHoje`). Abre o QR da pessoa — leitura
   única, lido por outra pessoa da comissão no /checkin ("Entregar brinde
   da comissão"). Com o modal aberto, consulta de novo a cada
   INTERVALO_BRINDE_COMISSAO_MS para trocar o QR por "retirado" assim que
   for lido. Fora do dia, ou se a consulta falhar, nada aparece. */

const INTERVALO_BRINDE_COMISSAO_MS = 4000;

function horaBrindeComissao(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function CardBrindeComissaoInicio() {
    const [brindeComissao, setBrindeComissao] = useState(null);
    const [modalBrindeAberto, setModalBrindeAberto] = useState(false);
    const [imagemQrBrinde, setImagemQrBrinde] = useState('');

    useEffect(() => {
        let ativo = true;
        const consultar = () => buscarMeuBrindeComissao()
            .then((dados) => { if (ativo && dados) setBrindeComissao(dados); })
            .catch(() => {});
        consultar();
        const intervalo = modalBrindeAberto ? setInterval(consultar, INTERVALO_BRINDE_COMISSAO_MS) : null;
        return () => {
            ativo = false;
            clearInterval(intervalo);
        };
    }, [modalBrindeAberto]);

    const qrCode = brindeComissao?.qrCode ?? null;
    useEffect(() => {
        if (!qrCode) {
            setImagemQrBrinde('');
            return;
        }
        QRCode.toDataURL(qrCode, { width: 520, margin: 1, errorCorrectionLevel: 'M' })
            .then(setImagemQrBrinde)
            .catch(() => setImagemQrBrinde(''));
    }, [qrCode]);

    if (!brindeComissao?.disponivelHoje) return null;

    const retirado = Boolean(brindeComissao.retiradoEm);
    const textoRetirada = retirado
        ? `Retirado às ${horaBrindeComissao(brindeComissao.retiradoEm)}`
            + (brindeComissao.entreguePorNome ? ` com ${brindeComissao.entreguePorNome.split(' ')[0]}` : '')
        : null;

    return (
        <>
            <button
                type="button"
                className={`cardDashboard cardBrindeComissaoInicio ${retirado ? 'cardBrindeRetiradoComissaoInicio' : ''}`}
                onClick={() => setModalBrindeAberto(true)}
            >
                <span className="tituloCardDashboard">Monster da comissão</span>
                <span className="subtituloCardDashboard">{retirado ? 'Já retirado' : 'Só hoje · leitura única'}</span>
                <span className="conteudoCardDashboard">
                    <span className="textoBrindeComissaoInicio">
                        {retirado ? textoRetirada : 'Toque para mostrar o seu QR para quem está entregando.'}
                    </span>
                </span>
            </button>

            {modalBrindeAberto && (
                <ModalInferiorAdmin
                    titulo="Brinde da comissão"
                    subtitulo={retirado ? 'Brinde já retirado' : 'Mostre este QR para quem está entregando'}
                    centralizadoNoDesktop
                    aoFechar={() => setModalBrindeAberto(false)}
                >
                    <div className="corpoModalBrindeComissaoInicio">
                        {retirado ? (
                            <p className="textoRetiradoModalBrindeComissaoInicio" role="status">
                                ✓ {textoRetirada}.
                            </p>
                        ) : imagemQrBrinde ? (
                            <>
                                <img
                                    className="imgQrModalBrindeComissaoInicio"
                                    src={imagemQrBrinde}
                                    alt="QR code do seu monster"
                                />
                                <p className="textoAvisoModalBrindeComissaoInicio">
                                    Vale uma vez só e apenas hoje. Quem entrega lê em /checkin → "Entregar brinde da comissão".
                                </p>
                            </>
                        ) : (
                            <p className="textoAvisoModalBrindeComissaoInicio">Gerando o QR…</p>
                        )}
                    </div>
                </ModalInferiorAdmin>
            )}
        </>
    );
}

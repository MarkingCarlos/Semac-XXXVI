import { useState } from 'preact/hooks';
import TelaSelecaoEventoCheckin from './TelaSelecaoEventoCheckin.jsx';
import TelaCameraCheckin from './TelaCameraCheckin.jsx';
import './ModalQrCode.css';

/* Ferramenta de check-in usada durante o evento: seleciona a palestra e
   lê o QR code do crachá dos participantes (uuid) pela câmera para
   marcar presença. Rota /checkin, restrita a quem tem acesso admin
   (ver RotaCheckin em main.jsx). */
const ModalQrCode = () => {
    const [eventoSelecionado, setEventoSelecionado] = useState(null);

    return (
        <div className="containerPrincipalCheckin">
            <div className="telaAppCheckin">
                <div className="cabecalhoAppCheckin">
                    <span className="tituloAppCheckin">SEMAC XXXVI</span>
                    <span className="subtituloAppCheckin">controle de presença</span>
                </div>

                <div className="corpoAppCheckin">
                    {eventoSelecionado ? (
                        <TelaCameraCheckin evento={eventoSelecionado} onVoltar={() => setEventoSelecionado(null)} />
                    ) : (
                        <TelaSelecaoEventoCheckin onIniciar={setEventoSelecionado} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalQrCode;

/* QR code real do crachá digital do participante — codifica o `uuid`
   pessoal (gerado na inscrição, ver InscricaoService no backend). É o
   mesmo uuid pra todos os eventos: a verificação de qual evento a
   pessoa está inscrita acontece no momento da leitura, não no código. */

import { useEffect, useState } from 'preact/hooks';
import QRCode from 'qrcode';

export default function QrCrachaParticipantes({ uuidParticipante, tamanho = 190 }) {
    const [urlImagemQrCrachaParticipantes, setUrlImagemQrCrachaParticipantes] = useState(null);

    useEffect(() => {
        if (!uuidParticipante) {
            setUrlImagemQrCrachaParticipantes(null);
            return;
        }

        let cancelado = false;
        QRCode.toDataURL(uuidParticipante, {
            width: tamanho * 2,
            margin: 1,
            color: { dark: '#730835', light: '#ffffff' },
        }).then((url) => {
            if (!cancelado) setUrlImagemQrCrachaParticipantes(url);
        });

        return () => {
            cancelado = true;
        };
    }, [uuidParticipante, tamanho]);

    return (
        <div className="molduraQrCrachaParticipantes">
            {urlImagemQrCrachaParticipantes ? (
                <img
                    src={urlImagemQrCrachaParticipantes}
                    width={tamanho}
                    height={tamanho}
                    alt="QR code do participante"
                />
            ) : (
                <div
                    className="espacoReservadoQrCrachaParticipantes"
                    style={{ width: tamanho, height: tamanho }}
                    role="img"
                    aria-label="QR code do participante indisponível"
                />
            )}
        </div>
    );
}

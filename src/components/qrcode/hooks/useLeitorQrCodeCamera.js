/* Liga a câmera traseira e decodifica QR codes continuamente a partir
   dos frames do vídeo, usando jsQR (única lib de LEITURA do projeto —
   'qrcode' só gera). Pensado para a tela de câmera do /checkin: fica
   ligado enquanto `ativo`, mas para de decodificar (sem soltar a
   câmera) enquanto `pausado`, para não disparar leituras atrás do
   modal de sucesso/erro. */

import { useEffect, useRef, useState } from 'preact/hooks';
import jsQR from 'jsqr';

export function useLeitorQrCodeCamera({ ativo, pausado, onLeitura }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const frameRef = useRef(null);
    const ultimoLidoRef = useRef(null);
    const pausadoRef = useRef(pausado);
    const onLeituraRef = useRef(onLeitura);
    const [cameraOk, setCameraOk] = useState(false);

    pausadoRef.current = pausado;
    onLeituraRef.current = onLeitura;

    useEffect(() => {
        if (!ativo) return;

        let cancelado = false;
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

        function decodificarFrame() {
            frameRef.current = requestAnimationFrame(decodificarFrame);
            if (pausadoRef.current) return;

            const video = videoRef.current;
            if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const contexto = canvas.getContext('2d', { willReadFrequently: true });
            contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imagem = contexto.getImageData(0, 0, canvas.width, canvas.height);
            const codigo = jsQR(imagem.data, imagem.width, imagem.height);

            if (codigo?.data && codigo.data !== ultimoLidoRef.current) {
                ultimoLidoRef.current = codigo.data;
                onLeituraRef.current(codigo.data);
            }
        }

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });
                if (cancelado) {
                    stream.getTracks().forEach((faixa) => faixa.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                setCameraOk(true);
                decodificarFrame();
            } catch {
                setCameraOk(false);
            }
        })();

        return () => {
            cancelado = true;
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((faixa) => faixa.stop());
                streamRef.current = null;
            }
            setCameraOk(false);
        };
    }, [ativo]);

    /* Permite ler o mesmo QR de novo (ex.: depois de fechar o modal de
       sucesso/erro daquela leitura). */
    function liberarUltimoLido() {
        ultimoLidoRef.current = null;
    }

    return { videoRef, cameraOk, liberarUltimoLido };
}

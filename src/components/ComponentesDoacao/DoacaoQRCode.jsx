import { useState, useRef } from "preact/hooks";
import qrCode from "/src/assets/qr.png";
import "./DoacaoQRCode.css";

const CHAVE_PIX = "semac@exemplo.com.br"; // substituir pela chave real

const DoacaoQRCode = () => {
    const [copiado, setCopiado] = useState(false);
    const [mostrarQR, setMostrarQR] = useState(false);
    const wrapperRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        wrapperRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        wrapperRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    const copiarChave = () => {
        navigator.clipboard.writeText(CHAVE_PIX).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
    };

    return (
        <div class="qr-wrapper" ref={wrapperRef} onMouseMove={handleMouseMove}>
            <div class="qr-card">
                <div class="qr-cabecalho">
                    <h2 class="qr-titulo">Faça uma Doação</h2>
                    <p class="qr-subtitulo qr-subtitulo--desktop">Escaneie o QR Code PIX</p>
                    <p class="qr-subtitulo qr-subtitulo--mobile">Copie a chave PIX abaixo</p>
                </div>

                <div class={`qr-imagem-container${mostrarQR ? " qr-imagem-container--visivel" : ""}`}>
                    <img src={qrCode} alt="QR Code PIX" class="qr-imagem" />
                </div>

                <div class="qr-chave-area">
                    <span class="qr-chave-label">Chave PIX</span>
                    <span class="qr-chave-valor">{CHAVE_PIX}</span>
                </div>

                <button class="qr-btn-copiar" onClick={copiarChave}>
                    {copiado ? "Copiado ✓" : "Copiar Chave PIX"}
                </button>

                <button class="qr-btn-toggle" onClick={() => setMostrarQR(!mostrarQR)}>
                    {mostrarQR ? "Ocultar QR Code" : "Ver QR Code"}
                </button>
            </div>
        </div>
    );
};

export default DoacaoQRCode;

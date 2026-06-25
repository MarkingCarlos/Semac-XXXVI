import { useState, useRef } from "preact/hooks";
import qrCode from "/src/assets/qr.png";
import "./DoacaoQRCode.css";

const CHAVE_PIX = "apoio@semac.cc";

const DoacaoQRCode = () => {
    const [copiado, setCopiado] = useState(false);
    const [mostrarQR, setMostrarQR] = useState(false);
    const wrapperRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!wrapperRef.current) return;
        const retanguloWrapper = wrapperRef.current.getBoundingClientRect();
        wrapperRef.current.style.setProperty('--mouse-x', `${e.clientX - retanguloWrapper.left}px`);
        wrapperRef.current.style.setProperty('--mouse-y', `${e.clientY - retanguloWrapper.top}px`);
    };

    const copiarChave = () => {
        navigator.clipboard.writeText(CHAVE_PIX).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
    };

    return (
        <div style={{zIndex: 1000}} >
        <div class="wrapperQrDoacao" ref={wrapperRef} onMouseMove={handleMouseMove}>
            <div class="cartaoQrDoacao">
                <div class="cabecalhoQrDoacao">
                    <h2 class="tituloQrDoacao">Faça uma Doação</h2>
                    <p class="subtituloQrDoacao subtituloQrDoacaoDesktop">Escaneie o QR Code PIX</p>
                    <p class="subtituloQrDoacao subtituloQrDoacaoMobile">Copie a chave PIX abaixo</p>
                </div>

                <div class={`conteinerImagemQrDoacao${mostrarQR ? " conteinerImagemQrDoacaoVisivel" : ""}`}>
                    <img src={qrCode} alt="QR Code PIX" class="imagemQrDoacao" />
                </div>

                <div class="areaChaveQrDoacao">
                    <span class="rotuloChaveQrDoacao">Chave PIX</span>
                    <span class="valorChaveQrDoacao">{CHAVE_PIX}</span>
                </div>

                <button class="botaoCopiarQrDoacao" onClick={copiarChave}>
                    {copiado ? "Copiado ✓" : "Copiar Chave PIX"}
                </button>

                <button class="botaoAlternarQrDoacao" onClick={() => setMostrarQR(!mostrarQR)}>
                    {mostrarQR ? "Ocultar QR Code" : "Ver QR Code"}
                </button>
            </div>
        </div>
        </div>

    );
};

export default DoacaoQRCode;

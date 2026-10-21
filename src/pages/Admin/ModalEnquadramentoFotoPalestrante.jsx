import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import {
    ENQUADRAMENTO_PADRAO_FOTO_PALESTRANTE,
    estiloEnquadramentoFoto,
    normalizarEnquadramentoFoto,
    ZOOM_MAXIMO_FOTO_PALESTRANTE,
    ZOOM_MINIMO_FOTO_PALESTRANTE,
} from '../Debate/enquadramentoFotoPalestrante.js';
import './modalEnquadramentoFotoPalestrante.css';

/* Ajuste do enquadramento da foto do palestrante na moldura do telão do
   debate (botão "Ajustar enquadramento" do formulário de evento, aba
   Conteúdo). Arrastar move a foto, a roda do mouse ou o controle dão zoom,
   as setas do teclado movem de 1 em 1%.

   Nada é gravado aqui: "Aplicar" devolve o enquadramento ao formulário, e
   ele vai para o banco junto com o "Salvar alterações" do evento.

   Modal próprio (e não o ModalTopoDashboard) porque o Esc precisa fechar
   só ele — o PainelLateral de trás também fecha com Esc. */

const arredondar = (valor) => Math.round(valor * 100) / 100;

export default function ModalEnquadramentoFotoPalestrante({ srcFoto, nomePalestrante, enquadramento, aoAplicar, aoFechar }) {
    const [ajuste, setAjuste] = useState(() => normalizarEnquadramentoFoto(enquadramento));
    const molduraRef = useRef(null);
    const imagemRef = useRef(null);
    const arrasteRef = useRef(null);

    useEffect(() => {
        // Captura: roda antes do Esc do PainelLateral e o impede de fechar também
        const aoTeclar = (e) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            aoFechar();
        };
        window.addEventListener('keydown', aoTeclar, true);
        return () => window.removeEventListener('keydown', aoTeclar, true);
    }, [aoFechar]);

    /* Quantos px de arraste correspondem a 100% de posição: a sobra da
       foto além da moldura (object-fit: cover) mais o que o zoom acrescenta. */
    const faixaArraste = (eixo) => {
        const moldura = molduraRef.current;
        const imagem = imagemRef.current;
        if (!moldura || !imagem?.naturalWidth) return 0;
        const lado = eixo === 'x' ? moldura.clientWidth : moldura.clientHeight;
        const cobertura = Math.max(moldura.clientWidth / imagem.naturalWidth, moldura.clientHeight / imagem.naturalHeight);
        const tamanhoFoto = (eixo === 'x' ? imagem.naturalWidth : imagem.naturalHeight) * cobertura;
        return (tamanhoFoto - lado) * ajuste.fotoZoom + (ajuste.fotoZoom - 1) * lado;
    };

    const moverFoto = (dx, dy) => {
        const faixaX = faixaArraste('x');
        const faixaY = faixaArraste('y');
        setAjuste((atual) => normalizarEnquadramentoFoto({
            ...atual,
            fotoPosX: faixaX > 0 ? atual.fotoPosX - (dx / faixaX) * 100 : atual.fotoPosX,
            fotoPosY: faixaY > 0 ? atual.fotoPosY - (dy / faixaY) * 100 : atual.fotoPosY,
        }));
    };

    const iniciarArraste = (e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        arrasteRef.current = { x: e.clientX, y: e.clientY };
    };

    const arrastar = (e) => {
        if (!arrasteRef.current) return;
        moverFoto(e.clientX - arrasteRef.current.x, e.clientY - arrasteRef.current.y);
        arrasteRef.current = { x: e.clientX, y: e.clientY };
    };

    const encerrarArraste = () => { arrasteRef.current = null; };

    const alterarZoom = (novoZoom) => {
        setAjuste((atual) => normalizarEnquadramentoFoto({ ...atual, fotoZoom: novoZoom }));
    };

    const rolarZoom = (e) => {
        e.preventDefault();
        alterarZoom(ajuste.fotoZoom - e.deltaY * 0.0015);
    };

    const teclaMoldura = (e) => {
        const passos = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const passo = passos[e.key];
        if (!passo) return;
        e.preventDefault();
        // Seta move o ponto em evidência, então a foto anda para o lado oposto
        setAjuste((atual) => normalizarEnquadramentoFoto({
            ...atual,
            fotoPosX: atual.fotoPosX + passo[0],
            fotoPosY: atual.fotoPosY + passo[1],
        }));
    };

    const aplicar = () => {
        aoAplicar({
            fotoPosX: arredondar(ajuste.fotoPosX),
            fotoPosY: arredondar(ajuste.fotoPosY),
            fotoZoom: arredondar(ajuste.fotoZoom),
        });
    };

    return createPortal(
        <div className="divSobreposicaoEnquadramentoFoto" onClick={aoFechar}>
            <div
                className="divPainelEnquadramentoFoto"
                role="dialog"
                aria-modal="true"
                aria-label={`Ajustar foto de ${nomePalestrante}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="h2TituloEnquadramentoFoto">Ajustar foto</h2>
                <p className="pSubtituloEnquadramentoFoto">
                    {nomePalestrante || 'Palestrante'} · arraste para posicionar, role para dar zoom
                </p>

                <div
                    ref={molduraRef}
                    className="divMolduraEnquadramentoFoto"
                    tabIndex={0}
                    aria-label="Área da foto: arraste ou use as setas para posicionar"
                    onPointerDown={iniciarArraste}
                    onPointerMove={arrastar}
                    onPointerUp={encerrarArraste}
                    onPointerCancel={encerrarArraste}
                    onWheel={rolarZoom}
                    onKeyDown={teclaMoldura}
                >
                    <img
                        ref={imagemRef}
                        className="imgFotoEnquadramentoFoto"
                        src={srcFoto}
                        alt=""
                        draggable={false}
                        style={estiloEnquadramentoFoto(ajuste)}
                    />
                </div>

                <label className="labelZoomEnquadramentoFoto">
                    <span className="spanRotuloZoomEnquadramentoFoto">Zoom</span>
                    <input
                        type="range"
                        className="inputZoomEnquadramentoFoto"
                        min={ZOOM_MINIMO_FOTO_PALESTRANTE}
                        max={ZOOM_MAXIMO_FOTO_PALESTRANTE}
                        step="0.01"
                        value={ajuste.fotoZoom}
                        onInput={(e) => alterarZoom(Number(e.currentTarget.value))}
                    />
                    <span className="spanValorZoomEnquadramentoFoto">{ajuste.fotoZoom.toFixed(2)}×</span>
                </label>

                <div className="divAcoesEnquadramentoFoto">
                    <button
                        type="button"
                        className="botaoFantasmaFinancas"
                        onClick={() => setAjuste(ENQUADRAMENTO_PADRAO_FOTO_PALESTRANTE)}
                    >
                        Centralizar
                    </button>
                    <span className="spanEspacoAcoesEnquadramentoFoto" />
                    <button type="button" className="botaoFantasmaFinancas" onClick={aoFechar}>
                        Cancelar
                    </button>
                    <button type="button" className="botaoPrimarioFinancas" onClick={aplicar}>
                        Aplicar
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

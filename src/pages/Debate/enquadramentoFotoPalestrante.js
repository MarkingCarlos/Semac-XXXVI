/* Enquadramento da foto do palestrante numa moldura (quadrada no telão do
   debate). A foto original não é recortada: guardamos o ponto da imagem
   que fica em evidência (fotoPosX/fotoPosY, em %) e o zoom (fotoZoom,
   1 a 3). A mesma regra de estilo vale no telão, na prévia do painel, na
   miniatura do formulário e no modal de ajuste — por isso o que se vê ao
   ajustar é o que vai para o telão.

   object-fit: cover garante que a foto sempre cobre a moldura; o zoom
   cresce a partir do mesmo ponto, então nunca sobra borda vazia.

   As imagens das conquistas usam o mesmo esquema com `ajuste` 'contain':
   a imagem inteira cabe na moldura (PNG de fundo transparente), e o zoom
   aproxima a partir do ponto escolhido. Lá o zoom também desce abaixo de
   1 (ZOOM_MINIMO_CONTAIN), para diminuir a imagem dentro da moldura. */

export const ZOOM_MINIMO_FOTO_PALESTRANTE = 1;
export const ZOOM_MAXIMO_FOTO_PALESTRANTE = 3;

/* Mesmo limite validado no backend (EnquadramentoImagemConquistaRequestDTO). */
export const ZOOM_MINIMO_CONTAIN = 0.3;

export const ENQUADRAMENTO_PADRAO_FOTO_PALESTRANTE = { fotoPosX: 50, fotoPosY: 50, fotoZoom: 1 };

const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));

export function zoomMinimoDoAjuste(ajuste) {
    return ajuste === 'contain' ? ZOOM_MINIMO_CONTAIN : ZOOM_MINIMO_FOTO_PALESTRANTE;
}

export function normalizarEnquadramentoFoto({ fotoPosX, fotoPosY, fotoZoom } = {}, zoomMinimo = ZOOM_MINIMO_FOTO_PALESTRANTE) {
    return {
        fotoPosX: limitar(Number(fotoPosX ?? 50), 0, 100),
        fotoPosY: limitar(Number(fotoPosY ?? 50), 0, 100),
        fotoZoom: limitar(Number(fotoZoom ?? 1), zoomMinimo, ZOOM_MAXIMO_FOTO_PALESTRANTE),
    };
}

export function estiloEnquadramentoFoto(palestrante, ajuste = 'cover') {
    const { fotoPosX, fotoPosY, fotoZoom } = normalizarEnquadramentoFoto(palestrante, zoomMinimoDoAjuste(ajuste));
    const ponto = `${fotoPosX}% ${fotoPosY}%`;
    return {
        objectFit: ajuste,
        objectPosition: ponto,
        transformOrigin: ponto,
        transform: `scale(${fotoZoom})`,
    };
}

// Monta os certificados de palestrante em PDF, no navegador, sobre o modelo
// em branco (public/certificado/modeloCertificado.pdf — a arte do Canva só
// com moldura, logos e assinaturas).
//
// O modelo entra uma vez só no arquivo (embedPdf) e é desenhado como fundo
// de cada página, então um PDF com todos os certificados fica com o tamanho
// do modelo + a fonte, não N vezes isso. O texto é vetorial, em Montserrat
// Regular 20 pt #242424, igual ao exemplo preenchido.
//
// As medidas em pt foram tiradas do exemplo preenchido: página de
// 843 × 596 pt (A4 deitado), 1ª linha do texto em y = 158 a partir do topo,
// 30 pt entre linhas, linhas centralizadas em ~620 pt de largura. As
// assinaturas começam em y = 385, então o texto não passa de 350.

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const URL_MODELO_CERTIFICADO = '/certificado/modeloCertificado.pdf';
const URL_FONTE_CERTIFICADO = '/certificado/Montserrat-Regular.ttf';

const TOPO_TEXTO_CERTIFICADO_PT = 158;
const LIMITE_INFERIOR_TEXTO_CERTIFICADO_PT = 350;
const LARGURA_MAXIMA_LINHA_CERTIFICADO_PT = 620;
const TAMANHO_FONTE_CERTIFICADO_PT = 20;
const TAMANHO_MINIMO_FONTE_CERTIFICADO_PT = 13;
const ALTURA_LINHA_POR_TAMANHO_FONTE = 1.5;
// Distância do topo da caixa da linha até a linha de base, em fração do
// tamanho da fonte (ascendente da Montserrat).
const ASCENDENTE_FONTE_CERTIFICADO = 0.8;
const COR_TEXTO_CERTIFICADO = rgb(0x24 / 255, 0x24 / 255, 0x24 / 255);

// Frase que vem antes do título, por tipo de evento (código do
// CodigoTipoEvento no back). Tipo fora da lista cai em FRASE_PADRAO.
const FRASE_POR_TIPO_EVENTO = {
    PALESTRA: 'ministrou a palestra intitulada',
    MINICURSO: 'ministrou o minicurso intitulado',
    MESA_REDONDA: 'participou da mesa redonda intitulada',
    DEBATE: 'participou do debate intitulado',
    MOSTRA_TECNICA: 'apresentou na mostra técnica o trabalho intitulado',
};
const FRASE_PADRAO_TIPO_EVENTO = 'ministrou a atividade intitulada';

const MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

// A API manda LocalDateTime sem fuso ("2026-10-21T14:00:00"); lê só a data
// para não depender do fuso do navegador.
function lerDataEvento(dataHora) {
    const [ano, mes, dia] = dataHora.slice(0, 10).split('-').map(Number);
    return { ano, mes, dia };
}

// "em 21 de outubro de 2026"; evento de vários dias vira
// "de 19 a 21 de outubro de 2026" (ou "de 30 de setembro a 2 de outubro").
export function textoDataCertificado(dataHoraInicio, dataHoraFim) {
    const inicio = lerDataEvento(dataHoraInicio);
    const fim = dataHoraFim ? lerDataEvento(dataHoraFim) : inicio;
    const mesInicio = MESES[inicio.mes - 1];
    const mesFim = MESES[fim.mes - 1];

    if (inicio.ano === fim.ano && inicio.mes === fim.mes && inicio.dia === fim.dia) {
        return `em ${inicio.dia} de ${mesInicio} de ${inicio.ano}`;
    }
    if (inicio.ano === fim.ano && inicio.mes === fim.mes) {
        return `de ${inicio.dia} a ${fim.dia} de ${mesFim} de ${fim.ano}`;
    }
    if (inicio.ano === fim.ano) {
        return `de ${inicio.dia} de ${mesInicio} a ${fim.dia} de ${mesFim} de ${fim.ano}`;
    }
    return `de ${inicio.dia} de ${mesInicio} de ${inicio.ano} a ${fim.dia} de ${mesFim} de ${fim.ano}`;
}

// Dois parágrafos, como no modelo: a 1ª linha termina no nome e o resto
// quebra naturalmente.
function paragrafosCertificado(certificado) {
    const frase = FRASE_POR_TIPO_EVENTO[certificado.codigoTipoEvento] ?? FRASE_PADRAO_TIPO_EVENTO;
    const data = textoDataCertificado(certificado.dataHoraInicio, certificado.dataHoraFim);
    return [
        `Certificamos para os devidos fins que ${certificado.nomePalestrante.trim()}`,
        `${frase} "${certificado.nomeEvento.trim()}" na XXXVI SEMAC - Semana da Computação `
            + `da UNESP de São José do Rio Preto, ${data}.`,
    ];
}

function quebrarEmLinhas(paragrafo, fonte, tamanhoFonte) {
    const linhas = [];
    let linhaAtual = '';
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
        const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
        if (linhaAtual && fonte.widthOfTextAtSize(tentativa, tamanhoFonte) > LARGURA_MAXIMA_LINHA_CERTIFICADO_PT) {
            linhas.push(linhaAtual);
            linhaAtual = palavra;
        } else {
            linhaAtual = tentativa;
        }
    }
    if (linhaAtual) linhas.push(linhaAtual);
    return linhas;
}

// Começa no tamanho do modelo e só diminui se um título muito longo fizer o
// texto encostar nas assinaturas.
function diagramarTextoCertificado(paragrafos, fonte) {
    for (let tamanhoFonte = TAMANHO_FONTE_CERTIFICADO_PT; ; tamanhoFonte -= 1) {
        const linhas = paragrafos.flatMap((paragrafo) => quebrarEmLinhas(paragrafo, fonte, tamanhoFonte));
        const alturaLinha = tamanhoFonte * ALTURA_LINHA_POR_TAMANHO_FONTE;
        const alturaTexto = (linhas.length - 1) * alturaLinha + tamanhoFonte;
        const cabe = TOPO_TEXTO_CERTIFICADO_PT + alturaTexto <= LIMITE_INFERIOR_TEXTO_CERTIFICADO_PT;
        if (cabe || tamanhoFonte <= TAMANHO_MINIMO_FONTE_CERTIFICADO_PT) {
            return { linhas, tamanhoFonte, alturaLinha };
        }
    }
}

let recursosCertificadoPromessa = null;
function carregarRecursosCertificado() {
    recursosCertificadoPromessa ??= Promise.all(
        [URL_MODELO_CERTIFICADO, URL_FONTE_CERTIFICADO].map(async (url) => {
            const resposta = await fetch(url);
            if (!resposta.ok) throw new Error('Não foi possível carregar o modelo do certificado.');
            return resposta.arrayBuffer();
        }),
    ).catch((erro) => {
        recursosCertificadoPromessa = null;
        throw erro;
    });
    return recursosCertificadoPromessa;
}

// Um PDF com uma página A4 por certificado, na ordem recebida.
export async function gerarPdfCertificados(certificados) {
    const [bytesModelo, bytesFonte] = await carregarRecursosCertificado();
    const documento = await PDFDocument.create();
    documento.registerFontkit(fontkit);
    documento.setTitle(
        certificados.length === 1
            ? `Certificado - ${certificados[0].nomePalestrante}`
            : 'Certificados de palestrantes - XXXVI SEMAC',
    );

    const [paginaModelo] = await documento.embedPdf(bytesModelo, [0]);
    // subset: false — o subset da fontkit às vezes troca glifos acentuados.
    const fonte = await documento.embedFont(bytesFonte, { subset: false });

    for (const certificado of certificados) {
        const pagina = documento.addPage([paginaModelo.width, paginaModelo.height]);
        pagina.drawPage(paginaModelo);

        const { linhas, tamanhoFonte, alturaLinha } = diagramarTextoCertificado(paragrafosCertificado(certificado), fonte);
        linhas.forEach((linha, indice) => {
            const larguraLinha = fonte.widthOfTextAtSize(linha, tamanhoFonte);
            const topoLinha = TOPO_TEXTO_CERTIFICADO_PT + indice * alturaLinha;
            pagina.drawText(linha, {
                x: (pagina.getWidth() - larguraLinha) / 2,
                y: pagina.getHeight() - topoLinha - tamanhoFonte * ASCENDENTE_FONTE_CERTIFICADO,
                size: tamanhoFonte,
                font: fonte,
                color: COR_TEXTO_CERTIFICADO,
            });
        });
    }

    return new Blob([await documento.save()], { type: 'application/pdf' });
}

export function nomeArquivoCertificado(certificado) {
    const nomeSeguro = (texto) => texto.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim();
    return `Certificado - ${nomeSeguro(certificado.nomePalestrante)} - ${nomeSeguro(certificado.nomeEvento)}.pdf`;
}

export function baixarArquivo(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

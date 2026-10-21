// Um crachá impresso de 60 × 91,09 mm (1,2× a arte original de
// 50 × 75,91 mm). Dois modelos:
//
// - Participante: a arte limpa de fundo, o nome em duas linhas (Anton) no
//   quadro cinza e, embaixo, o QR de check-in (o mesmo uuid do crachá
//   digital — ver QrCrachaParticipantes.jsx).
// - Comissão e palestrante: a arte da equipe (quadro cinza mais baixo), o
//   nome em duas linhas (Bungee) e, embaixo, o rótulo "COMISSÃO" ou
//   "PALESTRANTE" em vinho. Sem QR.
//
// As posições em mm foram medidas nas artes (public/cracha/): o quadro
// cinza vai de ~16% a ~84% da largura e o raio do canto superior direito
// invade o quadro, por isso o texto fica centralizado numa faixa mais
// estreita.

import './crachaImpresso.css';

const LARGURA_TEXTO_CRACHA_MM = 30.54;
const TAMANHO_MAXIMO_FONTE_NOME_MM = 5.46;
const TAMANHO_MAXIMO_FONTE_NOME_EQUIPE_MM = 5.7;
const TAMANHO_MAXIMO_FONTE_ROTULO_EQUIPE_MM = 6;

const ROTULO_PERFIL_CRACHA_EQUIPE = {
    COMISSAO: 'COMISSÃO',
    PALESTRANTE: 'PALESTRANTE',
};

// Partículas que não contam como "segundo nome": "Maria de Souza" vira
// MARIA / SOUZA, não MARIA / DE.
const PARTICULAS_NOME = ['de', 'da', 'do', 'das', 'dos', 'e', 'd'];

export function linhasNomeCracha(nomeCompleto) {
    const palavras = (nomeCompleto ?? '').trim().split(/\s+/).filter(Boolean);
    const primeiroNome = palavras[0] ?? '';
    const segundoNome = palavras.slice(1).find((palavra) => !PARTICULAS_NOME.includes(palavra.toLowerCase())) ?? '';
    return [primeiroNome, segundoNome]
        .filter(Boolean)
        .map((palavra) => palavra.toLocaleUpperCase('pt-BR'));
}

// Mede o texto num canvas e devolve o maior tamanho de fonte (mm) em que a
// linha mais larga ainda cabe na faixa de texto. Precisa da fonte já
// carregada (Crachas.jsx espera document.fonts antes de renderizar).
let contextoMedidaTextoCracha = null;
function tamanhoFonteTextoCrachaMm(linhas, familiaFonte, tamanhoMaximoMm) {
    contextoMedidaTextoCracha ??= document.createElement('canvas').getContext('2d');
    contextoMedidaTextoCracha.font = `100px ${familiaFonte}`;
    const larguraMaiorLinhaEm100px = Math.max(
        1,
        ...linhas.map((linha) => contextoMedidaTextoCracha.measureText(linha).width),
    );
    return Math.min(tamanhoMaximoMm, (LARGURA_TEXTO_CRACHA_MM * 100) / larguraMaiorLinhaEm100px);
}

function CrachaEquipeImpresso({ pessoa }) {
    const linhasNome = linhasNomeCracha(pessoa.nome);
    const rotuloPerfil = ROTULO_PERFIL_CRACHA_EQUIPE[pessoa.perfil];
    const tamanhoFonteNomeMm = tamanhoFonteTextoCrachaMm(linhasNome, 'Bungee', TAMANHO_MAXIMO_FONTE_NOME_EQUIPE_MM);
    const tamanhoFonteRotuloMm = tamanhoFonteTextoCrachaMm([rotuloPerfil], 'Bungee', TAMANHO_MAXIMO_FONTE_ROTULO_EQUIPE_MM);

    return (
        <div class="cartaoCrachaImpresso">
            <img class="imgFundoCrachaImpresso" src="/cracha/fundoCrachaComissao.jpg" alt="" />

            <div class="divNomeCrachaEquipeImpresso" style={{ fontSize: `${tamanhoFonteNomeMm}mm` }}>
                {linhasNome.map((linha) => (
                    <span key={linha} class="spanLinhaNomeCrachaImpresso">{linha}</span>
                ))}
            </div>

            <div class="divRotuloPerfilCrachaEquipeImpresso" style={{ fontSize: `${tamanhoFonteRotuloMm}mm` }}>
                {rotuloPerfil}
            </div>
        </div>
    );
}

export default function CrachaImpresso({ pessoa, svgQrCode }) {
    if (ROTULO_PERFIL_CRACHA_EQUIPE[pessoa.perfil]) return <CrachaEquipeImpresso pessoa={pessoa} />;

    const linhasNome = linhasNomeCracha(pessoa.nome);
    const tamanhoFonteMm = tamanhoFonteTextoCrachaMm(linhasNome, 'Anton', TAMANHO_MAXIMO_FONTE_NOME_MM);

    return (
        <div class="cartaoCrachaImpresso">
            <img class="imgFundoCrachaImpresso" src="/cracha/fundoCracha.jpg" alt="" />

            <div class="divNomeCrachaImpresso" style={{ fontSize: `${tamanhoFonteMm}mm` }}>
                {linhasNome.map((linha) => (
                    <span key={linha} class="spanLinhaNomeCrachaImpresso">{linha}</span>
                ))}
            </div>

            {svgQrCode && (
                <div
                    class="divQrCodeCrachaImpresso"
                    // SVG gerado localmente pela lib `qrcode` a partir do uuid.
                    dangerouslySetInnerHTML={{ __html: svgQrCode }}
                />
            )}
        </div>
    );
}

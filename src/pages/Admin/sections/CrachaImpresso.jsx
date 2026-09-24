// Um crachá impresso de 55 × 83,5 mm: a arte limpa de fundo, o nome em
// duas linhas no quadro cinza e, embaixo, o QR de check-in (o mesmo uuid
// do crachá digital — ver QrCrachaParticipantes.jsx). Palestrante não tem
// uuid, então no lugar do QR vai o texto "PALESTRANTE".
//
// As posições em mm foram medidas na arte (public/cracha/fundoCracha.jpg):
// o quadro cinza vai de ~16% a ~84% da largura e o raio do canto superior
// direito invade o quadro até ~40% da altura, por isso o nome fica
// centralizado numa faixa mais estreita.

import './crachaImpresso.css';

const LARGURA_NOME_CRACHA_MM = 28;
const TAMANHO_MAXIMO_FONTE_NOME_MM = 5;

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

// Mede o texto em Anton num canvas e devolve o maior tamanho de fonte (mm)
// em que a linha mais larga ainda cabe na faixa do nome. Precisa da fonte
// já carregada (Crachas.jsx espera document.fonts antes de renderizar).
let contextoMedidaNomeCracha = null;
function tamanhoFonteNomeCrachaMm(linhas) {
    contextoMedidaNomeCracha ??= document.createElement('canvas').getContext('2d');
    contextoMedidaNomeCracha.font = '100px Anton';
    const larguraMaiorLinhaEm100px = Math.max(
        1,
        ...linhas.map((linha) => contextoMedidaNomeCracha.measureText(linha).width),
    );
    return Math.min(TAMANHO_MAXIMO_FONTE_NOME_MM, (LARGURA_NOME_CRACHA_MM * 100) / larguraMaiorLinhaEm100px);
}

export default function CrachaImpresso({ pessoa, svgQrCode }) {
    const linhasNome = linhasNomeCracha(pessoa.nome);
    const tamanhoFonteMm = tamanhoFonteNomeCrachaMm(linhasNome);

    return (
        <div class="cartaoCrachaImpresso">
            <img class="imgFundoCrachaImpresso" src="/cracha/fundoCracha.jpg" alt="" />

            <div class="divNomeCrachaImpresso" style={{ fontSize: `${tamanhoFonteMm}mm` }}>
                {linhasNome.map((linha) => (
                    <span key={linha} class="spanLinhaNomeCrachaImpresso">{linha}</span>
                ))}
            </div>

            {pessoa.perfil === 'PALESTRANTE' ? (
                <div class="divRotuloPalestranteCrachaImpresso">PALESTRANTE</div>
            ) : svgQrCode ? (
                <div
                    class="divQrCodeCrachaImpresso"
                    // SVG gerado localmente pela lib `qrcode` a partir do uuid.
                    dangerouslySetInnerHTML={{ __html: svgQrCode }}
                />
            ) : null}
        </div>
    );
}

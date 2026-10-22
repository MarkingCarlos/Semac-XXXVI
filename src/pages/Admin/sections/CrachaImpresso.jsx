// Um crachá impresso de 60 × 91,09 mm (1,2× a arte original de
// 50 × 75,91 mm). Três modelos:
//
// - Participante: a arte limpa de fundo, o nome em duas linhas (Anton) no
//   quadro cinza e, embaixo, o QR de check-in (o mesmo uuid do crachá
//   digital — ver QrCrachaParticipantes.jsx).
// - Comissão e palestrante: a arte da equipe (quadro cinza mais baixo), o
//   nome em duas linhas (Bungee) e, embaixo, o rótulo "COMISSÃO" ou
//   "PALESTRANTE" em vinho. Sem QR.
// - Professor convidado: a arte do professor (quadro cinza maior, sem
//   rótulo) e o nome em até três linhas (Bungee). Sem QR.
//
// As posições em mm foram medidas nas artes (public/cracha/): o quadro
// cinza vai de ~16% a ~84% da largura e o raio do canto superior direito
// invade o quadro, por isso o texto fica centralizado numa faixa mais
// estreita.

import './crachaImpresso.css';

const LARGURA_TEXTO_CRACHA_MM = 30.54;
// Na altura do nome o cinza da arte do professor fica livre de 10,5 a
// 48,3 mm (o raio só invade acima); 33 mm deixam ~2,5 mm de folga de cada lado.
const LARGURA_TEXTO_CRACHA_PROFESSOR_MM = 33;
const TAMANHO_MAXIMO_FONTE_NOME_MM = 5.46;
const TAMANHO_MAXIMO_FONTE_NOME_EQUIPE_MM = 5.7;
const TAMANHO_MAXIMO_FONTE_ROTULO_EQUIPE_MM = 6;
const TAMANHO_MAXIMO_FONTE_NOME_PROFESSOR_MM = 5.8;

const ROTULO_PERFIL_CRACHA_EQUIPE = {
    COMISSAO: 'COMISSÃO',
    PALESTRANTE: 'PALESTRANTE',
};

// Partículas que não contam como nome: "Maria de Souza" vira
// MARIA / SOUZA, não MARIA / DE.
const PARTICULAS_NOME = ['de', 'da', 'do', 'das', 'dos', 'e', 'd'];

export function linhasNomeCracha(nomeCompleto, quantidadeNomes = 2) {
    const palavras = (nomeCompleto ?? '').trim().split(/\s+/).filter(Boolean);
    const primeiroNome = palavras[0] ?? '';
    const demaisNomes = palavras
        .slice(1)
        .filter((palavra) => !PARTICULAS_NOME.includes(palavra.toLowerCase()))
        .slice(0, quantidadeNomes - 1);
    return [primeiroNome, ...demaisNomes]
        .filter(Boolean)
        .map((palavra) => palavra.toLocaleUpperCase('pt-BR'));
}

// Mede o texto num canvas e devolve o maior tamanho de fonte (mm) em que a
// linha mais larga ainda cabe na faixa de texto. Precisa da fonte já
// carregada (Crachas.jsx espera document.fonts antes de renderizar).
let contextoMedidaTextoCracha = null;
function tamanhoFonteTextoCrachaMm(linhas, familiaFonte, tamanhoMaximoMm, larguraTextoMm = LARGURA_TEXTO_CRACHA_MM) {
    contextoMedidaTextoCracha ??= document.createElement('canvas').getContext('2d');
    contextoMedidaTextoCracha.font = `100px ${familiaFonte}`;
    const larguraMaiorLinhaEm100px = Math.max(
        1,
        ...linhas.map((linha) => contextoMedidaTextoCracha.measureText(linha).width),
    );
    return Math.min(tamanhoMaximoMm, (larguraTextoMm * 100) / larguraMaiorLinhaEm100px);
}

function CrachaProfessorImpresso({ pessoa }) {
    const linhasNome = linhasNomeCracha(pessoa.nome, 3);
    const tamanhoFonteNomeMm = tamanhoFonteTextoCrachaMm(
        linhasNome,
        'Bungee',
        TAMANHO_MAXIMO_FONTE_NOME_PROFESSOR_MM,
        LARGURA_TEXTO_CRACHA_PROFESSOR_MM,
    );

    return (
        <div class="cartaoCrachaImpresso">
            <img class="imgFundoCrachaImpresso" src="/cracha/fundoCrachaProfessor.jpg" alt="" />

            <div class="divNomeCrachaProfessorImpresso" style={{ fontSize: `${tamanhoFonteNomeMm}mm` }}>
                {linhasNome.map((linha, indice) => (
                    <span key={indice} class="spanLinhaNomeCrachaImpresso">{linha}</span>
                ))}
            </div>
        </div>
    );
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
    if (pessoa.perfil === 'PROFESSOR') return <CrachaProfessorImpresso pessoa={pessoa} />;
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

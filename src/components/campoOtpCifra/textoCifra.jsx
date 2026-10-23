/* Desenha texto da cifra com os números pequenos (¹ ² … ⁹) num tamanho só.

   ¹ ² ³ moram num bloco do Unicode e ⁴ a ⁹ em outro; a Bungee só tem
   desenho para os três primeiros, e o resto cai numa fonte do sistema, com
   outro tamanho. Aqui cada sobrescrito vira o algarismo comum da própria
   fonte, encolhido e elevado pelo CSS — o texto continua o mesmo, só a
   exibição muda. */

const ALGARISMO_DO_SOBRESCRITO_CIFRA = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
};

export default function TextoCifra({ texto }) {
    return Array.from(texto ?? '').map((caracter, indice) => {
        const algarismo = ALGARISMO_DO_SOBRESCRITO_CIFRA[caracter];
        return algarismo
            ? <span key={indice} className="spanSobrescritoTextoCifra" aria-label={caracter}>{algarismo}</span>
            : caracter;
    });
}

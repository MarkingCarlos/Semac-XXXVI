import { formatarCentavos, somenteDigitos } from '../utils/moeda.js';

/* Input com máscara de valor em real (R$ 1.234,56).
   Recebe e devolve o valor em CENTAVOS — a máscara é só apresentação.
   `classeExtra` permite variantes compactas (ex.: edição inline no card
   do Resumo); `aoTeclar` habilita atalhos como Enter/Esc. */
export default function CampoMoeda({
    id,
    valorCentavos,
    aoMudar,
    desabilitado = false,
    classeExtra = '',
    aoTeclar,
    rotuloAcessivel,
    autoFoco = false,
}) {
    const aoDigitar = (evento) => {
        const digitos = somenteDigitos(evento.currentTarget.value).slice(0, 12);
        aoMudar(digitos ? parseInt(digitos, 10) : 0);
    };

    return (
        <input
            id={id}
            className={`entradaFormularioFinancas entradaMoedaFinancas${classeExtra ? ` ${classeExtra}` : ''}`}
            inputMode="numeric"
            autoComplete="off"
            autofocus={autoFoco}
            aria-label={rotuloAcessivel}
            disabled={desabilitado}
            value={formatarCentavos(valorCentavos)}
            onInput={aoDigitar}
            onKeyDown={aoTeclar}
        />
    );
}

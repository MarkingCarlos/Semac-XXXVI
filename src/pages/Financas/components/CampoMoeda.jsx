import { formatarCentavos, somenteDigitos } from '../utils/moeda.js';

/* Input com máscara de valor em real (R$ 1.234,56).
   Recebe e devolve o valor em CENTAVOS — a máscara é só apresentação. */
export default function CampoMoeda({ id, valorCentavos, aoMudar, desabilitado = false }) {
    const aoDigitar = (evento) => {
        const digitos = somenteDigitos(evento.currentTarget.value).slice(0, 12);
        aoMudar(digitos ? parseInt(digitos, 10) : 0);
    };

    return (
        <input
            id={id}
            className="entradaFormularioFinancas entradaMoedaFinancas"
            inputMode="numeric"
            autoComplete="off"
            disabled={desabilitado}
            value={formatarCentavos(valorCentavos)}
            onInput={aoDigitar}
        />
    );
}

import { useRef, useState } from 'preact/hooks';
import TextoCifra from './textoCifra.jsx';
import './campoOtpCifra.css';

/* Campo de resposta em casas da Cifra do Dia, no estilo do Input OTP do
   animate-ui (animate-ui.com/docs/primitives/animate-ui/input-otp) e com o
   visual de "cofre" do design da SEMAC.

   Por trás das casas há um único <input> transparente, que é quem recebe
   o teclado: assim funcionam o teclado do celular, o colar a palavra
   inteira e o apagar, sem gerenciar foco casa a casa. As casas só
   desenham o valor.

   `grupos` divide as casas em blocos ([4, 4, 7] = MAKE · THEM · BELIEVE).

   O teclado numérico digita os números pequenos (¹ ² … ⁹), que a cifra de
   segunda usa como símbolos próprios e o teclado do celular não tem. Só
   aparece quando a etapa precisa deles (`mostrarTeclado`).

   `progressoDecifrando` (0 a 100) liga a animação de envio: as casas ainda
   não alcançadas embaralham e as alcançadas travam da esquerda para a
   direita. `decifrado` trava todas. */

const CARACTER_ACEITO_CAMPO_OTP_CIFRA = /[A-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹]/;

/* Quantas casas cabem numa linha do celular. A casa é dimensionada para
   esse número; bloco maior (a senha parcial de segunda tem 13) quebra
   linha em vez de vazar da tela. */
const CASAS_POR_LINHA_CAMPO_OTP_CIFRA = 9;

/* A cifra de segunda usa os ciclos do alfabeto SEMAC26, que não passam do
   ³ — mas a tabela MAIRA chega ao ⁹, e o teclado serve às duas. */
const SOBRESCRITOS_CAMPO_OTP_CIFRA = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

/* De onde saem os caracteres que piscam nas casas durante a animação. */
const EMBARALHAMENTO_CAMPO_OTP_CIFRA = '0123456789ABCDEF#%&$@';

/* Sem acento e em maiúsculas, sem nada que não seja casa. A normalização
   é NFD, e não NFKD, para "²" não virar "2". */
const limparValorCampoOtpCifra = (texto, total) =>
    Array.from(texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase())
        .filter((caracter) => CARACTER_ACEITO_CAMPO_OTP_CIFRA.test(caracter))
        .slice(0, total)
        .join('');

const caracterAleatorioCampoOtpCifra = () =>
    EMBARALHAMENTO_CAMPO_OTP_CIFRA.charAt(Math.floor(Math.random() * EMBARALHAMENTO_CAMPO_OTP_CIFRA.length));

export default function CampoOtpCifra({
    grupos,
    valor,
    onMudar,
    desabilitado = false,
    tremendo = false,
    rotulo,
    mostrarTeclado = false,
    progressoDecifrando = null,
    decifrado = false,
}) {
    const inputCampoOtpCifraRef = useRef(null);
    const [focadoCampoOtpCifra, setFocadoCampoOtpCifra] = useState(false);

    const totalCasas = grupos.reduce((soma, tamanho) => soma + tamanho, 0);
    const caracteres = Array.from(valor);
    const decifrando = progressoDecifrando !== null;
    const bloqueado = desabilitado || decifrando || decifrado;
    const casasTravadas = decifrado ? totalCasas
        : decifrando ? Math.floor((progressoDecifrando / 100) * totalCasas) : 0;

    const aoDigitar = (evento) => {
        const novo = limparValorCampoOtpCifra(evento.currentTarget.value, totalCasas);
        /* O input é controlado: se o filtro recusou o que foi digitado, o
           valor dele precisa voltar ao que a tela mostra. */
        evento.currentTarget.value = novo;
        onMudar(novo);
    };

    const inserirSobrescrito = (sobrescrito) => {
        if (bloqueado || caracteres.length >= totalCasas) return;
        onMudar(valor + sobrescrito);
        inputCampoOtpCifraRef.current?.focus();
    };

    const apagarUltimo = () => {
        if (bloqueado || caracteres.length === 0) return;
        onMudar(caracteres.slice(0, -1).join(''));
        inputCampoOtpCifraRef.current?.focus();
    };

    /* O cursor mora sempre no fim, como no input-otp: setas e cliques no
       meio não fazem sentido quando as casas são preenchidas em ordem. */
    const manterCursorNoFim = (evento) => {
        const campo = evento.currentTarget;
        const fim = campo.value.length;
        if (campo.selectionStart !== fim || campo.selectionEnd !== fim) {
            campo.setSelectionRange(fim, fim);
        }
    };

    let indiceCasa = 0;
    const blocos = grupos.map((tamanho, indiceGrupo) => {
        const casas = [];
        for (let i = 0; i < tamanho; i++, indiceCasa++) {
            let caracter = caracteres[indiceCasa] ?? '';
            const classes = ['divCasaCampoOtpCifra'];
            let embaralhada = false;
            let ativa = false;

            if (indiceCasa < casasTravadas) {
                classes.push('casaTravadaCampoOtpCifra');
            } else if (decifrando) {
                caracter = caracterAleatorioCampoOtpCifra();
                embaralhada = true;
                classes.push('casaEmbaralhadaCampoOtpCifra');
            } else if (caracter) {
                classes.push('casaPreenchidaCampoOtpCifra');
            } else if (indiceCasa === caracteres.length && !desabilitado) {
                ativa = true;
                classes.push('casaAtivaCampoOtpCifra');
                if (focadoCampoOtpCifra) classes.push('casaFocadaCampoOtpCifra');
            }

            casas.push(
                <div key={indiceCasa} className={classes.join(' ')}>
                    {/* A chave muda com o caracter: é o que reinicia a
                        animação de entrada a cada letra digitada. O
                        embaralhado troca a cada quadro e fica sem ela. */}
                    {caracter && (
                        <span
                            key={`${indiceCasa}-${caracter}`}
                            className={embaralhada ? undefined : 'spanCaracterCampoOtpCifra'}
                        >
                            <TextoCifra texto={caracter} />
                        </span>
                    )}
                    {ativa && <span className="spanCursorCampoOtpCifra" aria-hidden="true">_</span>}
                </div>,
            );
        }
        return (
            <div key={indiceGrupo} className="divGrupoCampoOtpCifra">
                {casas}
            </div>
        );
    });

    return (
        <div className="divEnvoltorioCampoOtpCifra">
            <div
                className={`divCampoOtpCifra ${tremendo ? 'campoTremendoCampoOtpCifra' : ''}`}
                style={{ '--casasLinhaCampoOtpCifra': String(CASAS_POR_LINHA_CAMPO_OTP_CIFRA) }}
                onClick={() => inputCampoOtpCifraRef.current?.focus()}
            >
                <div className="divBlocosCampoOtpCifra" aria-hidden="true">{blocos}</div>
                <input
                    ref={inputCampoOtpCifraRef}
                    className="inputOcultoCampoOtpCifra"
                    value={valor}
                    onInput={aoDigitar}
                    onSelect={manterCursorNoFim}
                    onFocus={() => setFocadoCampoOtpCifra(true)}
                    onBlur={() => setFocadoCampoOtpCifra(false)}
                    disabled={bloqueado}
                    maxLength={totalCasas}
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellcheck={false}
                    inputMode="text"
                    aria-label={rotulo ?? `Resposta com ${totalCasas} caracteres`}
                />
            </div>

            {/* O preventDefault no pointerdown não deixa a tecla roubar o
                foco do input — sem ele o teclado do celular fecharia a
                cada toque. */}
            {mostrarTeclado && (
                <div className="divTecladoCampoOtpCifra" role="group" aria-label="Números pequenos">
                    {SOBRESCRITOS_CAMPO_OTP_CIFRA.map((sobrescrito, indice) => (
                        <button
                            key={sobrescrito}
                            type="button"
                            className="botaoTeclaCampoOtpCifra"
                            disabled={bloqueado || caracteres.length >= totalCasas}
                            onPointerDown={(evento) => evento.preventDefault()}
                            onClick={() => inserirSobrescrito(sobrescrito)}
                            aria-label={`Digitar número pequeno ${indice + 1}`}
                        >
                            <TextoCifra texto={sobrescrito} />
                        </button>
                    ))}
                    <button
                        type="button"
                        className="botaoTeclaCampoOtpCifra botaoApagarCampoOtpCifra"
                        disabled={bloqueado || caracteres.length === 0}
                        onPointerDown={(evento) => evento.preventDefault()}
                        onClick={apagarUltimo}
                        aria-label="Apagar"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
                            <path d="M17 9l-6 6M11 9l6 6" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

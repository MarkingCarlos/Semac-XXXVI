import { useEffect, useRef, useState } from "preact/hooks";
import { createPortal } from "preact/compat";
import { lerSessao, temSessaoValida, temAcessoParticipante } from "../../auth/sessao.js";
import { enviarPerguntaPublica } from "../../pages/Perguntas/apiPerguntas.js";
import "./modalPerguntaDebateCronograma.css";

/* Envio de pergunta para um debate direto da programação, aberto pelo
   botão "Mande sua pergunta" do card de destaque — sem sair da página.
   Mesmas regras da página /perguntas: com login vai o nome da conta (e o
   participante ganha a conquista na primeira); sem login, o nome digitado
   ou anônimo.

   Desktop: centralizado, 50% x 50% da tela. Mobile: sobe de baixo. Pode
   abrir por cima do sheet do cronograma (mobile), então:
   - o Esc é capturado antes e fecha só este modal;
   - o Lenis e o overflow do body só voltam ao fechar se não estavam
     travados antes (o sheet de baixo continua travando). */

/* Mesmos limites validados no backend (PerguntaRequestDTO). */
const LIMITE_CARACTERES_PERGUNTA_CRONOGRAMA = 500;
const LIMITE_CARACTERES_NOME_PERGUNTA_CRONOGRAMA = 120;

// Mesma duração da animação de saída no CSS
const DURACAO_SAIDA_MODAL_PERGUNTA_CRONOGRAMA_MS = 260;

export default function ModalPerguntaDebateCronograma({ evento, aoFechar }) {
  const logadoPerguntaCronograma = temSessaoValida() && !!lerSessao()?.nome;
  const nomeContaPerguntaCronograma = logadoPerguntaCronograma ? lerSessao().nome : "";
  const participantePerguntaCronograma = temAcessoParticipante();

  const [saindoModalPerguntaCronograma, setSaindoModalPerguntaCronograma] = useState(false);
  const [textoPerguntaCronograma, setTextoPerguntaCronograma] = useState("");
  const [nomeAutorPerguntaCronograma, setNomeAutorPerguntaCronograma] = useState("");
  const [enviandoPerguntaCronograma, setEnviandoPerguntaCronograma] = useState(false);
  const [erroPerguntaCronograma, setErroPerguntaCronograma] = useState("");
  const [perguntasEnviadasCronograma, setPerguntasEnviadasCronograma] = useState(0);
  const [conquistaConcedidaCronograma, setConquistaConcedidaCronograma] = useState(false);
  const [mostrandoSucessoPerguntaCronograma, setMostrandoSucessoPerguntaCronograma] = useState(false);

  const campoTextoPerguntaCronogramaRef = useRef(null);
  const fechandoModalPerguntaCronogramaRef = useRef(false);
  const temporizadorSaidaModalPerguntaCronogramaRef = useRef(null);

  function fecharModalPerguntaCronograma() {
    if (fechandoModalPerguntaCronogramaRef.current) return;
    fechandoModalPerguntaCronogramaRef.current = true;
    setSaindoModalPerguntaCronograma(true);
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    temporizadorSaidaModalPerguntaCronogramaRef.current = setTimeout(
      aoFechar,
      reduzirMovimento ? 0 : DURACAO_SAIDA_MODAL_PERGUNTA_CRONOGRAMA_MS
    );
  }

  useEffect(() => {
    const lenisJaParado = !!window.lenis?.isStopped;
    const overflowAnterior = document.body.style.overflow;
    window.lenis?.stop();
    document.body.style.overflow = "hidden";
    campoTextoPerguntaCronogramaRef.current?.focus({ preventScroll: true });

    // Captura na window: roda antes do Esc do sheet do cronograma e o barra
    function fecharAoTeclarEscapePerguntaCronograma(teclado) {
      if (teclado.key !== "Escape") return;
      teclado.stopPropagation();
      fecharModalPerguntaCronograma();
    }
    window.addEventListener("keydown", fecharAoTeclarEscapePerguntaCronograma, true);

    return () => {
      window.removeEventListener("keydown", fecharAoTeclarEscapePerguntaCronograma, true);
      document.body.style.overflow = overflowAnterior;
      if (!lenisJaParado) window.lenis?.start();
      clearTimeout(temporizadorSaidaModalPerguntaCronogramaRef.current);
    };
  }, []);

  const textoLimpoPerguntaCronograma = textoPerguntaCronograma.trim();
  const podeEnviarPerguntaCronograma =
    textoLimpoPerguntaCronograma.length > 0 && !enviandoPerguntaCronograma;

  async function enviarPerguntaCronograma(envio) {
    envio.preventDefault();
    if (!podeEnviarPerguntaCronograma) return;
    setEnviandoPerguntaCronograma(true);
    setErroPerguntaCronograma("");
    try {
      const resposta = await enviarPerguntaPublica({
        eventoId: evento.id,
        texto: textoLimpoPerguntaCronograma,
        nome: logadoPerguntaCronograma ? null : nomeAutorPerguntaCronograma.trim(),
      });
      setConquistaConcedidaCronograma(!!resposta?.conquistaConcedida);
      setPerguntasEnviadasCronograma((total) => total + 1);
      setTextoPerguntaCronograma("");
      setMostrandoSucessoPerguntaCronograma(true);
    } catch (erro) {
      setErroPerguntaCronograma(erro.message);
    } finally {
      setEnviandoPerguntaCronograma(false);
    }
  }

  function mandarOutraPerguntaCronograma() {
    setConquistaConcedidaCronograma(false);
    setMostrandoSucessoPerguntaCronograma(false);
    // Espera o textarea voltar ao DOM para focar
    requestAnimationFrame(() =>
      campoTextoPerguntaCronogramaRef.current?.focus({ preventScroll: true })
    );
  }

  return createPortal(
    <div
      className={
        saindoModalPerguntaCronograma
          ? "fundoModalPerguntaCronograma fundoSaindoModalPerguntaCronograma"
          : "fundoModalPerguntaCronograma"
      }
      onClick={fecharModalPerguntaCronograma}
    >
      <div
        className={
          saindoModalPerguntaCronograma
            ? "cardModalPerguntaCronograma cardSaindoModalPerguntaCronograma"
            : "cardModalPerguntaCronograma"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalPerguntaCronograma"
        onClick={(clique) => clique.stopPropagation()}
      >
        <header className="cabecalhoModalPerguntaCronograma">
          <div className="textosCabecalhoModalPerguntaCronograma">
            <h2 id="tituloModalPerguntaCronograma" className="tituloModalPerguntaCronograma">
              Mande sua pergunta
            </h2>
            <p className="nomeDebateModalPerguntaCronograma">{evento.titulo}</p>
          </div>
        </header>

        <div className="corpoModalPerguntaCronograma" data-lenis-prevent>
          {mostrandoSucessoPerguntaCronograma ? (
            <section className="sucessoModalPerguntaCronograma" aria-live="polite">
              <span className="chamadaSucessoModalPerguntaCronograma">Pergunta enviada!</span>
              <p className="descricaoSucessoModalPerguntaCronograma">
                {perguntasEnviadasCronograma === 1
                  ? "A mediação vai levar sua pergunta para o debate."
                  : `Você já mandou ${perguntasEnviadasCronograma} perguntas por aqui.`}
              </p>
              {conquistaConcedidaCronograma && (
                <p className="conquistaModalPerguntaCronograma">
                  <strong>Conquista desbloqueada!</strong> Ela aparece na próxima vez que você
                  abrir a plataforma.
                </p>
              )}
              <div className="acoesSucessoModalPerguntaCronograma">
                <button
                  type="button"
                  className="botaoPrincipalModalPerguntaCronograma"
                  onClick={mandarOutraPerguntaCronograma}
                >
                  Mandar outra
                </button>
                <button
                  type="button"
                  className="botaoSecundarioModalPerguntaCronograma"
                  onClick={fecharModalPerguntaCronograma}
                >
                  Fechar
                </button>
              </div>
            </section>
          ) : (
            <form className="formModalPerguntaCronograma" onSubmit={enviarPerguntaCronograma}>
              <div className="campoModalPerguntaCronograma">
                <label htmlFor="textareaPerguntaCronograma" className="rotuloCampoModalPerguntaCronograma">
                  Sua pergunta
                </label>
                <textarea
                  id="textareaPerguntaCronograma"
                  ref={campoTextoPerguntaCronogramaRef}
                  className="textareaPerguntaCronograma"
                  rows={4}
                  maxLength={LIMITE_CARACTERES_PERGUNTA_CRONOGRAMA}
                  placeholder="O que você quer perguntar aos debatedores?"
                  value={textoPerguntaCronograma}
                  onInput={(digitacao) => setTextoPerguntaCronograma(digitacao.currentTarget.value)}
                />
                <span className="contadorCaracteresModalPerguntaCronograma" aria-live="polite">
                  {textoPerguntaCronograma.length}/{LIMITE_CARACTERES_PERGUNTA_CRONOGRAMA}
                </span>
              </div>

              {logadoPerguntaCronograma ? (
                <p className="avisoAutorModalPerguntaCronograma">
                  Enviando como <strong>{nomeContaPerguntaCronograma}</strong>
                  {participantePerguntaCronograma && " · sua primeira pergunta vale uma conquista"}
                </p>
              ) : (
                <div className="campoModalPerguntaCronograma">
                  <label htmlFor="inputNomeAutorPerguntaCronograma" className="rotuloCampoModalPerguntaCronograma">
                    Seu nome <span className="opcionalCampoModalPerguntaCronograma">(opcional)</span>
                  </label>
                  <input
                    id="inputNomeAutorPerguntaCronograma"
                    className="inputNomeAutorPerguntaCronograma"
                    type="text"
                    autoComplete="name"
                    maxLength={LIMITE_CARACTERES_NOME_PERGUNTA_CRONOGRAMA}
                    placeholder="Em branco, a pergunta vai como anônima"
                    value={nomeAutorPerguntaCronograma}
                    onInput={(digitacao) => setNomeAutorPerguntaCronograma(digitacao.currentTarget.value)}
                  />
                </div>
              )}

              {erroPerguntaCronograma && (
                <p className="erroModalPerguntaCronograma" role="alert">{erroPerguntaCronograma}</p>
              )}

              <button
                type="submit"
                className="botaoPrincipalModalPerguntaCronograma"
                disabled={!podeEnviarPerguntaCronograma}
              >
                {enviandoPerguntaCronograma ? "Enviando…" : "Enviar pergunta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

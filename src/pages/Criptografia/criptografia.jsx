import "./criptografia.css";
import { useState, useEffect, useRef } from "preact/hooks";
import { useLocation } from "wouter";
import { lerEstadoCriptografia, enviarPalpiteCriptografia, PalpiteInvalidoErro } from "./apiCriptografia.js";
import { temAcessoParticipante } from "../../auth/sessao.js";

/* Desafio da Criptografia.

   A palavra do dia não está aqui, e esse é o ponto: ela vive só no banco e
   no servidor (ver TermoService, no java_api). O que esta tela faz é mandar
   o palpite para a API e pintar o padrão de cores que volta. Antes a
   palavra era uma constante neste arquivo — ou seja, estava no bundle,
   legível no DevTools.

   O limite de 6 tentativas também é do servidor: recarregar a página
   retoma a partida onde parou em vez de recomeçar.

   A exceção é o modo treino (ver abaixo): depois que a partida valendo
   acaba, a API já revelou a palavra, então uma rodada extra pode ser
   conferida aqui mesmo — sem ida ao servidor e, portanto, sem xp. */

/* Sair do jogo devolve a pessoa à área do participante, de onde o Termo é
   aberto pelo card da aba Desafios — não à home do site. */
const ROTA_SAIDA_DESAFIO = "/participantes?tab=desafios";

/* Atalho vindo do card "Concluído" da aba Desafios (/participantes): abre
   o jogo já na rodada de treino, sem passar pela tela de fim. Só vale para
   quem venceu — é lá que a palavra foi revelada. */

const Criptografia = () => {
    const [, navegar] = useLocation();

    const [carregando, setCarregando] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState("");
    const [disponivel, setDisponivel] = useState(false);

    const [palavra, setPalavra] = useState("");
    const [fim, setFim] = useState(null);
    const [acertos, setAcertos] = useState(0);
    const [xpGanho, setXpGanho] = useState(0);
    const [ajudaAberta, setAjudaAberta] = useState(false);
    const [acertouPalavra, setAcertouPalavra] = useState(false);
    const [toast, setToast] = useState("");
    const [bloqueado, setBloqueado] = useState(false);

    const ajudaAbertaRef = useRef(ajudaAberta);
    const bloqueadoRef = useRef(bloqueado);

    useEffect(() => { ajudaAbertaRef.current = ajudaAberta; }, [ajudaAberta]);
    useEffect(() => { bloqueadoRef.current = bloqueado; }, [bloqueado]);

    /* Jogar credita xp, então é preciso estar logado como participante. Sem
       sessão, manda para o login com volta para cá. */
    useEffect(() => {
        if (!temAcessoParticipante()) {
            window.location.replace(`/inscricoes?tab=entrar&next=${encodeURIComponent("/criptografia")}`);
        }
    }, []);

    /* Estado inicial: dia de hoje e a partida em andamento, se houver.
       Sem sessão não vale nem pedir — o efeito acima já está mandando a
       pessoa para o login. */
    useEffect(() => {
        if (!temAcessoParticipante()) return;
        let ativo = true;
        lerEstadoCriptografia()
            .then((estado) => {
                if (!ativo || !estado) return;
                setDisponivel(estado.disponivel);
                setAcertos(estado.acertos);
                setXpGanho(estado.xpGanho ?? 0);
                if (estado.acertos == 3) {
                    setFim(estado.venceu ? "ganhou" : "perdeu");
                }
            })
            .catch((e) => { if (ativo) setErroCarregamento(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    /* Toast de erro ou recado, que some sozinho depois de um tempo. */
    const toastTimerRef = useRef(null);
    const mostrarToast = (msg) => {
        setToast(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(""), 1400);
    };

    /* Mostra a mensagem de acerto por um tempo, depois some. */
    const mostrarMensagemAcertou = () => {
        setTimeout(() => setAcertouPalavra(false), 1400);
    }

    /* Recusa a palavra por ser inválida. */
    const recusarPalpite = (mensagem) => {
        mostrarToast(mensagem);
    };

    /* O input de palpite é transformado em maiúsculas */
    const inputOnChange = async (input) => {
        input.value = input.value.toUpperCase();
        setPalavra(input.value);
    }

    /* Envia o palpite para o servidor. */
    const enviar = async () => {
        console.log(palavra);
        if (palavra.includes(" ")) {
            recusarPalpite("Palavra inválida");
            return;
        }

        setBloqueado(true);
        try {
            const resposta = await enviarPalpiteCriptografia(palavra);
            if (!resposta) return;

            setBloqueado(false);
            if (resposta.acertou) {
                setAcertos(resposta.acertos);
                setXpGanho(xpGanho + (resposta.xpGanho ?? 0));
                setAcertouPalavra(true);
                mostrarMensagemAcertou(resposta.xpGanho);
                if (resposta.acertos == 3) {
                    setFim("ganhou");
                }
            }
        } catch (e) {
            setBloqueado(false);
            /* 422: o servidor não conhece a palavra. */
            if (e instanceof PalpiteInvalidoErro) recusarPalpite(e.message);
            else mostrarToast(e.message);
        }
    };

    return (
        <div className="divPaginaCriptografia">

            {toast && <div className="divToastErroCriptografia">{toast}</div>}
            {acertouPalavra && <div className="divAcertouPalavraCriptografia">Você acertou a palavra. <br/> +{xpGanho/acertos}XP</div>}

            <div className="divCabecalhoCriptografia">
                <button className="botaoVoltarCriptografia" onClick={() => navegar(ROTA_SAIDA_DESAFIO)}>&#x2190;</button>
                <h1 className="tituloCriptografia">CRIPTOGRAFIA</h1>
                <button className="botaoAjudaCriptografia" onClick={() => setAjudaAberta(true)}>?</button>
            </div>

            {/* Carregando o estado do jogo. */}
            {carregando && (
                <div className="divConteudoJogoCriptografia">
                    <span className="spanCarregamentoCriptografia">CARREGANDO…</span>
                </div>
            )}

            {/* Erro de carregamento */}
            {!carregando && erroCarregamento && (
                <div className="divConteudoJogoCriptografia">
                    <div className="divCartaoAvisoCriptografia">
                        <div className="tituloAvisoCriptografia">OPA</div>
                        <p className="textoAvisoCriptografia">{erroCarregamento}</p>
                    </div>
                </div>
            )}

            {/* Fora do dia cadastrado não há desafio. */}
            {!carregando && !erroCarregamento && !disponivel && (
                <div className="divConteudoJogoCriptografia">
                    <div className="divCartaoAvisoCriptografia">
                        <p className="textoAvisoCriptografia">
                            O desafio estará disponível durante o primeiro dia da SEMAC. Volte nesse período para jogar.
                        </p>
                        <button className="botaoReiniciarFimCriptografia" onClick={() => navegar(ROTA_SAIDA_DESAFIO)}>
                            VOLTAR AOS DESAFIOS
                        </button>
                    </div>
                </div>
            )}

            {/* Jogo valendo. */}
            {!carregando && !erroCarregamento && disponivel && (
                <div className="divConteudoJogoCriptografia">

                    <div className="divPalpiteCriptografia">
                        <label>Insira a palavra descriptografada:</label>
                        <input type="text" name="palpite" className="inputPalpiteCriptografia" onChange={(e) => inputOnChange(e.target)}/>
                        {acertos > 0 && <span className="spanRotuloAcertosCriptografia">Acertos: {acertos}/3 (+{xpGanho}XP)</span>}
                        <button type="button" className="buttonPalpiteCriptografia" onClick={() => enviar()}>ENVIAR</button>
                    </div>
                </div>
            )}

            {/* Tela de ajuda, com instruções de como jogar. */}
            {ajudaAberta && (
                <div className="divSobreposicaoAjudaCriptografia" onClick={() => setAjudaAberta(false)}>
                    <div className="divCartaoAjudaCriptografia" onClick={(e) => e.stopPropagation()}>
                        <div className="tituloAjudaCriptografia">COMO JOGAR</div>
                        <p className="textoAjudaCriptografia">
                            Três palavras foram criptografadas e inseridas nos slides das apresentações do dia.
                            Descbra as palavras originais e insira no campo de texto.
                            Acertar cada palavra vale 25 XP.
                        </p>
                        <button className="botaoEntendiAjudaCriptografia" onClick={() => setAjudaAberta(false)}>ENTENDI</button>
                    </div>
                </div>
            )}

            {/* Fim da partida. Quando acertar todas mostra essa parte. 
                O usuário é incentivado a seguir para a próxima parte. */}
            {fim && (
                <div className="divSobreposicaoFimCriptografia">
                    <div className="divCartaoFimCriptografia">
                        <div className={`tituloFimCriptografia venceuFimCriptografia`}>
                            VOCÊ GANHOU!
                        </div>

                        <div className="divXpGanhoFimCriptografia">+{xpGanho} XP</div>

                        <p className="textoFimCriptografia">Parabéns! Você acertou todas as palavras.</p>

                        {/* TODO 
                        Link para a segunda parte do desafio, o Termo. */}

                        <button className="botaoReiniciarFimCriptografia" onClick={() => navegar(ROTA_SAIDA_DESAFIO)}>
                            VOLTAR AOS DESAFIOS
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Criptografia;

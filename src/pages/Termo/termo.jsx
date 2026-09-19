import "./termo.css";
import { useState, useEffect, useRef } from "preact/hooks";
import { useLocation } from "wouter";
import { palavraExisteTermo } from "../../data/palavrasValidasTermo.js";
import { lerEstadoTermo, enviarPalpiteTermo, PalpiteInvalidoErro } from "./apiTermo.js";
import { temAcessoParticipante } from "../../auth/sessao.js";

/* Jogo do Termo.

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

const TECLADO = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const TOTAL_TENTATIVAS = 6;
const TAMANHO_PALAVRA = 5;
const ATRASO_REVELACAO_MS = 5 * 90 + 350;

/* Sair do jogo devolve a pessoa à área do participante, de onde o Termo é
   aberto pelo card da aba Desafios — não à home do site. */
const ROTA_SAIDA_TERMO = "/participantes?tab=desafios";

const semAcento = (str) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

/* O servidor devolve o resultado compactado, uma letra por posição. */
const ESTADO_POR_LETRA = { C: "certo", P: "presente", A: "ausente" };

const estadosDoResultado = (resultado) =>
    resultado.split("").map((letra) => ESTADO_POR_LETRA[letra] ?? "ausente");

/* Tentativa como veio da API → como a grade a desenha. */
const paraLinhaGrade = ({ palpite, resultado }) => ({
    letras: palpite.split(""),
    estados: estadosDoResultado(resultado),
});

/* Padrão de cores do palpite, só para o modo treino — a partida valendo
   continua sendo conferida pelo servidor.

   É a mesma conta do TermoService.calcularResultado, e precisa continuar
   sendo: duas passadas, acertos de posição primeiro, e só depois as letras
   presentes fora de lugar consomem as ocorrências que sobraram. Sem isso
   "AAABB" contra "ABCDE" marcaria três amarelos para um único A. */
const calcularResultadoTreino = (palpite, secreta) => {
    const estado = Array(TAMANHO_PALAVRA).fill("A");
    const usados = Array(TAMANHO_PALAVRA).fill(false);

    for (let i = 0; i < TAMANHO_PALAVRA; i++) {
        if (palpite[i] === secreta[i]) {
            estado[i] = "C";
            usados[i] = true;
        }
    }
    for (let i = 0; i < TAMANHO_PALAVRA; i++) {
        if (estado[i] === "C") continue;
        for (let j = 0; j < TAMANHO_PALAVRA; j++) {
            if (!usados[j] && secreta[j] === palpite[i]) {
                estado[i] = "P";
                usados[j] = true;
                break;
            }
        }
    }
    return estado.join("");
};

/* Atalho vindo do card "Concluído" da aba Desafios (/participantes): abre
   o jogo já na rodada de treino, sem passar pela tela de fim. Só vale para
   quem venceu — é lá que a palavra foi revelada. */
const querTreinoPelaUrl = () =>
    new URLSearchParams(window.location.search).get("treino") === "1";

const Termo = () => {
    const [, navegar] = useLocation();

    const [carregando, setCarregando] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState("");
    const [disponivel, setDisponivel] = useState(false);
    const [ultimoDia, setUltimoDia] = useState(false);

    const [tentativas, setTentativas] = useState([]);
    const [atual, setAtual] = useState(Array(TAMANHO_PALAVRA).fill(""));
    const [cursor, setCursor] = useState(0);
    const [fim, setFim] = useState(null);
    const [palavraRevelada, setPalavraRevelada] = useState("");
    const [xpGanho, setXpGanho] = useState(0);
    const [ajudaAberta, setAjudaAberta] = useState(false);
    const [toast, setToast] = useState("");
    const [bloqueado, setBloqueado] = useState(false);
    const [linhaTremendo, setLinhaTremendo] = useState(null);

    /* Modo treino: rodada extra com a mesma palavra, depois que a partida
       valendo já acabou. Roda inteira no navegador — não chama a API, não
       gasta tentativa no banco e não mexe em xp. As tentativas valendo
       ficam guardadas em `tentativas`, intactas, e voltam à tela quando a
       pessoa sai do treino. */
    const [modoTreino, setModoTreino] = useState(false);
    const [tentativasTreino, setTentativasTreino] = useState([]);
    const [fimTreino, setFimTreino] = useState(null);

    /* A grade, o teclado e o fim de jogo desenham o treino quando ele está
       ligado, e a partida valendo quando não. */
    const tentativasVisiveis = modoTreino ? tentativasTreino : tentativas;
    const fimVisivel = modoTreino ? fimTreino : fim;

    const fimRef = useRef(fimVisivel);
    const ajudaAbertaRef = useRef(ajudaAberta);
    const bloqueadoRef = useRef(bloqueado);

    useEffect(() => { fimRef.current = fimVisivel; }, [fimVisivel]);
    useEffect(() => { ajudaAbertaRef.current = ajudaAberta; }, [ajudaAberta]);
    useEffect(() => { bloqueadoRef.current = bloqueado; }, [bloqueado]);

    /* Jogar credita xp, então é preciso estar logado como participante. Sem
       sessão, manda para o login com volta para cá. */
    useEffect(() => {
        if (!temAcessoParticipante()) {
            window.location.replace(`/inscricoes?tab=entrar&next=${encodeURIComponent("/termo")}`);
        }
    }, []);

    /* Estado inicial: dia de hoje e a partida em andamento, se houver.
       Sem sessão não vale nem pedir — o efeito acima já está mandando a
       pessoa para o login. */
    useEffect(() => {
        if (!temAcessoParticipante()) return;
        let ativo = true;
        lerEstadoTermo()
            .then((estado) => {
                if (!ativo || !estado) return;
                setDisponivel(estado.disponivel);
                setUltimoDia(estado.ultimoDia);
                setTentativas((estado.tentativas ?? []).map(paraLinhaGrade));
                if (estado.encerrado) {
                    setFim(estado.venceu ? "ganhou" : "perdeu");
                    setPalavraRevelada(estado.palavra ?? "");
                    setXpGanho(estado.xpGanho ?? 0);

                    /* `?treino=1` em qualquer outra situação é ignorado:
                       partida em andamento ou derrota seguem como sempre. */
                    if (estado.venceu && estado.palavra && querTreinoPelaUrl()) {
                        iniciarTreino();
                        /* Tira o parâmetro da URL para "SAIR DO TREINO" e
                           um F5 voltarem ao resultado, não ao treino. */
                        window.history.replaceState(null, "", window.location.pathname);
                    }
                }
            })
            .catch((e) => { if (ativo) setErroCarregamento(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    const toastTimerRef = useRef(null);
    const mostrarToast = (msg) => {
        setToast(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(""), 1400);
    };

    /* Recusa que não gasta tentativa: treme a linha e avisa, deixando as
       letras onde estão para a pessoa corrigir. */
    const recusarPalpite = (mensagem) => {
        setLinhaTremendo(tentativasVisiveis.length);
        mostrarToast(mensagem);
        setTimeout(() => setLinhaTremendo(null), 420);
    };

    const selecionarCelula = (i) => {
        if (bloqueadoRef.current || fimRef.current) return;
        setCursor(i);
    };

    const moverCursor = (delta) => {
        setCursor((c) => Math.max(0, Math.min(TAMANHO_PALAVRA - 1, c + delta)));
    };

    const digitarLetra = (letra) => {
        setAtual((prev) => {
            const arr = [...prev];
            arr[cursor] = letra;
            return arr;
        });
        setCursor((c) => Math.min(TAMANHO_PALAVRA - 1, c + 1));
    };

    const apagar = () => {
        if (atual[cursor] !== "") {
            setAtual((prev) => {
                const arr = [...prev];
                arr[cursor] = "";
                return arr;
            });
            return;
        }
        const nc = Math.max(0, cursor - 1);
        setAtual((prev) => {
            const arr = [...prev];
            arr[nc] = "";
            return arr;
        });
        setCursor(nc);
    };

    const limparGrade = () => {
        setAtual(Array(TAMANHO_PALAVRA).fill(""));
        setCursor(0);
    };

    const iniciarTreino = () => {
        setTentativasTreino([]);
        setFimTreino(null);
        setModoTreino(true);
        limparGrade();
    };

    /* Volta para a tela de fim da partida valendo. A rodada de treino é
       descartada — ela não conta para nada mesmo. */
    const sairTreino = () => {
        setModoTreino(false);
        setTentativasTreino([]);
        setFimTreino(null);
        limparGrade();
    };

    /* Palpite de treino: conferido aqui, sem rede. A palavra do dia é
       aceita mesmo fora do dicionário, igual ao servidor faz — "SEMAC" e
       "CYBER" não constam em dicionário nenhum. */
    const enviarTreino = (palpite) => {
        if (palpite !== palavraRevelada && !palavraExisteTermo(palpite)) {
            recusarPalpite("Palavra não encontrada");
            return;
        }

        const resultado = calcularResultadoTreino(palpite, palavraRevelada);
        const novasTentativas = [...tentativasTreino, paraLinhaGrade({ palpite, resultado })];
        setTentativasTreino(novasTentativas);
        limparGrade();
        setBloqueado(true);

        /* Mesmo compasso da partida valendo: espera a revelação terminar
           antes de soltar o teclado e abrir o modal. */
        setTimeout(() => {
            setBloqueado(false);
            const venceu = palpite === palavraRevelada;
            if (venceu || novasTentativas.length >= TOTAL_TENTATIVAS) {
                setFimTreino(venceu ? "ganhou" : "perdeu");
            }
        }, ATRASO_REVELACAO_MS);
    };

    const enviar = async () => {
        if (atual.some((l) => l === "")) {
            recusarPalpite("Palavra incompleta");
            return;
        }

        const palavra = atual.join("");

        if (modoTreino) {
            enviarTreino(palavra);
            return;
        }

        /* Pré-checagem local só para responder na hora a "EEEEE" sem ida ao
           servidor. Quem decide de verdade é o servidor, que revalida com a
           mesma lista — a checagem daqui é contornável. */
        if (!palavraExisteTermo(palavra)) {
            recusarPalpite("Palavra não encontrada");
            return;
        }

        setBloqueado(true);
        try {
            const resposta = await enviarPalpiteTermo(palavra);
            if (!resposta) return;

            setTentativas((prev) => [...prev, paraLinhaGrade({ palpite: palavra, resultado: resposta.resultado })]);
            setAtual(Array(TAMANHO_PALAVRA).fill(""));
            setCursor(0);
            setUltimoDia(resposta.ultimoDia);

            /* Espera a animação de revelação terminar antes de soltar o
               teclado e abrir o modal de fim. */
            setTimeout(() => {
                setBloqueado(false);
                if (resposta.encerrado) {
                    setFim(resposta.venceu ? "ganhou" : "perdeu");
                    setPalavraRevelada(resposta.palavra ?? "");
                    setXpGanho(resposta.xpGanho ?? 0);
                }
            }, ATRASO_REVELACAO_MS);
        } catch (e) {
            setBloqueado(false);
            /* 422: o servidor não conhece a palavra. Não gastou tentativa,
               então as letras ficam na grade. */
            if (e instanceof PalpiteInvalidoErro) recusarPalpite(e.message);
            else mostrarToast(e.message);
        }
    };

    const processarTecla = useRef(null);
    processarTecla.current = (tecla) => {
        if (fimRef.current || ajudaAbertaRef.current || bloqueadoRef.current) return;

        if (tecla === "ENTER") { enviar(); return; }
        if (tecla === "⌫" || tecla === "BACKSPACE") { apagar(); return; }
        if (tecla === "ARROWLEFT") { moverCursor(-1); return; }
        if (tecla === "ARROWRIGHT") { moverCursor(1); return; }
        digitarLetra(tecla.toUpperCase());
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const key = e.key;
            if (key === "Enter")      { processarTecla.current("ENTER");      return; }
            if (key === "Backspace")  { processarTecla.current("BACKSPACE");  return; }
            if (key === "ArrowLeft")  { processarTecla.current("ARROWLEFT");  return; }
            if (key === "ArrowRight") { processarTecla.current("ARROWRIGHT"); return; }
            if (/^[a-zA-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇáàâãéèêíìîóòôõúùûç]$/.test(key)) {
                processarTecla.current(semAcento(key).toUpperCase());
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const estadoTeclado = {};
    tentativasVisiveis.forEach(({ letras, estados }) => {
        letras.forEach((l, i) => {
            const e = estados[i], atualEstado = estadoTeclado[l];
            if (!atualEstado || e === "certo" || (e === "presente" && atualEstado !== "certo"))
                estadoTeclado[l] = e;
        });
    });

    const linhaAtivaIndex = tentativasVisiveis.length;
    const rotuloTentativa = String(Math.min(linhaAtivaIndex + 1, TOTAL_TENTATIVAS)).padStart(2, "0");

    const linhas = [];
    for (let i = 0; i < TOTAL_TENTATIVAS; i++) {
        if (i < tentativasVisiveis.length) linhas.push({ tipo: "enviada", ...tentativasVisiveis[i] });
        else if (i === linhaAtivaIndex && !fimVisivel) linhas.push({ tipo: "ativa", letras: atual });
        else linhas.push({ tipo: "vazia", letras: Array(TAMANHO_PALAVRA).fill("") });
    }

    /* Textos do fim de jogo. A derrota muda de recado no último dia: não há
       amanhã para prometer. */
    const tituloFim = fim === "ganhou" ? "VOCÊ ACERTOU!" : "QUE PENA!";
    const recadoFim = fim === "ganhou"
        ? (ultimoDia ? "Esse era o último Termo da semana." : "Volte amanhã para a próxima palavra.")
        : (ultimoDia ? "Não foi dessa vez." : "Volte amanhã para tentar a próxima palavra.");

    /* Fim de uma rodada de treino: mesma caixa, sem xp e sem promessa de
       amanhã — o que importa dizer é que a pontuação não mudou. */
    const tituloFimTreino = fimTreino === "ganhou" ? "ACERTOU DE NOVO!" : "QUE PENA!";

    return (
        <div className="divPaginaTermo">

            {toast && <div className="divToastErroTermo">{toast}</div>}

            <div className="divCabecalhoTermo">
                <button className="botaoVoltarTermo" onClick={() => navegar(ROTA_SAIDA_TERMO)}>&#x2190;</button>
                <h1 className="tituloTermo">TERMO</h1>
                <button className="botaoAjudaTermo" onClick={() => setAjudaAberta(true)}>?</button>
            </div>

            {carregando && (
                <div className="divConteudoJogoTermo">
                    <span className="spanRotuloTentativaTermo">CARREGANDO…</span>
                </div>
            )}

            {!carregando && erroCarregamento && (
                <div className="divConteudoJogoTermo">
                    <div className="divCartaoAvisoTermo">
                        <div className="tituloAvisoTermo">OPA</div>
                        <p className="textoAvisoTermo">{erroCarregamento}</p>
                    </div>
                </div>
            )}

            {/* Fora dos dias cadastrados não há palavra — a grade nem aparece. */}
            {!carregando && !erroCarregamento && !disponivel && (
                <div className="divConteudoJogoTermo">
                    <div className="divCartaoAvisoTermo">
                        <div className="tituloAvisoTermo">HOJE NÃO TEM TERMO</div>
                        <p className="textoAvisoTermo">
                            Uma palavra nova em cada dia da SEMAC. Volte durante o evento para jogar.
                        </p>
                        <button className="botaoReiniciarFimTermo" onClick={() => navegar(ROTA_SAIDA_TERMO)}>
                            VOLTAR AOS DESAFIOS
                        </button>
                    </div>
                </div>
            )}

            {!carregando && !erroCarregamento && disponivel && (
                <div className="divConteudoJogoTermo">

                    {modoTreino && (
                        <div className="divAvisoTreinoTermo">
                            <span className="spanAvisoTreinoTermo">MODO TREINO · NÃO VALE PONTOS</span>
                            <button className="botaoSairTreinoTermo" onClick={sairTreino}>
                                SAIR DO TREINO
                            </button>
                        </div>
                    )}

                    <span className="spanRotuloTentativaTermo">TENTATIVA {rotuloTentativa} DE {TOTAL_TENTATIVAS}</span>

                    <div className="divGradeTermo">
                        {linhas.map((linha, li) => (
                            <div
                                key={li < tentativasVisiveis.length ? `linha-enviada-${li}` : `linha-pendente-${li}`}
                                className={`divLinhaGradeTermo ${linhaTremendo === li ? "linhaTremendoTermo" : ""}`}
                            >
                                {linha.letras.map((letra, ci) => {
                                    const classes = ["divCelulaTermo"];
                                    let key = `${li}-${ci}`;

                                    if (linha.tipo === "enviada") {
                                        const estado = linha.estados[ci];
                                        classes.push(`celula${estado[0].toUpperCase()}${estado.slice(1)}Termo`);
                                        classes.push(li === tentativasVisiveis.length - 1 && fimVisivel === "ganhou" ? "celulaSaltandoTermo" : "celulaGirandoTermo");
                                        key = `enviada-${modoTreino ? "treino" : "valendo"}-${li}-${ci}`;
                                    } else if (linha.tipo === "ativa") {
                                        classes.push("celulaClicavelTermo");
                                        if (letra) classes.push("celulaPreenchidaTermo");
                                        if (!bloqueado && cursor === ci) classes.push("celulaSelecionadaTermo");
                                        key = `ativa-${ci}-${letra}`;
                                    }

                                    return (
                                        <div
                                            key={key}
                                            className={classes.join(" ")}
                                            style={linha.tipo === "enviada" ? { animationDelay: `${ci * 90}ms` } : undefined}
                                            onClick={linha.tipo === "ativa" ? () => selecionarCelula(ci) : undefined}
                                        >
                                            {letra}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    <div className="divTecladoTermo">
                        {TECLADO.map((linha, li) => (
                            <div key={li} className="divLinhaTecladoTermo">
                                {linha.map((tecla) => {
                                    const estado = estadoTeclado[tecla];
                                    const classes = ["botaoTeclaTermo"];
                                    if (tecla === "ENTER") classes.push("teclaEnterTermo");
                                    if (tecla === "⌫") classes.push("teclaApagarTermo");
                                    if (estado) classes.push(`tecla${estado[0].toUpperCase()}${estado.slice(1)}Termo`);
                                    return (
                                        <button
                                            key={tecla}
                                            className={classes.join(" ")}
                                            disabled={bloqueado}
                                            onClick={() => processarTecla.current(tecla)}
                                        >
                                            {tecla}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {ajudaAberta && (
                <div className="divSobreposicaoAjudaTermo" onClick={() => setAjudaAberta(false)}>
                    <div className="divCartaoAjudaTermo" onClick={(e) => e.stopPropagation()}>
                        <div className="tituloAjudaTermo">COMO JOGAR</div>
                        <p className="textoAjudaTermo">
                            Adivinhe a palavra do dia em 6 tentativas. Cada palpite precisa ter 5 letras.
                            Acertar vale 5 XP.
                        </p>
                        <div className="divLinhaLegendaAjudaTermo">
                            <div className="corLegendaAjudaTermo corCertaLegendaTermo" />
                            <span className="textoLegendaAjudaTermo">Letra certa, posição certa.</span>
                        </div>
                        <div className="divLinhaLegendaAjudaTermo">
                            <div className="corLegendaAjudaTermo corPresenteLegendaTermo" />
                            <span className="textoLegendaAjudaTermo">Letra certa, posição errada.</span>
                        </div>
                        <div className="divLinhaLegendaAjudaTermo">
                            <div className="corLegendaAjudaTermo corAusenteLegendaTermo" />
                            <span className="textoLegendaAjudaTermo">Letra não está na palavra.</span>
                        </div>
                        <button className="botaoEntendiAjudaTermo" onClick={() => setAjudaAberta(false)}>ENTENDI</button>
                    </div>
                </div>
            )}

            {/* Fim da partida valendo. Quem acertou pode repetir a mesma
                palavra no treino — não muda pontuação, é só para tentar
                outros caminhos até a resposta. */}
            {!modoTreino && fim && (
                <div className="divSobreposicaoFimTermo">
                    <div className="divCartaoFimTermo">
                        <div className={`tituloFimTermo ${fim === "ganhou" ? "venceuFimTermo" : "perdeuFimTermo"}`}>
                            {tituloFim}
                        </div>

                        {fim === "ganhou" && xpGanho > 0 && (
                            <div className="divXpGanhoFimTermo">+{xpGanho} XP</div>
                        )}

                        <p className="textoFimTermo">{recadoFim}</p>

                        {fim === "perdeu" && palavraRevelada && (
                            <p className="textoFimTermo">
                                A palavra era <span className="palavraFimTermo">{palavraRevelada}</span>
                            </p>
                        )}

                        {fim === "ganhou" && palavraRevelada && (
                            <button className="botaoJogarDeNovoFimTermo" onClick={iniciarTreino}>
                                JOGAR DE NOVO (TREINO)
                            </button>
                        )}

                        <button className="botaoReiniciarFimTermo" onClick={() => navegar(ROTA_SAIDA_TERMO)}>
                            VOLTAR AOS DESAFIOS
                        </button>
                    </div>
                </div>
            )}

            {/* Fim de uma rodada de treino: sem xp, com a palavra sempre
                revelada — a pessoa já a conhece. */}
            {modoTreino && fimTreino && (
                <div className="divSobreposicaoFimTermo">
                    <div className="divCartaoFimTermo">
                        <div className={`tituloFimTermo ${fimTreino === "ganhou" ? "venceuFimTermo" : "perdeuFimTermo"}`}>
                            {tituloFimTreino}
                        </div>

                        <p className="textoFimTermo">
                            Treino não vale pontos — sua pontuação de hoje continua a mesma.
                        </p>

                        <p className="textoFimTermo">
                            A palavra era <span className="palavraFimTermo">{palavraRevelada}</span>
                        </p>

                        <button className="botaoJogarDeNovoFimTermo" onClick={iniciarTreino}>
                            JOGAR DE NOVO
                        </button>

                        <button className="botaoReiniciarFimTermo" onClick={sairTreino}>
                            VOLTAR AO RESULTADO
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Termo;

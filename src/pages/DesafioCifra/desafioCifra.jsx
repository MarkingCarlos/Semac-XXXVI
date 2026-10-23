import "./desafioCifra.css";
import { useState, useEffect, useRef } from "preact/hooks";
import { useLocation } from "wouter";
import {
    lerEstadoDesafioCifra,
    enviarTentativaDesafioCifra,
    lerTesteDesafioCifra,
    enviarTentativaTesteDesafioCifra,
} from "./apiDesafioCifra.js";
import { temAcessoParticipante } from "../../auth/sessao.js";
import CampoOtpCifra from "../../components/campoOtpCifra/campoOtpCifra.jsx";
import TextoCifra from "../../components/campoOtpCifra/textoCifra.jsx";

/* Desafio diário "Cifra do Dia", no visual de cofre do design da SEMAC.

   A tela mostra a senha criptografada do dia e um campo em casas para a
   resposta. Quem confere é o servidor (ver DesafioCifraService, no
   java_api): a resposta não está neste arquivo nem chega ao navegador —
   nem quando a pessoa gasta as 5 tentativas.

   O desafio pode ter 1 ou 2 etapas. Com 2, a primeira é a senha
   parcialmente descriptografada: acertá-la troca o visor do cofre por ela
   e abre o campo da resposta final, com a segunda dica. Só o erro gasta
   tentativa.

   Ao enviar, roda a animação "DESCRIPTOGRAFANDO": as casas embaralham e
   travam da esquerda para a direita enquanto o botão enche. A animação é
   enfeite — quem decide é o servidor, e ela anda junto com o pedido:
   errou, ela para onde estiver e o campo treme; acertou, ela termina e o
   cofre destrava. Nunca segura um erro atrás dos segundos completos.

   Modo teste (`modoTeste`, rota /desafio-cifra/teste?desafio={id}),
   aberto pelo botão "Testar" do /admin -> Cifra do Dia: a diretoria joga
   um desafio cadastrado, de qualquer data. O servidor só diz se acertou e
   não grava nada, então as tentativas e a troca de etapa são contadas
   aqui (ver resultadoDoTeste) — perdeu, pode recomeçar. A resposta não é
   revelada nem ao perder, como no teste do Termo. */

const ROTA_SAIDA_DESAFIO_CIFRA = "/participantes?tab=desafios";
const ROTA_SAIDA_TESTE_DESAFIO_CIFRA = "/admin";

/* "2026-10-28" -> "28/10/2026", para a faixa do teste. */
const formatarDataTesteCifra = (data) => {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
};

const desafioIdTestePelaUrl = () =>
    Number(new URLSearchParams(window.location.search).get("desafio")) || null;

/* O que o servidor faria com o jogo, feito na tela: no teste nada é
   gravado. Devolve o mesmo formato de POST /tentativa ({ acertou, estado })
   para o resto da tela não saber a diferença. */
const resultadoDoTeste = (estado, etapaAtual, acertou, respostaDigitada) => {
    if (acertou) {
        const etapas = estado.etapas.map((etapa) => (etapa.ordem === etapaAtual.ordem
            ? { ...etapa, concluida: true, resposta: respostaDigitada }
            : etapa));
        const venceu = etapas.every((etapa) => etapa.concluida);
        return {
            acertou,
            estado: { ...estado, etapas, encerrado: venceu, venceu, xpGanho: venceu ? 0 : null },
        };
    }
    const tentativasRestantes = estado.tentativasRestantes - 1;
    const encerrado = tentativasRestantes <= 0;
    return {
        acertou,
        estado: { ...estado, tentativasRestantes, encerrado, venceu: false, xpGanho: encerrado ? 0 : null },
    };
};

const DURACAO_SAIDA_DICA_MS = 220;

/* Ritmo da animação de envio: 2,4s de 0 a 100%, em quadros de 60ms.
   Enquanto o servidor não responde ela não passa de 92%, para nunca
   "terminar" antes de saber se acertou. */
const DURACAO_DECIFRANDO_MS = 2400;
const QUADRO_DECIFRANDO_MS = 60;
const TETO_SEM_RESPOSTA_DECIFRANDO = 92;
/* Quanto o "DESTRAVADO" / "COFRE ABERTO" fica na tela antes da próxima
   etapa ou do modal de vitória. */
const PAUSA_DESTRAVADO_MS = 900;

const FASE_OCIOSA_CIFRA = "ociosa";
const FASE_DECIFRANDO_CIFRA = "decifrando";
const FASE_DESTRAVADA_CIFRA = "destravada";
const FASE_ABERTA_CIFRA = "aberta";

/* Ícones em traço, mesmo desenho do design. Atributos de SVG em
   kebab-case: o Preact repassa como está, e camelCase não pega. */
const IconeCadeadoCifra = ({ tamanho = 16, aberto = false, cheio = false }) => (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={cheio ? "currentColor" : "none"} stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d={aberto ? "M8 11V8a4 4 0 0 1 7.5-2" : "M8 11V8a4 4 0 0 1 8 0v3"} fill="none" />
    </svg>
);

const IconeGirandoCifra = () => (
    <svg className="svgGirandoDesafioCifra" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true">
        <path d="M12 3a9 9 0 1 1-9 9" />
    </svg>
);

const IconeConfereCifra = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" />
    </svg>
);

const IconeLampadaCifra = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </svg>
);

const DesafioCifra = ({ modoTeste = false }) => {
    const [, navegar] = useLocation();
    const rotaSaida = modoTeste ? ROTA_SAIDA_TESTE_DESAFIO_CIFRA : ROTA_SAIDA_DESAFIO_CIFRA;
    const [desafioIdTeste] = useState(desafioIdTestePelaUrl);
    /* Estado do teste como abriu, para "TENTAR NOVAMENTE" recomeçar. */
    const estadoInicialTesteRef = useRef(null);

    const [carregando, setCarregando] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState("");
    const [estado, setEstado] = useState(null);

    const [respostaDigitada, setRespostaDigitada] = useState("");
    const [campoTremendo, setCampoTremendo] = useState(false);
    const [toast, setToast] = useState("");
    const [ajudaAberta, setAjudaAberta] = useState(false);
    /* Folha de baixo com a dica da etapa atual. `fechandoDica` segura a
       folha montada enquanto ela desce, para a saída também ser animada. */
    const [dicaAberta, setDicaAberta] = useState(false);
    const [fechandoDica, setFechandoDica] = useState(false);
    const [fimVisivel, setFimVisivel] = useState(false);

    const [fase, setFase] = useState(FASE_OCIOSA_CIFRA);
    const [progresso, setProgresso] = useState(0);
    const progressoRef = useRef(0);
    const intervaloDecifrandoRef = useRef(null);
    /* Resposta de acerto que chegou com a animação ainda correndo: ela
       termina e só então a tela aplica o novo estado. */
    const acertoPendenteRef = useRef(null);
    const temporizadoresRef = useRef([]);

    /* Jogar credita xp, então é preciso estar logado como participante.
       Quem barra o teste é a RotaTesteDesafioCifra (main.jsx). */
    useEffect(() => {
        if (modoTeste && !desafioIdTeste) {
            setErroCarregamento("Nenhum desafio escolhido para testar.");
            setCarregando(false);
            return;
        }
        if (!modoTeste && !temAcessoParticipante()) {
            window.location.replace(`/inscricoes?tab=entrar&next=${encodeURIComponent("/desafio-cifra")}`);
            return;
        }
        let ativo = true;
        (modoTeste ? lerTesteDesafioCifra(desafioIdTeste) : lerEstadoDesafioCifra())
            .then((lido) => {
                if (!ativo || !lido) return;
                if (modoTeste) estadoInicialTesteRef.current = lido;
                setEstado(lido);
                setFimVisivel(lido.encerrado);
            })
            .catch((e) => { if (ativo) setErroCarregamento(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    useEffect(() => () => {
        clearInterval(intervaloDecifrandoRef.current);
        temporizadoresRef.current.forEach(clearTimeout);
    }, []);

    const depois = (funcao, ms) => {
        temporizadoresRef.current.push(setTimeout(funcao, ms));
    };

    const toastTimerRef = useRef(null);
    const mostrarToast = (mensagem) => {
        setToast(mensagem);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(""), 1600);
    };

    const tremerCampo = () => {
        setCampoTremendo(true);
        setTimeout(() => setCampoTremendo(false), 420);
    };

    const abrirDica = () => {
        setFechandoDica(false);
        setDicaAberta(true);
    };

    /* Mesmo tempo da animação de saída em desafioCifra.css. */
    const fecharDica = () => {
        setFechandoDica(true);
        setTimeout(() => {
            setDicaAberta(false);
            setFechandoDica(false);
        }, DURACAO_SAIDA_DICA_MS);
    };

    useEffect(() => {
        if (!dicaAberta) return;
        const fecharComEsc = (evento) => { if (evento.key === "Escape") fecharDica(); };
        window.addEventListener("keydown", fecharComEsc);
        return () => window.removeEventListener("keydown", fecharComEsc);
    }, [dicaAberta]);

    const pararAnimacao = () => {
        clearInterval(intervaloDecifrandoRef.current);
        intervaloDecifrandoRef.current = null;
    };

    /* Fim da animação de um acerto. Etapa intermediária: "DESTRAVADO" e o
       cofre passa para a próxima. Última: "COFRE ABERTO" e o modal. */
    const concluirAcerto = (resultado) => {
        pararAnimacao();
        const venceu = resultado.estado.encerrado && resultado.estado.venceu;
        setFase(venceu ? FASE_ABERTA_CIFRA : FASE_DESTRAVADA_CIFRA);
        depois(() => {
            setEstado(resultado.estado);
            setRespostaDigitada("");
            setFase(FASE_OCIOSA_CIFRA);
            setProgresso(0);
            if (venceu) setFimVisivel(true);
        }, PAUSA_DESTRAVADO_MS);
    };

    const iniciarAnimacao = () => {
        acertoPendenteRef.current = null;
        progressoRef.current = 0;
        setProgresso(0);
        setFase(FASE_DECIFRANDO_CIFRA);
        const passo = 100 / (DURACAO_DECIFRANDO_MS / QUADRO_DECIFRANDO_MS);
        intervaloDecifrandoRef.current = setInterval(() => {
            const acerto = acertoPendenteRef.current;
            const teto = acerto ? 100 : TETO_SEM_RESPOSTA_DECIFRANDO;
            const proximo = Math.min(teto, progressoRef.current + passo);
            progressoRef.current = proximo;
            setProgresso(proximo);
            if (acerto && proximo >= 100) concluirAcerto(acerto);
        }, QUADRO_DECIFRANDO_MS);
    };

    const etapas = estado?.etapas ?? [];
    const totalEtapas = estado?.totalEtapas ?? 1;
    const etapasConcluidas = etapas.filter((etapa) => etapa.concluida);
    const etapaAtual = estado && !estado.encerrado ? etapas.find((etapa) => !etapa.concluida) : null;
    const ehEtapaFinal = etapaAtual ? etapaAtual.ordem === totalEtapas : true;
    const totalCasas = etapaAtual ? etapaAtual.grupos.reduce((soma, tamanho) => soma + tamanho, 0) : 0;
    const casasPreenchidas = Array.from(respostaDigitada).length;
    const respostaCompleta = totalCasas > 0 && casasPreenchidas === totalCasas;
    const ocupado = fase !== FASE_OCIOSA_CIFRA;

    const enviar = async () => {
        if (!etapaAtual || ocupado) return;
        if (!respostaCompleta) {
            tremerCampo();
            mostrarToast("Preencha todas as casas");
            return;
        }

        iniciarAnimacao();
        try {
            const resultado = modoTeste
                ? await enviarTentativaTesteDesafioCifra(desafioIdTeste, etapaAtual.ordem, respostaDigitada)
                    .then((teste) => teste && resultadoDoTeste(estado, etapaAtual, teste.acertou, respostaDigitada))
                : await enviarTentativaDesafioCifra(respostaDigitada);
            if (!resultado) {
                pararAnimacao();
                setFase(FASE_OCIOSA_CIFRA);
                return;
            }
            if (resultado.acertou) {
                acertoPendenteRef.current = resultado;
                return;
            }

            /* Errou: a animação para onde estiver. */
            pararAnimacao();
            setFase(FASE_OCIOSA_CIFRA);
            setProgresso(0);
            setEstado(resultado.estado);
            setRespostaDigitada("");
            tremerCampo();
            if (resultado.estado.encerrado) setFimVisivel(true);
            else mostrarToast("Resposta errada");
        } catch (e) {
            pararAnimacao();
            setFase(FASE_OCIOSA_CIFRA);
            setProgresso(0);
            mostrarToast(e.message);
        }
    };

    const reiniciarTeste = () => {
        setEstado(estadoInicialTesteRef.current);
        setRespostaDigitada("");
        setFimVisivel(false);
        setFase(FASE_OCIOSA_CIFRA);
        setProgresso(0);
    };

    /* O visor do cofre: a senha criptografada na primeira etapa; a senha
       parcial que a pessoa acertou a partir da segunda. Quem venceu vê a
       resposta final. */
    const ultimaConcluida = etapasConcluidas[etapasConcluidas.length - 1];
    const visorMostraParcial = Boolean(ultimaConcluida) && !estado?.venceu;
    const textoVisor = estado?.venceu && ultimaConcluida
        ? ultimaConcluida.resposta
        : visorMostraParcial ? ultimaConcluida.resposta : estado?.senhaCifrada;
    const rotuloCofre = estado?.venceu ? "SENHA DECIFRADA"
        : visorMostraParcial ? "SENHA PARCIAL" : "SENHA CRIPTOGRAFADA";

    const textoChip = (() => {
        if (fase === FASE_DECIFRANDO_CIFRA) return ehEtapaFinal ? "ABRINDO" : "DECIFRANDO";
        if (fase === FASE_DESTRAVADA_CIFRA) return "LIBERADA";
        if (fase === FASE_ABERTA_CIFRA || estado?.venceu) return "ABERTO";
        if (estado?.encerrado) return "TRAVADA";
        return etapaAtual && etapaAtual.ordem > 1 ? `ETAPA ${etapaAtual.ordem}` : "BLOQUEADA";
    })();

    const rotuloCasas = !ehEtapaFinal ? "SENHA PARCIALMENTE DESCRIPTOGRAFADA"
        : totalEtapas > 1 ? "SENHA FINAL" : "RESPOSTA";

    const tentativasRestantes = estado?.tentativasRestantes ?? 0;
    const totalTentativas = estado?.totalTentativas ?? 5;
    const porcentagem = Math.round(progresso);
    const textoDecifrando = ehEtapaFinal ? "ABRINDO O COFRE" : "DESCRIPTOGRAFANDO";

    /* Conteúdo do botão em cada fase. O de "decifrando" é desenhado duas
       vezes: por baixo (escuro sobre âmbar) e por cima, recortado na
       largura do progresso (claro sobre vinho) — a barra "pinta" o texto
       enquanto avança. */
    const conteudoDecifrando = (
        <span className="spanConteudoBotaoDesafioCifra">
            <IconeGirandoCifra />
            <span>{textoDecifrando}</span>
            <span className="spanPorcentagemDesafioCifra">{porcentagem}%</span>
        </span>
    );
    const conteudoBotao = (() => {
        if (fase === FASE_DECIFRANDO_CIFRA) return conteudoDecifrando;
        if (fase === FASE_DESTRAVADA_CIFRA) {
            return <span className="spanConteudoBotaoDesafioCifra"><IconeCadeadoCifra tamanho={18} aberto />DESTRAVADO</span>;
        }
        if (fase === FASE_ABERTA_CIFRA || estado?.venceu) {
            return <span className="spanConteudoBotaoDesafioCifra"><IconeConfereCifra />COFRE ABERTO</span>;
        }
        if (estado?.encerrado) {
            return <span className="spanConteudoBotaoDesafioCifra"><IconeCadeadoCifra tamanho={18} />COFRE TRAVADO</span>;
        }
        return (
            <span className="spanConteudoBotaoDesafioCifra">
                <IconeCadeadoCifra tamanho={18} />
                {ehEtapaFinal ? "ABRIR O COFRE" : "DESTRAVAR"}
            </span>
        );
    })();

    const classesBotao = ["botaoDestravarDesafioCifra"];
    if (ocupado || estado?.venceu) classesBotao.push("botaoCheioDestravarDesafioCifra");
    else if (respostaCompleta) classesBotao.push("botaoProntoDestravarDesafioCifra");
    if (fase === FASE_DESTRAVADA_CIFRA || fase === FASE_ABERTA_CIFRA) classesBotao.push("botaoPulandoDestravarDesafioCifra");

    return (
        <div className="divPaginaDesafioCifra">

            {toast && <div className="divToastDesafioCifra" role="status">{toast}</div>}

            <header className="headerDesafioCifra">
                <button className="botaoCabecalhoDesafioCifra" aria-label="Voltar" onClick={() => navegar(rotaSaida)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M19 12H5M11 6l-6 6 6 6" />
                    </svg>
                    <span className="spanTextoCabecalhoDesafioCifra">VOLTAR</span>
                </button>
                <div className="divTituloCabecalhoDesafioCifra">
                    <h1 className="tituloDesafioCifra">CIFRA DO DIA</h1>
                    <span className="spanSubtituloDesafioCifra">SEMAC · MINIGAME</span>
                </div>
                <button className="botaoCabecalhoDesafioCifra botaoAjudaDesafioCifra" aria-label="Como jogar" onClick={() => setAjudaAberta(true)}>
                    <span className="spanTextoCabecalhoDesafioCifra">COMO JOGAR</span>
                    <span className="spanInterrogacaoDesafioCifra">?</span>
                </button>
            </header>

            {carregando && (
                <div className="divAvisoCentralDesafioCifra">
                    <span className="spanRotuloDesafioCifra">CARREGANDO…</span>
                </div>
            )}

            {!carregando && erroCarregamento && (
                <div className="divAvisoCentralDesafioCifra">
                    <div className="divCartaoAvisoDesafioCifra">
                        <div className="tituloAvisoDesafioCifra">OPA</div>
                        <p className="textoAvisoDesafioCifra">{erroCarregamento}</p>
                    </div>
                </div>
            )}

            {!carregando && !erroCarregamento && estado && !estado.disponivel && (
                <div className="divAvisoCentralDesafioCifra">
                    <div className="divCartaoAvisoDesafioCifra">
                        <div className="tituloAvisoDesafioCifra">HOJE NÃO TEM CIFRA</div>
                        <p className="textoAvisoDesafioCifra">
                            {modoTeste
                                ? "Esse desafio não tem etapas cadastradas."
                                : "Uma senha nova em cada dia da SEMAC. Volte durante o evento para decifrar."}
                        </p>
                        <button className="botaoCheioDesafioCifra" onClick={() => navegar(rotaSaida)}>
                            {modoTeste ? "VOLTAR AO ADMIN" : "VOLTAR AOS DESAFIOS"}
                        </button>
                    </div>
                </div>
            )}

            {modoTeste && estado?.disponivel && (
                <div className="divAvisoTesteDesafioCifra">
                    <span>MODO TESTE · NÃO VALE PONTOS</span>
                    <span className="spanDataTesteDesafioCifra">{formatarDataTesteCifra(estado.data)}</span>
                </div>
            )}

            {!carregando && !erroCarregamento && estado?.disponivel && (
                <main className="mainDesafioCifra">

                    {/* ── Cofre: a senha no visor ─────────────────────── */}
                    <section className="sectionCofreDesafioCifra" aria-label="Senha criptografada">
                        <span className="spanParafusoDesafioCifra parafusoSuperiorEsquerdoDesafioCifra" aria-hidden="true" />
                        <span className="spanParafusoDesafioCifra parafusoSuperiorDireitoDesafioCifra" aria-hidden="true" />
                        <span className="spanParafusoDesafioCifra parafusoInferiorEsquerdoDesafioCifra" aria-hidden="true" />
                        <span className="spanParafusoDesafioCifra parafusoInferiorDireitoDesafioCifra" aria-hidden="true" />

                        <div className="divTopoCofreDesafioCifra">
                            <span className="spanRotuloCofreDesafioCifra">
                                <span className="spanIconeAmbarDesafioCifra"><IconeCadeadoCifra tamanho={14} /></span>
                                {rotuloCofre}
                            </span>
                            <span className="spanChipCofreDesafioCifra">
                                <span className={`spanPontoChipDesafioCifra ${ocupado ? "pontoPulsandoChipDesafioCifra" : ""}`} aria-hidden="true" />
                                {textoChip}
                            </span>
                        </div>

                        {/* A chave troca com o texto: é o que anima a entrada
                            da senha parcial quando a etapa 1 é vencida. */}
                        <p key={textoVisor} className={`pVisorCofreDesafioCifra ${visorMostraParcial ? "visorParcialCofreDesafioCifra" : ""}`}>
                            <TextoCifra texto={textoVisor} />
                        </p>

                        <div className="divRodapeCofreDesafioCifra">
                            <span>{visorMostraParcial ? "última camada" : "decifre os blocos"}</span>
                            {etapaAtual && <span>{totalCasas} caracteres</span>}
                        </div>
                    </section>

                    {/* ── Barra de etapas, só em desafio de 2 ─────────── */}
                    {totalEtapas > 1 && (
                        <div className="divEtapasDesafioCifra">
                            <div className="divSegmentosEtapasDesafioCifra">
                                {Array.from({ length: totalEtapas }, (_, indice) => (
                                    <span key={indice} className="spanTrilhoEtapaDesafioCifra">
                                        <span
                                            className={indice < Math.min(totalEtapas, etapasConcluidas.length + 1)
                                                ? "spanPreenchimentoEtapaDesafioCifra preenchimentoCheioEtapaDesafioCifra"
                                                : "spanPreenchimentoEtapaDesafioCifra"}
                                        />
                                    </span>
                                ))}
                            </div>
                            <div className="divRotulosEtapasDesafioCifra">
                                <span className="rotuloEtapaAtivaDesafioCifra">ETAPA 1 · PARCIAL</span>
                                <span className={etapasConcluidas.length > 0 ? "rotuloEtapaAtivaDesafioCifra" : undefined}>
                                    ETAPA 2 · FINAL
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ── Faixa: tentativas e dica ─────────────────────
                        No celular os dois itens se espalham pela coluna
                        (display: contents); no desktop viram uma faixa. */}
                    <div className="divFaixaDesafioCifra">
                        <div
                            className="divTentativasDesafioCifra"
                            aria-label={`${tentativasRestantes} de ${totalTentativas} tentativas restantes`}
                        >
                            <span className="spanCadeadosTentativasDesafioCifra" aria-hidden="true">
                                {Array.from({ length: totalTentativas }, (_, indice) => (
                                    <span
                                        key={indice}
                                        className={indice < tentativasRestantes
                                            ? "spanCadeadoTentativaDesafioCifra"
                                            : "spanCadeadoTentativaDesafioCifra cadeadoGastoTentativaDesafioCifra"}
                                    >
                                        <IconeCadeadoCifra tamanho={15} cheio={indice < tentativasRestantes} />
                                    </span>
                                ))}
                            </span>
                            <span className="spanTextoTentativasDesafioCifra">
                                {tentativasRestantes === 1 ? "1 tentativa restante" : `${tentativasRestantes} tentativas restantes`}
                            </span>
                        </div>

                        {etapaAtual && (
                            <button
                                type="button"
                                className="botaoDicaDesafioCifra"
                                aria-haspopup="dialog"
                                onClick={abrirDica}
                            >
                                <span className="spanIconeAmbarDesafioCifra"><IconeLampadaCifra /></span>
                                VER DICA
                            </button>
                        )}
                    </div>

                    {/* ── Decifrar: casas, teclado e botão ────────────── */}
                    <form
                        className="formDecifrarDesafioCifra"
                        onSubmit={(evento) => { evento.preventDefault(); enviar(); }}
                    >
                        <div className="divEntradaDesafioCifra">
                            {etapaAtual ? (
                                <>
                                    <div className="divCabecalhoCasasDesafioCifra">
                                        <span className="spanRotuloCasasDesafioCifra">{rotuloCasas}</span>
                                        <span className="spanContadorCasasDesafioCifra">
                                            {ocupado ? "processando" : `${casasPreenchidas}/${totalCasas}`}
                                        </span>
                                    </div>
                                    <CampoOtpCifra
                                        key={etapaAtual.ordem}
                                        grupos={etapaAtual.grupos}
                                        valor={respostaDigitada}
                                        onMudar={setRespostaDigitada}
                                        tremendo={campoTremendo}
                                        rotulo={rotuloCasas}
                                        mostrarTeclado={etapaAtual.sobrescritos}
                                        progressoDecifrando={fase === FASE_DECIFRANDO_CIFRA ? progresso : null}
                                        decifrado={fase === FASE_DESTRAVADA_CIFRA || fase === FASE_ABERTA_CIFRA}
                                    />
                                </>
                            ) : (
                                <div className="divCartaoAvisoDesafioCifra divResultadoDesafioCifra">
                                    <div className="tituloAvisoDesafioCifra">
                                        {estado.venceu ? "DECIFRADO!" : "TENTATIVAS ESGOTADAS"}
                                    </div>
                                    <p className="textoAvisoDesafioCifra">
                                        {estado.venceu
                                            ? (modoTeste ? "Teste não vale pontos." : `Você ganhou +${estado.xpGanho ?? 0} XP hoje.`)
                                            : "Não foi dessa vez."}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className={classesBotao.join(" ")}
                            disabled={!etapaAtual || ocupado || !respostaCompleta}
                            aria-busy={fase === FASE_DECIFRANDO_CIFRA}
                            aria-label={fase === FASE_DECIFRANDO_CIFRA ? `${textoDecifrando}, ${porcentagem}%` : undefined}
                        >
                            {conteudoBotao}
                            {fase === FASE_DECIFRANDO_CIFRA && (
                                <span
                                    className="spanPreenchimentoBotaoDesafioCifra"
                                    style={{ clipPath: `inset(0 ${100 - progresso}% 0 0)` }}
                                    aria-hidden="true"
                                >
                                    {conteudoDecifrando}
                                </span>
                            )}
                        </button>
                    </form>
                </main>
            )}

            {/* Folha de baixo com a dica. Abre por cima da tela sem
                tirar a pessoa do desafio; fecha no X, no fundo ou no Esc. */}
            {dicaAberta && etapaAtual && (
                <div
                    className={`divFundoFolhaDicaDesafioCifra ${fechandoDica ? "fundoSaindoFolhaDicaDesafioCifra" : ""}`}
                    onClick={fecharDica}
                >
                    <div
                        className={`divFolhaDicaDesafioCifra ${fechandoDica ? "folhaSaindoDicaDesafioCifra" : ""}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloFolhaDicaDesafioCifra"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="spanPuxadorFolhaDicaDesafioCifra" aria-hidden="true" />
                        <div className="divCabecalhoFolhaDicaDesafioCifra">
                            <span id="tituloFolhaDicaDesafioCifra" className="tituloFolhaDicaDesafioCifra">
                                <span className="spanIconeAmbarDesafioCifra"><IconeLampadaCifra /></span>
                                {totalEtapas > 1 ? `DICA ${etapaAtual.ordem}` : "DICA"}
                            </span>
                            <button
                                type="button"
                                className="botaoFecharFolhaDicaDesafioCifra"
                                aria-label="Fechar dica"
                                onClick={fecharDica}
                            >
                                ✕
                            </button>
                        </div>
                        <p className="pTextoFolhaDicaDesafioCifra">{etapaAtual.dica}</p>
                        <span className="spanNotaFolhaDicaDesafioCifra">Ver a dica não tira pontos.</span>
                    </div>
                </div>
            )}

            {ajudaAberta && (
                <div className="divSobreposicaoDesafioCifra" onClick={() => setAjudaAberta(false)}>
                    <div className="divCartaoModalDesafioCifra" onClick={(e) => e.stopPropagation()}>
                        <div className="tituloModalDesafioCifra">COMO JOGAR</div>
                        <p className="textoModalDesafioCifra">
                            Todo dia da SEMAC tem uma senha criptografada ligada a uma palestra. Descubra
                            como ela foi cifrada e digite a resposta nas casas.
                        </p>
                        <p className="textoModalDesafioCifra">
                            Você pode errar {totalTentativas} vezes no total — acertar não gasta tentativa. Alguns
                            desafios têm duas etapas: acertar a primeira libera a resposta final e uma nova dica.
                            Ver a dica não tira pontos. Decifrar vale {estado?.xpValor ?? 25} XP.
                        </p>
                        <button className="botaoCheioDesafioCifra" onClick={() => setAjudaAberta(false)}>ENTENDI</button>
                    </div>
                </div>
            )}

            {/* Fim do desafio. Ao perder a resposta não é revelada — o
                desafio é o mesmo para todos e o dia ainda está valendo. */}
            {/* Fim de um teste: sem xp e sem revelar a resposta — quem
                não acertou pode recomeçar. */}
            {modoTeste && fimVisivel && estado?.encerrado && (
                <div className="divSobreposicaoDesafioCifra">
                    <div className="divCartaoModalDesafioCifra divCartaoFimDesafioCifra">
                        <div className={`tituloModalDesafioCifra ${estado.venceu ? "tituloVenceuDesafioCifra" : "tituloPerdeuDesafioCifra"}`}>
                            {estado.venceu ? "DECIFRADO!" : "NÃO ACERTOU"}
                        </div>
                        <p className="textoModalDesafioCifra">
                            Teste não vale pontos e não conta como jogada de participante.
                        </p>
                        <button className="botaoContornadoDesafioCifra" onClick={reiniciarTeste}>
                            {estado.venceu ? "JOGAR DE NOVO" : "TENTAR NOVAMENTE"}
                        </button>
                        <button className="botaoCheioDesafioCifra" onClick={() => navegar(ROTA_SAIDA_TESTE_DESAFIO_CIFRA)}>
                            VOLTAR AO ADMIN
                        </button>
                    </div>
                </div>
            )}

            {!modoTeste && fimVisivel && estado?.encerrado && (
                <div className="divSobreposicaoDesafioCifra">
                    <div className="divCartaoModalDesafioCifra divCartaoFimDesafioCifra">
                        <div className={`tituloModalDesafioCifra ${estado.venceu ? "tituloVenceuDesafioCifra" : "tituloPerdeuDesafioCifra"}`}>
                            {estado.venceu ? "DECIFRADO!" : "QUE PENA!"}
                        </div>
                        {estado.venceu && (estado.xpGanho ?? 0) > 0 && (
                            <div className="divXpGanhoDesafioCifra">+{estado.xpGanho} XP</div>
                        )}
                        <p className="textoModalDesafioCifra">
                            {estado.venceu
                                ? "Você decifrou a senha de hoje."
                                : "Suas tentativas acabaram. Não foi dessa vez."}
                        </p>
                        <button className="botaoContornadoDesafioCifra" onClick={() => setFimVisivel(false)}>
                            VER O DESAFIO
                        </button>
                        <button className="botaoCheioDesafioCifra" onClick={() => navegar(ROTA_SAIDA_DESAFIO_CIFRA)}>
                            VOLTAR AOS DESAFIOS
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesafioCifra;

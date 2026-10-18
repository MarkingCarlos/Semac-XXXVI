import "./sorteio.css";
import { useState, useEffect, useRef } from "preact/hooks";
import { Link } from "wouter";
import { listarBrindes } from "../Admin/data/apiBrindes.js";
import { listarSorteios, listarElegiveis, registrarGanhador } from "./data/apiSorteio.js";
import {
    abrirCanalTelaoSorteio,
    DURACAO_GIRO_TELAO_MS,
    ESTADO_INICIAL_TELAO,
    INTERVALO_PRESENCA_TELAO_MS,
    NOME_JANELA_TELAO_SORTEIO,
    ROTA_TELAO_SORTEIO,
} from "./canalTelaoSorteio.js";

/* Painel do organizador (/sorteio), usado no PC da comissão longe do
   público. Lista os sorteios do dia (cada um é um brinde); escolher um
   prepara o telão e "Sortear no telão" gira a lista na guia projetada
   (/sorteio/telao). O ganhador é decidido aqui e só a confirmação
   ("Entregue") é gravada, com quem realizou.

   O telão não tem controles: "Entregue" e "Ausente, girar de novo" ficam
   só neste painel. As duas guias conversam por canalTelaoSorteio.js. */

/* Sem batimento do telão por esse tempo, ele é dado como fechado. */
const TOLERANCIA_PRESENCA_TELAO_MS = INTERVALO_PRESENCA_TELAO_MS * 2.5;

/* Telão recém-aberto: espera ele avisar que carregou antes de girar. */
const ESPERA_ABERTURA_TELAO_MS = 5000;

function hojeIsoPainelSorteio() {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${agora.getFullYear()}-${mes}-${dia}`;
}

function formatarDiaPainelSorteio() {
    return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

/* "2026-10-18T15:00:00" → "15:00" */
const horaDoEvento = (iso) => (iso || "").slice(11, 16);

const Sorteio = () => {
    const [sorteios, setSorteios] = useState([]);
    const [brindes, setBrindes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState("");

    const [idSelecionado, setIdSelecionado] = useState(null);
    const [elegiveis, setElegiveis] = useState([]);
    const [carregandoElegiveis, setCarregandoElegiveis] = useState(false);

    /* Fluxo do sorteio selecionado:
       'preparado' → 'aguardandoTelao' (abrindo a guia) → 'girando' → 'revelado'.
       'semCandidatos' quando todos os presentes já ganharam ou saíram como ausentes. */
    const [fase, setFase] = useState("preparado");
    const [foraDaRodada, setForaDaRodada] = useState([]);
    const [ganhador, setGanhador] = useState(null);
    const [registrando, setRegistrando] = useState(false);
    const [erroAcao, setErroAcao] = useState("");

    const [telaoConectado, setTelaoConectado] = useState(false);

    const canalRef = useRef(null);
    const estadoTelaoRef = useRef(ESTADO_INICIAL_TELAO);
    const ultimoSinalTelaoRef = useRef(0);
    const giroPendenteRef = useRef(null);
    const idGiroAtualRef = useRef(0);
    const timersRef = useRef([]);
    /* O canal chama a versão mais recente do tratador, com o estado atual. */
    const tratarMensagemRef = useRef(() => {});

    const limparTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };

    const publicarNoTelao = (estado) => {
        estadoTelaoRef.current = estado;
        canalRef.current?.enviar({ tipo: "estado", estado });
    };

    async function carregarSorteiosEBrindes() {
        const [listaSorteios, listaBrindes] = await Promise.all([listarSorteios(), listarBrindes()]);
        setSorteios(listaSorteios);
        setBrindes(listaBrindes);
    }

    useEffect(() => {
        let ativo = true;
        carregarSorteiosEBrindes()
            .catch((e) => { if (ativo) setErroCarregar(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });

        const canal = abrirCanalTelaoSorteio((mensagem) => tratarMensagemRef.current(mensagem));
        canalRef.current = canal;
        /* Painel recarregado: um telão que já estava aberto volta para a
           espera, porque o sorteio em andamento se perdeu com o recarregamento. */
        canal.enviar({ tipo: "estado", estado: estadoTelaoRef.current });

        const verificarPresenca = setInterval(() => {
            setTelaoConectado(Date.now() - ultimoSinalTelaoRef.current < TOLERANCIA_PRESENCA_TELAO_MS);
        }, 1000);

        return () => {
            ativo = false;
            clearInterval(verificarPresenca);
            canal.fechar();
            limparTimers();
        };
    }, []);

    const hoje = hojeIsoPainelSorteio();
    const sorteiosDeHoje = sorteios
        .filter((sorteio) => (sorteio.eventoDataHoraInicio || "").slice(0, 10) === hoje)
        .sort((a, b) => a.eventoDataHoraInicio.localeCompare(b.eventoDataHoraInicio));

    const sorteioSelecionado = sorteiosDeHoje.find((sorteio) => sorteio.id === idSelecionado) ?? null;
    const ganhadorRegistrado = sorteioSelecionado?.ganhadores?.[0] ?? null;
    /* Cada sorteio tem um brinde; é ele que vai na entrega. */
    const brindeDoSorteio = sorteioSelecionado
        ? brindes.find((brinde) => brinde.sorteioId === sorteioSelecionado.id && !brinde.entregue)
            ?? brindes.find((brinde) => brinde.sorteioId === sorteioSelecionado.id)
            ?? null
        : null;
    const candidatos = elegiveis.filter((pessoa) => !foraDaRodada.includes(pessoa.id));
    const sorteioEmAndamento = fase === "aguardandoTelao" || fase === "girando";

    function revelar(idGiro) {
        if (idGiro !== idGiroAtualRef.current) return;
        limparTimers();
        setFase("revelado");
        publicarNoTelao({ ...estadoTelaoRef.current, fase: "revelado" });
    }

    tratarMensagemRef.current = (mensagem) => {
        switch (mensagem?.tipo) {
            case "telaoAberto":
                ultimoSinalTelaoRef.current = Date.now();
                setTelaoConectado(true);
                canalRef.current?.enviar({ tipo: "estado", estado: estadoTelaoRef.current });
                if (giroPendenteRef.current) {
                    const pendente = giroPendenteRef.current;
                    giroPendenteRef.current = null;
                    iniciarGiro(pendente.pool);
                }
                break;
            case "telaoPresente":
                ultimoSinalTelaoRef.current = Date.now();
                if (!telaoConectado) setTelaoConectado(true);
                break;
            case "telaoFechado":
                ultimoSinalTelaoRef.current = 0;
                setTelaoConectado(false);
                break;
            case "giroConcluido":
                revelar(mensagem.idGiro);
                break;
            default:
                break;
        }
    };

    function abrirTelao() {
        window.open(ROTA_TELAO_SORTEIO, NOME_JANELA_TELAO_SORTEIO);
    }

    async function selecionarSorteio(sorteio) {
        if (sorteioEmAndamento || sorteio.id === idSelecionado) return;
        limparTimers();
        setIdSelecionado(sorteio.id);
        setFase("preparado");
        setForaDaRodada([]);
        setGanhador(null);
        setErroAcao("");
        setElegiveis([]);

        /* Sorteio já entregue não mexe no telão: ele continua mostrando o
           último ganhador até um sorteio pendente ser preparado. */
        if (sorteio.quantidadeEntregue > 0) return;

        setCarregandoElegiveis(true);
        try {
            const pool = await listarElegiveis(sorteio.id);
            setElegiveis(pool);
            publicarNoTelao({
                ...ESTADO_INICIAL_TELAO,
                fase: "preparado",
                brinde: sorteio.nome,
                eventoNome: sorteio.eventoNome,
                eventoHora: horaDoEvento(sorteio.eventoDataHoraInicio),
                nomes: pool.map((pessoa) => pessoa.nome),
            });
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setCarregandoElegiveis(false);
        }
    }

    function iniciarGiro(pool) {
        if (pool.length === 0) {
            setFase("semCandidatos");
            return;
        }
        const vencedor = pool[Math.floor(Math.random() * pool.length)];
        const idGiro = Date.now();
        idGiroAtualRef.current = idGiro;
        setGanhador(vencedor);
        setFase("girando");
        publicarNoTelao({
            ...estadoTelaoRef.current,
            fase: "girando",
            /* Sem os ausentes da rodada: a roleta e a contagem do telão acompanham. */
            nomes: pool.map((pessoa) => pessoa.nome),
            vencedorNome: vencedor.nome,
            idGiro,
        });
        /* Reserva: se o telão fechar no meio, o painel revela sozinho. */
        timersRef.current.push(setTimeout(() => revelar(idGiro), DURACAO_GIRO_TELAO_MS + 3000));
    }

    function sortear(pool) {
        setErroAcao("");
        if (pool.length === 0) {
            setFase("semCandidatos");
            return;
        }
        if (telaoConectado) {
            iniciarGiro(pool);
            return;
        }
        /* Telão fechado: abre a guia e gira assim que ela avisar que
           carregou (ou depois da espera, se o aviso não vier). */
        giroPendenteRef.current = { pool };
        setFase("aguardandoTelao");
        abrirTelao();
        timersRef.current.push(setTimeout(() => {
            if (!giroPendenteRef.current) return;
            giroPendenteRef.current = null;
            iniciarGiro(pool);
        }, ESPERA_ABERTURA_TELAO_MS));
    }

    function marcarAusente() {
        const novaFora = [...foraDaRodada, ganhador.id];
        setForaDaRodada(novaFora);
        setGanhador(null);
        sortear(elegiveis.filter((pessoa) => !novaFora.includes(pessoa.id)));
    }

    async function confirmarEntrega() {
        if (!ganhador || !brindeDoSorteio) return;
        setRegistrando(true);
        setErroAcao("");
        try {
            await registrarGanhador({
                sorteioId: sorteioSelecionado.id,
                brindeId: brindeDoSorteio.id,
                participanteId: ganhador.id,
            });
            await carregarSorteiosEBrindes();
            /* O telão fica no ganhador; o painel passa a mostrar o sorteio como entregue. */
            setFase("preparado");
            setGanhador(null);
            setForaDaRodada([]);
            setElegiveis([]);
        } catch (e) {
            setErroAcao(e.message);
        } finally {
            setRegistrando(false);
        }
    }

    return (
        <main className="mainPainelSorteio">
            <header className="headerPainelSorteio">
                <div className="divTituloPainelSorteio">
                    {/* Sair no meio do giro perde o sorteio, como recarregar. */}
                    <Link
                        href="/admin"
                        className="linkVoltarAdminPainelSorteio"
                        aria-disabled={sorteioEmAndamento}
                        onClick={(e) => { if (sorteioEmAndamento) e.preventDefault(); }}
                    >
                        ← Voltar ao painel
                    </Link>
                    <h1 className="h1TituloPainelSorteio">Sorteio de brindes</h1>
                    <p className="pDiaPainelSorteio">{formatarDiaPainelSorteio()}</p>
                </div>
                <div className="divTelaoPainelSorteio">
                    <span
                        className={`spanStatusTelaoPainelSorteio ${telaoConectado ? "statusTelaoConectadoPainelSorteio" : ""}`}
                        role="status"
                    >
                        {telaoConectado ? "Telão conectado" : "Telão fechado"}
                    </span>
                    {!telaoConectado && (
                        <button type="button" className="botaoSecundarioPainelSorteio" onClick={abrirTelao}>
                            Abrir telão
                        </button>
                    )}
                </div>
            </header>

            <div className="divCorpoPainelSorteio">
                <section className="sectionListaPainelSorteio" aria-labelledby="tituloListaPainelSorteio">
                    <h2 id="tituloListaPainelSorteio" className="h2ListaPainelSorteio">
                        Sorteios de hoje
                        {!carregando && sorteiosDeHoje.length > 0 && (
                            <span className="spanContagemListaPainelSorteio">{sorteiosDeHoje.length}</span>
                        )}
                    </h2>

                    {carregando && <p className="pVazioPainelSorteio">Carregando sorteios…</p>}
                    {erroCarregar && <p className="pErroPainelSorteio" role="alert">{erroCarregar}</p>}
                    {!carregando && !erroCarregar && sorteiosDeHoje.length === 0 && (
                        <p className="pVazioPainelSorteio">
                            Nenhum sorteio cadastrado para hoje. Adicione no evento, em /admin, Conteúdo, Eventos, Editar.
                        </p>
                    )}

                    {sorteiosDeHoje.length > 0 && (
                        <ul className="ulListaPainelSorteio">
                            {sorteiosDeHoje.map((sorteio) => {
                                const entregue = sorteio.quantidadeEntregue > 0;
                                const selecionado = sorteio.id === idSelecionado;
                                return (
                                    <li key={sorteio.id}>
                                        <button
                                            type="button"
                                            className={[
                                                "botaoItemListaPainelSorteio",
                                                selecionado ? "itemSelecionadoListaPainelSorteio" : "",
                                                entregue ? "itemEntregueListaPainelSorteio" : "",
                                            ].join(" ")}
                                            aria-pressed={selecionado}
                                            disabled={sorteioEmAndamento && !selecionado}
                                            onClick={() => selecionarSorteio(sorteio)}
                                        >
                                            <span className="spanNomeItemListaPainelSorteio">{sorteio.nome}</span>
                                            <span className="spanEventoItemListaPainelSorteio">
                                                <span className="spanHoraItemListaPainelSorteio">
                                                    {horaDoEvento(sorteio.eventoDataHoraInicio)}
                                                </span>
                                                {sorteio.eventoNome}
                                            </span>
                                            <span className="spanStatusItemListaPainelSorteio">
                                                {entregue
                                                    ? `Entregue para ${sorteio.ganhadores?.[0]?.participanteNome ?? "—"}`
                                                    : "Disponível"}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="sectionControlePainelSorteio" aria-live="polite">
                    {!sorteioSelecionado && (
                        <p className="pVazioControlePainelSorteio">
                            Escolha um sorteio da lista. O telão passa a mostrar o brinde e quem está concorrendo.
                        </p>
                    )}

                    {sorteioSelecionado && (
                        <>
                            <div className="divCabecalhoControlePainelSorteio">
                                <h2 className="h2BrindeControlePainelSorteio">{sorteioSelecionado.nome}</h2>
                            </div>

                            {ganhadorRegistrado && (
                                <div className="divResultadoControlePainelSorteio">
                                    <p className="pNomeResultadoControlePainelSorteio">{ganhadorRegistrado.participanteNome}</p>
                                    <p className="pDetalheResultadoControlePainelSorteio">
                                        Recebeu o brinde, sorteado por {ganhadorRegistrado.organizadorNome}.
                                    </p>
                                </div>
                            )}

                            {!ganhadorRegistrado && (
                                <>
                                    <p className="pConcorrendoControlePainelSorteio">
                                        {carregandoElegiveis
                                            ? "Buscando quem está presente…"
                                            : `${candidatos.length} ${candidatos.length === 1 ? "presente concorrendo" : "presentes concorrendo"}`}
                                        {foraDaRodada.length > 0 && !carregandoElegiveis && (
                                            <span className="spanForaControlePainelSorteio">
                                                {" "}({foraDaRodada.length} {foraDaRodada.length === 1 ? "ausente" : "ausentes"} nesta rodada)
                                            </span>
                                        )}
                                    </p>

                                    {!brindeDoSorteio && (
                                        <p className="pErroPainelSorteio" role="alert">
                                            Este sorteio não tem brinde cadastrado. Remova e adicione de novo pelo evento.
                                        </p>
                                    )}

                                    {(fase === "preparado" || fase === "semCandidatos") && brindeDoSorteio && (
                                        <div className="divAcoesControlePainelSorteio">
                                            {fase === "semCandidatos" ? (
                                                <p className="pErroPainelSorteio" role="alert">
                                                    Ninguém mais pode concorrer: todos os presentes já ganharam um brinde
                                                    ou foram marcados como ausentes nesta rodada.
                                                </p>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="botaoPrimarioPainelSorteio"
                                                    disabled={carregandoElegiveis || candidatos.length === 0}
                                                    onClick={() => sortear(candidatos)}
                                                >
                                                    Sortear no telão
                                                </button>
                                            )}
                                            {!carregandoElegiveis && elegiveis.length === 0 && fase === "preparado" && (
                                                <p className="pDicaControlePainelSorteio">
                                                    Ninguém com presença confirmada neste evento ainda (ou todos já ganharam
                                                    um brinde). Registre as presenças no /checkin.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {fase === "aguardandoTelao" && (
                                        <p className="pAndamentoControlePainelSorteio">
                                            Abrindo o telão… arraste a nova guia para o projetor. O giro começa assim que ela carregar.
                                        </p>
                                    )}

                                    {fase === "girando" && (
                                        <p className="pAndamentoControlePainelSorteio">Sorteando no telão…</p>
                                    )}

                                    {fase === "revelado" && ganhador && (
                                        <div className="divResultadoControlePainelSorteio">
                                            <p className="pNomeResultadoControlePainelSorteio">{ganhador.nome}</p>
                                            <p className="pDetalheResultadoControlePainelSorteio">
                                                Parou no telão. Confirme a entrega se a pessoa estiver na sala.
                                            </p>
                                            <div className="divAcoesControlePainelSorteio">
                                                <button
                                                    type="button"
                                                    className="botaoPrimarioPainelSorteio"
                                                    disabled={registrando}
                                                    onClick={confirmarEntrega}
                                                >
                                                    {registrando ? "Registrando…" : "Entregue"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="botaoSecundarioPainelSorteio"
                                                    disabled={registrando}
                                                    onClick={marcarAusente}
                                                >
                                                    Ausente, girar de novo
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {erroAcao && <p className="pErroPainelSorteio" role="alert">{erroAcao}</p>}
                        </>
                    )}
                </section>
            </div>
        </main>
    );
};

export default Sorteio;

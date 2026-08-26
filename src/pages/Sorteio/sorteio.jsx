import "./sorteio.css";
import { useState, useEffect, useRef } from "preact/hooks";
import gifConfete from "../../assets/confete.gif";
import { listarEventos } from "../Admin/data/apiEventos.js";
import { listarBrindes } from "../Admin/data/apiBrindes.js";
import { listarElegiveis, registrarGanhador } from "./data/apiSorteio.js";

/* Fluxo de 3 passos: escolher o evento do dia → escolher o brinde →
   girar o rolo entre quem está com presença confirmada nesse evento.
   O vencedor é sorteado no front (resposta instantânea); só a
   confirmação final (ENTREGUE) é persistida no backend. */

const ALTURA_ITEM_ROLO = 150;
const QUANTIDADE_ITENS_ROLO = 24;
const DURACAO_GIRO_MS = 3800;

function hojeISO() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function montarRolo(candidatos, vencedor) {
    const rolo = [];
    for (let i = 0; i < QUANTIDADE_ITENS_ROLO; i++) {
        rolo.push(candidatos[Math.floor(Math.random() * candidatos.length)]);
    }
    rolo.push(vencedor);
    return rolo;
}

const Sorteio = () => {
    const [passo, setPasso] = useState("evento");

    // Passo 1 — evento
    const [eventos, setEventos] = useState([]);
    const [carregandoEventos, setCarregandoEventos] = useState(true);
    const [erroEventos, setErroEventos] = useState("");
    const [eventoEscolhido, setEventoEscolhido] = useState(null);

    // Passo 2 — brinde
    const [brindes, setBrindes] = useState([]);
    const [carregandoBrindes, setCarregandoBrindes] = useState(true);
    const [erroBrindes, setErroBrindes] = useState("");
    const [brindeEscolhido, setBrindeEscolhido] = useState(null);
    const [carregandoSorteio, setCarregandoSorteio] = useState(false);
    const [erroSorteio, setErroSorteio] = useState("");

    // Passo 3 — sorteio
    const [elegiveis, setElegiveis] = useState([]);
    const [foraDaRodada, setForaDaRodada] = useState([]);
    const [fase, setFase] = useState("girando");
    const [rolo, setRolo] = useState([]);
    const [deslocamento, setDeslocamento] = useState(0);
    const [duracaoTransicao, setDuracaoTransicao] = useState("0s");
    const [ganhador, setGanhador] = useState(null);
    const [confeteKey, setConfeteKey] = useState(0);
    const [mostrarConfete, setMostrarConfete] = useState(false);
    const [registrandoGanhador, setRegistrandoGanhador] = useState(false);
    const [erroRegistro, setErroRegistro] = useState("");
    const [semCandidatos, setSemCandidatos] = useState(false);

    const timersRef = useRef([]);

    function limparTimers() {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }

    function agendar(fn, ms) {
        timersRef.current.push(setTimeout(fn, ms));
    }

    useEffect(() => limparTimers, []);

    useEffect(() => {
        let ativo = true;
        listarEventos()
            .then((lista) => { if (ativo) setEventos(lista); })
            .catch((e) => { if (ativo) setErroEventos(e.message); })
            .finally(() => { if (ativo) setCarregandoEventos(false); });
        return () => { ativo = false; };
    }, []);

    useEffect(() => {
        let ativo = true;
        listarBrindes()
            .then((lista) => { if (ativo) setBrindes(lista); })
            .catch((e) => { if (ativo) setErroBrindes(e.message); })
            .finally(() => { if (ativo) setCarregandoBrindes(false); });
        return () => { ativo = false; };
    }, []);

    const eventosDeHoje = eventos
        .filter((evento) => evento.data === hojeISO())
        .sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""));

    function escolherEvento(evento) {
        setEventoEscolhido(evento);
        setErroSorteio("");
        setPasso("brinde");
    }

    function voltarParaEventos() {
        setPasso("evento");
        setEventoEscolhido(null);
        setBrindeEscolhido(null);
    }

    function escolherBrinde(brinde) {
        if (brinde.quantidade - brinde.quantidadeEntregue <= 0) return;
        setBrindeEscolhido(brinde);
    }

    function girar(poolAtual, foraAtual) {
        limparTimers();
        const candidatos = poolAtual.filter((p) => !foraAtual.includes(p.id));
        if (candidatos.length === 0) {
            setSemCandidatos(true);
            setGanhador(null);
            setFase("revelado");
            return;
        }
        setSemCandidatos(false);
        const vencedor = candidatos[Math.floor(Math.random() * candidatos.length)];
        setGanhador(vencedor);
        setRolo(montarRolo(candidatos, vencedor));
        setFase("girando");
        setDeslocamento(0);
        setDuracaoTransicao("0s");
        setMostrarConfete(false);
        setErroRegistro("");

        agendar(() => {
            setDeslocamento(-(QUANTIDADE_ITENS_ROLO) * ALTURA_ITEM_ROLO);
            setDuracaoTransicao("3.6s cubic-bezier(0.16,1,0.3,1)");
        }, 60);
        agendar(() => {
            setFase("revelado");
            setConfeteKey((k) => k + 1);
            setMostrarConfete(true);
            agendar(() => setMostrarConfete(false), 2490);
        }, DURACAO_GIRO_MS);
    }

    async function iniciarSorteio() {
        if (!eventoEscolhido || !brindeEscolhido) return;
        setErroSorteio("");
        setCarregandoSorteio(true);
        try {
            const pool = await listarElegiveis(eventoEscolhido.id);
            if (!pool.length) {
                setErroSorteio(
                    "Não há participantes com presença confirmada nesse evento (ou todos já ganharam algum brinde)."
                );
                return;
            }
            setElegiveis(pool);
            setForaDaRodada([]);
            setPasso("sorteio");
            girar(pool, []);
        } catch (e) {
            setErroSorteio(e.message);
        } finally {
            setCarregandoSorteio(false);
        }
    }

    function marcarAusente() {
        const novaFora = [...foraDaRodada, ganhador.id];
        setForaDaRodada(novaFora);
        girar(elegiveis, novaFora);
    }

    async function confirmarEntrega() {
        if (!ganhador) return;
        setRegistrandoGanhador(true);
        setErroRegistro("");
        try {
            await registrarGanhador({
                eventoId: eventoEscolhido.id,
                brindeId: brindeEscolhido.id,
                participanteId: ganhador.id,
            });
            const listaAtualizada = await listarBrindes();
            setBrindes(listaAtualizada);
            limparTimers();
            setPasso("brinde");
            setBrindeEscolhido(null);
            setElegiveis([]);
            setForaDaRodada([]);
            setGanhador(null);
            setFase("girando");
            setMostrarConfete(false);
        } catch (e) {
            setErroRegistro(e.message);
        } finally {
            setRegistrandoGanhador(false);
        }
    }

    function voltarParaBrindes() {
        limparTimers();
        setPasso("brinde");
        setElegiveis([]);
        setForaDaRodada([]);
        setGanhador(null);
        setFase("girando");
        setMostrarConfete(false);
    }

    return (
        <div className="divPaginaSorteio">
            {mostrarConfete && (
                <img key={confeteKey} src={gifConfete} alt="confete" className="imgConfeteTelaSorteio" />
            )}

            <div className="divPainelSorteio">
                <header className="headerPainelSorteio">
                    <div className="divTituloPainelSorteio">
                        <h1 className="h1TituloPainelSorteio">
                            {passo === "evento" && "Escolher evento"}
                            {passo === "brinde" && "Escolher brinde"}
                            {passo === "sorteio" && "Sorteio"}
                        </h1>
                        {passo === "brinde" && eventoEscolhido && (
                            <span className="spanSubtituloPainelSorteio">{eventoEscolhido.nome}</span>
                        )}
                        {passo === "sorteio" && (
                            <span className="spanSubtituloPainelSorteio">SEMAC XXXVI</span>
                        )}
                    </div>
                    {passo === "brinde" && (
                        <button type="button" className="botaoVoltarPainelSorteio" onClick={voltarParaEventos}>
                            ← Trocar evento
                        </button>
                    )}
                    {passo === "sorteio" && (
                        <button type="button" className="botaoVoltarPainelSorteio" onClick={voltarParaBrindes}>
                            ← Voltar
                        </button>
                    )}
                </header>

                <div className="divCorpoPainelSorteio">
                    {passo === "evento" && (
                        <>
                            {erroEventos && <p className="pAvisoErroSorteio" role="alert">{erroEventos}</p>}
                            {carregandoEventos && <p className="pAvisoVazioSorteio">Carregando eventos…</p>}
                            {!carregandoEventos && eventosDeHoje.length === 0 && (
                                <p className="pAvisoVazioSorteio">Nenhum evento programado para hoje.</p>
                            )}
                            {!carregandoEventos && eventosDeHoje.length > 0 && (
                                <div className="divListaEventosSorteio">
                                    {eventosDeHoje.map((evento) => (
                                        <button
                                            key={evento.id}
                                            type="button"
                                            className="botaoCartaoEventoSorteio"
                                            onClick={() => escolherEvento(evento)}
                                        >
                                            <span className="spanNomeCartaoEventoSorteio">{evento.nome}</span>
                                            <span className="spanHorarioCartaoEventoSorteio">
                                                {evento.horaInicio}
                                                {evento.horaFim ? `–${evento.horaFim}` : ""}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {passo === "brinde" && (
                        <>
                            {erroBrindes && <p className="pAvisoErroSorteio" role="alert">{erroBrindes}</p>}
                            {erroSorteio && <p className="pAvisoErroSorteio" role="alert">{erroSorteio}</p>}
                            {carregandoBrindes && <p className="pAvisoVazioSorteio">Carregando brindes…</p>}
                            {!carregandoBrindes && brindes.length === 0 && (
                                <p className="pAvisoVazioSorteio">
                                    Nenhum brinde cadastrado ainda — adicione em /admin, na aba Brindes.
                                </p>
                            )}
                            {!carregandoBrindes && brindes.length > 0 && (
                                <ul className="ulFilaBrindesSorteio">
                                    {brindes.map((brinde, indice) => {
                                        const restante = brinde.quantidade - brinde.quantidadeEntregue;
                                        const esgotado = restante <= 0;
                                        const selecionado = brindeEscolhido?.id === brinde.id;
                                        const classes = ["liItemFilaBrindesSorteio"];
                                        if (selecionado) classes.push("itemFilaSelecionadoSorteio");
                                        if (esgotado) classes.push("itemFilaEsgotadoSorteio");
                                        return (
                                            <li
                                                key={brinde.id}
                                                className={classes.join(" ")}
                                                onClick={() => escolherBrinde(brinde)}
                                            >
                                                <span className="spanIndiceItemFilaSorteio">{indice + 1}.</span>
                                                <div className="divInfoItemFilaSorteio">
                                                    <span className="spanNomeItemFilaSorteio">{brinde.nome}</span>
                                                    <span className="spanLegendaItemFilaSorteio">
                                                        {esgotado ? "Esgotado" : `${restante} disponível(is)`}
                                                    </span>
                                                </div>
                                                <span className="spanEstadoItemFilaSorteio">
                                                    {esgotado ? "ESGOTADO" : selecionado ? "SELECIONADO" : "NA FILA"}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            <div className="divRodapeEscolherBrindeSorteio">
                                <div className="divResumoBrindeSelecionadoSorteio">
                                    <span className="spanRotuloBrindeSelecionadoSorteio">
                                        Selecionado para o próximo sorteio
                                    </span>
                                    <span className="spanNomeBrindeSelecionadoSorteio">
                                        {brindeEscolhido ? brindeEscolhido.nome : "—"}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="botaoSortearSorteio"
                                    disabled={!brindeEscolhido || carregandoSorteio}
                                    onClick={iniciarSorteio}
                                >
                                    {carregandoSorteio ? "Carregando…" : "Sortear"}
                                </button>
                            </div>
                        </>
                    )}

                    {passo === "sorteio" && fase === "girando" && (
                        <div className="divConteudoGirandoSorteio">
                            <div className="divTituloPainelSorteio" style={{ alignItems: "center" }}>
                                <span className="spanRotuloSorteandoSorteio">SORTEANDO</span>
                                <span className="spanBrindeSorteandoSorteio">{brindeEscolhido?.nome}</span>
                            </div>
                            <div className="divJanelaRoloSorteio">
                                <div
                                    className="divFaixaRoloSorteio"
                                    style={{ transform: `translateY(${deslocamento}px)`, transitionDuration: duracaoTransicao }}
                                >
                                    {rolo.map((item, indice) => (
                                        <div key={indice} className="divItemRoloSorteio">
                                            <span className="spanNomeItemRoloSorteio">{item.nome}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {passo === "sorteio" && fase === "revelado" && (
                        <div className="divConteudoRevelacaoSorteio">
                            {semCandidatos ? (
                                <p className="pAvisoErroSorteio" role="alert">
                                    Todos os elegíveis já foram marcados como ausentes nesse sorteio. Volte e
                                    escolha outro brinde.
                                </p>
                            ) : (
                                <>
                                    <span className="spanRotuloGanhouSorteio">GANHOU {brindeEscolhido?.nome}</span>
                                    <div className="divCartaoGanhadorSorteio">
                                        <span className="spanNomeGanhadorSorteio">{ganhador?.nome}</span>
                                    </div>
                                    <span className="spanDicaRetiradaSorteio">
                                        Venha até a mesa da comissão para retirar
                                    </span>
                                    {erroRegistro && <p className="pAvisoErroSorteio" role="alert">{erroRegistro}</p>}
                                    <div className="divBotoesRevelacaoSorteio">
                                        <button
                                            type="button"
                                            className="botaoEntregueSorteio"
                                            disabled={registrandoGanhador}
                                            onClick={confirmarEntrega}
                                        >
                                            {registrandoGanhador ? "Registrando…" : "Entregue · Voltar para escolher"}
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoAusenteSorteio"
                                            disabled={registrandoGanhador}
                                            onClick={marcarAusente}
                                        >
                                            Ausente — girar de novo
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="divRodapeMarcaSorteio">XXXVI Semana da Computação · IBILCE/UNESP</div>
            </div>
        </div>
    );
};

export default Sorteio;

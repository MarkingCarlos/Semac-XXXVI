import "./sorteio.css";
import { useState, useEffect, useRef } from "preact/hooks";
import gifConfete from "../../assets/confete.gif";
import { listarBrindes } from "../Admin/data/apiBrindes.js";
import { listarSorteios, listarElegiveis, registrarGanhador } from "./data/apiSorteio.js";

/* Fluxo de 3 passos: escolher um dos sorteios do dia (cadastrados no
   /admin, aba Brindes → Sorteios) → escolher um brinde desse sorteio →
   girar o rolo entre quem está com presença confirmada no evento do
   sorteio. O vencedor é sorteado no front (resposta instantânea); só a
   confirmação final (ENTREGUE) é persistida, com quem realizou. */

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
    const [passo, setPasso] = useState("listaSorteios");

    // Passo 1 — sorteio
    const [sorteios, setSorteios] = useState([]);
    const [carregandoSorteios, setCarregandoSorteios] = useState(true);
    const [erroSorteios, setErroSorteios] = useState("");
    const [sorteioEscolhido, setSorteioEscolhido] = useState(null);

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
        listarSorteios()
            .then((lista) => { if (ativo) setSorteios(lista); })
            .catch((e) => { if (ativo) setErroSorteios(e.message); })
            .finally(() => { if (ativo) setCarregandoSorteios(false); });
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

    /* eventoDataHoraInicio chega como "2026-10-05T14:00:00". */
    const sorteiosDeHoje = sorteios
        .filter((sorteio) => (sorteio.eventoDataHoraInicio || "").slice(0, 10) === hojeISO())
        .sort((a, b) => a.eventoDataHoraInicio.localeCompare(b.eventoDataHoraInicio));

    const brindesDoSorteio = brindes.filter((brinde) => brinde.sorteioId === sorteioEscolhido?.id);

    function escolherSorteio(sorteio) {
        setSorteioEscolhido(sorteio);
        setErroSorteio("");
        setPasso("brinde");
    }

    function voltarParaSorteios() {
        setPasso("listaSorteios");
        setSorteioEscolhido(null);
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
        if (!sorteioEscolhido || !brindeEscolhido) return;
        setErroSorteio("");
        setCarregandoSorteio(true);
        try {
            const pool = await listarElegiveis(sorteioEscolhido.id);
            if (!pool.length) {
                setErroSorteio(
                    "Não há participantes com presença confirmada no evento deste sorteio (ou todos já ganharam algum brinde)."
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
                sorteioId: sorteioEscolhido.id,
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
                            {passo === "listaSorteios" && "Escolher sorteio"}
                            {passo === "brinde" && "Escolher brinde"}
                            {passo === "sorteio" && "Sorteio"}
                        </h1>
                        {passo === "brinde" && sorteioEscolhido && (
                            <span className="spanSubtituloPainelSorteio">
                                {sorteioEscolhido.nome} · {sorteioEscolhido.eventoNome}
                            </span>
                        )}
                        {passo === "sorteio" && (
                            <span className="spanSubtituloPainelSorteio">SEMAC XXXVI</span>
                        )}
                    </div>
                    {passo === "brinde" && (
                        <button type="button" className="botaoVoltarPainelSorteio" onClick={voltarParaSorteios}>
                            ← Trocar sorteio
                        </button>
                    )}
                    {passo === "sorteio" && (
                        <button type="button" className="botaoVoltarPainelSorteio" onClick={voltarParaBrindes}>
                            ← Voltar
                        </button>
                    )}
                </header>

                <div className="divCorpoPainelSorteio">
                    {passo === "listaSorteios" && (
                        <>
                            {erroSorteios && <p className="pAvisoErroSorteio" role="alert">{erroSorteios}</p>}
                            {carregandoSorteios && <p className="pAvisoVazioSorteio">Carregando sorteios…</p>}
                            {!carregandoSorteios && sorteiosDeHoje.length === 0 && (
                                <p className="pAvisoVazioSorteio">
                                    Nenhum sorteio programado para hoje — cadastre em /admin, aba Brindes → Sorteios.
                                </p>
                            )}
                            {!carregandoSorteios && sorteiosDeHoje.length > 0 && (
                                <div className="divListaEventosSorteio">
                                    {sorteiosDeHoje.map((sorteio) => (
                                        <button
                                            key={sorteio.id}
                                            type="button"
                                            className="botaoCartaoEventoSorteio"
                                            onClick={() => escolherSorteio(sorteio)}
                                        >
                                            <span className="spanNomeCartaoEventoSorteio">{sorteio.nome}</span>
                                            <span className="spanHorarioCartaoEventoSorteio">
                                                {sorteio.eventoDataHoraInicio.slice(11, 16)} · {sorteio.eventoNome}
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
                            {!carregandoBrindes && brindesDoSorteio.length === 0 && (
                                <p className="pAvisoVazioSorteio">
                                    Nenhum brinde neste sorteio — adicione em /admin, na aba Brindes.
                                </p>
                            )}
                            {!carregandoBrindes && brindesDoSorteio.length > 0 && (
                                <ul className="ulFilaBrindesSorteio">
                                    {brindesDoSorteio.map((brinde, indice) => {
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

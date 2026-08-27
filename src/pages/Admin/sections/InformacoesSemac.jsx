import { useState, useEffect } from 'preact/hooks';
import PainelLateral from '../../Financas/components/PainelLateral.jsx';
import CampoMoeda from '../../Financas/components/CampoMoeda.jsx';
import { formatarCentavos } from '../../Financas/utils/moeda.js';
import {
    listarTiposInscricao,
    criarTipoInscricao,
    atualizarTipoInscricao,
    excluirTipoInscricao,
} from '../data/apiTipoInscricao.js';
import {
    listarCotas,
    criarCota,
    atualizarCota,
    excluirCota,
} from '../../Financas/data/apiCotas.js';
import {
    listarNiveis,
    criarNivel,
    atualizarNivel,
    excluirNivel,
} from '../data/apiNivel.js';
import {
    lerCamisetaExtra,
    salvarCamisetaExtra,
} from '../data/apiCamisetaExtra.js';
import {
    lerMetaDoacao,
    salvarMetaDoacao,
} from '../data/apiMetaDoacao.js';

/* Informações SEMAC — cinco blocos:
   1. Tipos de ingresso (tabela `tipo_inscricao`) da edição atual;
   2. Preço da camiseta avulsa (tabela `camiseta_extra`), um por edição;
   3. Meta de doação (tabela `meta_doacao`), um por edição;
   4. Níveis de participante (tabela `nivel`), nome + xp mínimo;
   5. Cotas de patrocínio (tabela `cota`), nível + valor.
   Valores de ingresso/cota/meta em centavos na interface, convertidos na
   borda da API. Xp mínimo do nível é inteiro puro, sem conversão.

   Os benefícios e as cores de cada cota seguem no código
   (src/data/cotas.js) — aqui só se gerencia o valor. */

const ANO_ATUAL = new Date().getFullYear();

const FORMULARIO_VAZIO = {
    nome: '',
    valor: 0,
    ativo: true,
    camisetasGratis: 0,
    porDia: false,
    maxDias: 1,
};

/* Rótulo do direito a camiseta exibido no card do ingresso — é o que o
   participante vê no cadastro, então vale conferir aqui. */
function rotuloCamisetasIngresso(quantidade) {
    if (!quantidade) return 'Sem camiseta';
    return quantidade === 1 ? '1 camiseta grátis' : `${quantidade} camisetas grátis`;
}

/* Espelha o enum NivelPatrocinio do backend — um registro por nível,
   então só se pode criar cota de um nível ainda não cadastrado. */
const NIVEIS_PATROCINIO = [
    { valor: 'APOIADOR', rotulo: 'Apoiador' },
    { valor: 'BRONZE', rotulo: 'Bronze' },
    { valor: 'PRATA', rotulo: 'Prata' },
    { valor: 'OURO', rotulo: 'Ouro' },
    { valor: 'PLATINA', rotulo: 'Platina' },
    { valor: 'ESPECIAL', rotulo: 'Especial' },
];

const rotuloDoNivel = (nivel) =>
    NIVEIS_PATROCINIO.find((n) => n.valor === nivel)?.rotulo ?? nivel;

const porValorCrescente = (a, b) => a.valor - b.valor;

export default function InformacoesSemac() {
    const [tipos, setTipos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);

    /* ── Preço da camiseta avulsa ─────────────────────────────── */
    const [precoCamiseta, setPrecoCamiseta] = useState(0);
    const [rascunhoPrecoCamiseta, setRascunhoPrecoCamiseta] = useState(0);
    const [editandoPrecoCamiseta, setEditandoPrecoCamiseta] = useState(false);
    const [salvandoPrecoCamiseta, setSalvandoPrecoCamiseta] = useState(false);
    const [erroPrecoCamiseta, setErroPrecoCamiseta] = useState('');

    /* ── Meta de doação ────────────────────────────────────────── */
    const [metaDoacao, setMetaDoacao] = useState(0);
    const [rascunhoMetaDoacao, setRascunhoMetaDoacao] = useState(0);
    const [editandoMetaDoacao, setEditandoMetaDoacao] = useState(false);
    const [salvandoMetaDoacao, setSalvandoMetaDoacao] = useState(false);
    const [erroMetaDoacao, setErroMetaDoacao] = useState('');

    /* ── Cotas de patrocínio ──────────────────────────────────── */
    const [cotas, setCotas] = useState([]);
    const [carregandoCotas, setCarregandoCotas] = useState(true);
    const [erroCotas, setErroCotas] = useState('');
    const [salvandoCota, setSalvandoCota] = useState(false);

    const [painelCotaAberto, setPainelCotaAberto] = useState(false);
    const [formularioCota, setFormularioCota] = useState({ nivel: '', valor: 0 });
    const [idCotaEmEdicao, setIdCotaEmEdicao] = useState(null);
    const [idCotaConfirmandoExclusao, setIdCotaConfirmandoExclusao] = useState(null);

    /* Níveis ainda sem cota — em dev a lista nasce vazia (os 6 já existem). */
    const niveisDisponiveis = NIVEIS_PATROCINIO.filter(
        (nivel) => !cotas.some((cota) => cota.nivel === nivel.valor)
    );

    /* ── Níveis de participante ───────────────────────────────── */
    const [niveisParticipante, setNiveisParticipante] = useState([]);
    const [carregandoNiveisParticipante, setCarregandoNiveisParticipante] = useState(true);
    const [erroNiveisParticipante, setErroNiveisParticipante] = useState('');
    const [salvandoNivelParticipante, setSalvandoNivelParticipante] = useState(false);

    const [painelNivelParticipanteAberto, setPainelNivelParticipanteAberto] = useState(false);
    const [formularioNivelParticipante, setFormularioNivelParticipante] = useState({ nome: '', xpMinimo: 0 });
    const [idNivelParticipanteEmEdicao, setIdNivelParticipanteEmEdicao] = useState(null);
    const [idNivelParticipanteConfirmandoExclusao, setIdNivelParticipanteConfirmandoExclusao] = useState(null);

    const porXpMinimoCrescente = (a, b) => a.xpMinimo - b.xpMinimo;

    useEffect(() => {
        let ativo = true;
        listarTiposInscricao(ANO_ATUAL)
            .then((lista) => { if (ativo) setTipos(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        lerCamisetaExtra(ANO_ATUAL)
            .then((centavos) => { if (ativo) { setPrecoCamiseta(centavos); setRascunhoPrecoCamiseta(centavos); } })
            .catch((e) => { if (ativo) setErroPrecoCamiseta(e.message); });
        lerMetaDoacao(ANO_ATUAL)
            .then((centavos) => { if (ativo) { setMetaDoacao(centavos); setRascunhoMetaDoacao(centavos); } })
            .catch((e) => { if (ativo) setErroMetaDoacao(e.message); });
        listarCotas()
            .then((lista) => { if (ativo) setCotas([...lista].sort(porValorCrescente)); })
            .catch((e) => { if (ativo) setErroCotas(e.message); })
            .finally(() => { if (ativo) setCarregandoCotas(false); });
        listarNiveis()
            .then((lista) => { if (ativo) setNiveisParticipante([...lista].sort(porXpMinimoCrescente)); })
            .catch((e) => { if (ativo) setErroNiveisParticipante(e.message); })
            .finally(() => { if (ativo) setCarregandoNiveisParticipante(false); });
        return () => { ativo = false; };
    }, []);

    const abrirNovoNivelParticipante = () => {
        setFormularioNivelParticipante({ nome: '', xpMinimo: 0 });
        setIdNivelParticipanteEmEdicao(null);
        setErroNiveisParticipante('');
        setPainelNivelParticipanteAberto(true);
    };

    const abrirEdicaoNivelParticipante = (nivel) => {
        setFormularioNivelParticipante({ nome: nivel.nome, xpMinimo: nivel.xpMinimo });
        setIdNivelParticipanteEmEdicao(nivel.id);
        setErroNiveisParticipante('');
        setPainelNivelParticipanteAberto(true);
    };

    const salvarNivelParticipante = async (evento) => {
        evento.preventDefault();
        setSalvandoNivelParticipante(true);
        setErroNiveisParticipante('');
        try {
            if (idNivelParticipanteEmEdicao !== null) {
                const atualizado = await atualizarNivel(idNivelParticipanteEmEdicao, formularioNivelParticipante);
                setNiveisParticipante(
                    niveisParticipante
                        .map((n) => (n.id === idNivelParticipanteEmEdicao ? atualizado : n))
                        .sort(porXpMinimoCrescente)
                );
            } else {
                const criado = await criarNivel(formularioNivelParticipante);
                setNiveisParticipante([...niveisParticipante, criado].sort(porXpMinimoCrescente));
            }
            setPainelNivelParticipanteAberto(false);
        } catch (e) {
            setErroNiveisParticipante(e.message);
        } finally {
            setSalvandoNivelParticipante(false);
        }
    };

    const removerNivelParticipante = async (id) => {
        if (idNivelParticipanteConfirmandoExclusao !== id) {
            setIdNivelParticipanteConfirmandoExclusao(id);
            return;
        }
        setErroNiveisParticipante('');
        try {
            await excluirNivel(id);
            setNiveisParticipante(niveisParticipante.filter((n) => n.id !== id));
        } catch (e) {
            setErroNiveisParticipante(e.message);
        } finally {
            setIdNivelParticipanteConfirmandoExclusao(null);
        }
    };

    /* ── Preço da camiseta avulsa ─────────────────────────────── */

    const editarPrecoCamiseta = () => {
        setRascunhoPrecoCamiseta(precoCamiseta);
        setErroPrecoCamiseta('');
        setEditandoPrecoCamiseta(true);
    };

    const cancelarPrecoCamiseta = () => {
        setRascunhoPrecoCamiseta(precoCamiseta);
        setEditandoPrecoCamiseta(false);
    };

    const confirmarPrecoCamiseta = async () => {
        setSalvandoPrecoCamiseta(true);
        setErroPrecoCamiseta('');
        try {
            const salvo = await salvarCamisetaExtra(ANO_ATUAL, rascunhoPrecoCamiseta);
            setPrecoCamiseta(salvo);
            setRascunhoPrecoCamiseta(salvo);
            setEditandoPrecoCamiseta(false);
        } catch (e) {
            setErroPrecoCamiseta(e.message);
        } finally {
            setSalvandoPrecoCamiseta(false);
        }
    };

    /* Enter confirma, Esc descarta — mesmo atalho do card "Caixa anterior". */
    const teclasPrecoCamiseta = (evento) => {
        if (evento.key === 'Enter') { evento.preventDefault(); confirmarPrecoCamiseta(); }
        if (evento.key === 'Escape') { evento.preventDefault(); cancelarPrecoCamiseta(); }
    };

    /* ── Meta de doação ────────────────────────────────────────── */

    const editarMetaDoacao = () => {
        setRascunhoMetaDoacao(metaDoacao);
        setErroMetaDoacao('');
        setEditandoMetaDoacao(true);
    };

    const cancelarMetaDoacao = () => {
        setRascunhoMetaDoacao(metaDoacao);
        setEditandoMetaDoacao(false);
    };

    const confirmarMetaDoacao = async () => {
        setSalvandoMetaDoacao(true);
        setErroMetaDoacao('');
        try {
            const salvo = await salvarMetaDoacao(ANO_ATUAL, rascunhoMetaDoacao);
            setMetaDoacao(salvo);
            setRascunhoMetaDoacao(salvo);
            setEditandoMetaDoacao(false);
        } catch (e) {
            setErroMetaDoacao(e.message);
        } finally {
            setSalvandoMetaDoacao(false);
        }
    };

    const teclasMetaDoacao = (evento) => {
        if (evento.key === 'Enter') { evento.preventDefault(); confirmarMetaDoacao(); }
        if (evento.key === 'Escape') { evento.preventDefault(); cancelarMetaDoacao(); }
    };

    const abrirNovo = () => {
        setFormulario(FORMULARIO_VAZIO);
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicao = (tipo) => {
        setFormulario({
            nome: tipo.nome,
            valor: tipo.valor,
            ativo: tipo.ativo,
            camisetasGratis: tipo.camisetasGratis ?? 0,
            porDia: tipo.porDia ?? false,
            maxDias: tipo.maxDias ?? 1,
        });
        setIdEmEdicao(tipo.id);
        setPainelAberto(true);
    };

    const salvar = async (evento) => {
        evento.preventDefault();
        const registro = { ...formulario, ano: ANO_ATUAL };

        setSalvando(true);
        setErro('');
        try {
            if (idEmEdicao !== null) {
                const atualizado = await atualizarTipoInscricao(idEmEdicao, registro);
                setTipos(tipos.map((t) => (t.id === idEmEdicao ? atualizado : t)));
            } else {
                const criado = await criarTipoInscricao(registro);
                setTipos([...tipos, criado].sort((a, b) => a.nome.localeCompare(b.nome)));
            }
            setPainelAberto(false);
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvando(false);
        }
    };

    const excluir = async (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setErro('');
        try {
            await excluirTipoInscricao(id);
            setTipos(tipos.filter((t) => t.id !== id));
        } catch (e) {
            setErro(e.message);
        } finally {
            setIdConfirmandoExclusao(null);
        }
    };

    /* ── Ações das cotas ──────────────────────────────────────── */

    const abrirNovaCota = () => {
        if (niveisDisponiveis.length === 0) return;
        setFormularioCota({ nivel: niveisDisponiveis[0].valor, valor: 0 });
        setIdCotaEmEdicao(null);
        setErroCotas('');
        setPainelCotaAberto(true);
    };

    /* Na edição o nível fica fixo — trocá-lo mudaria a identidade da
       cota e dos patrocinadores já vinculados a ela. */
    const abrirEdicaoCota = (cota) => {
        setFormularioCota({ nivel: cota.nivel, valor: cota.valor });
        setIdCotaEmEdicao(cota.id);
        setErroCotas('');
        setPainelCotaAberto(true);
    };

    const salvarCota = async (evento) => {
        evento.preventDefault();
        setSalvandoCota(true);
        setErroCotas('');
        try {
            if (idCotaEmEdicao !== null) {
                const atualizada = await atualizarCota(idCotaEmEdicao, formularioCota);
                setCotas(
                    cotas
                        .map((c) => (c.id === idCotaEmEdicao ? atualizada : c))
                        .sort(porValorCrescente)
                );
            } else {
                const criada = await criarCota(formularioCota);
                setCotas([...cotas, criada].sort(porValorCrescente));
            }
            setPainelCotaAberto(false);
        } catch (e) {
            setErroCotas(e.message);
        } finally {
            setSalvandoCota(false);
        }
    };

    /* O backend devolve 409 quando há patrocinador vinculado — a
       mensagem dele é exibida como está. */
    const removerCota = async (id) => {
        if (idCotaConfirmandoExclusao !== id) {
            setIdCotaConfirmandoExclusao(id);
            return;
        }
        setErroCotas('');
        try {
            await excluirCota(id);
            setCotas(cotas.filter((c) => c.id !== id));
        } catch (e) {
            setErroCotas(e.message);
        } finally {
            setIdCotaConfirmandoExclusao(null);
        }
    };

    return (
        <div className="conteudoInfoSemac">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Informações SEMAC</h1>
                    <p className="subtituloSecaoFinancas">
                        Ingressos e cotas de patrocínio — edição {ANO_ATUAL}
                    </p>
                </div>
            </header>

            {/* ── Tipos de ingresso ───────────────────────────── */}
            <section className="blocoInfoSemac" aria-label="Tipos de ingresso">
                <div className="cabecalhoBlocoInfoSemac">
                    <h2 className="tituloBlocoInfoSemac">Tipos de ingresso</h2>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovo}>
                        + Novo ingresso
                    </button>
                </div>

                {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

                {carregando ? (
                    <p className="estadoCarregandoParticipantesAdmin">Carregando ingressos…</p>
                ) : tipos.length === 0 ? (
                    <div className="vazioInfoSemac">
                        Nenhum ingresso cadastrado para {ANO_ATUAL}. Crie o primeiro.
                    </div>
                ) : (
                    <div className="gradeIngressosInfoSemac">
                        {tipos.map((tipo) => (
                            <div className="cartaoIngressoInfoSemac" key={tipo.id}>
                                <div className="topoCartaoIngressoInfoSemac">
                                    <span className="nomeIngressoInfoSemac">{tipo.nome}</span>
                                    <span className={`badgeContaAdmin ${tipo.ativo ? 'badgeContaAtivoAdmin' : 'badgeContaInativoAdmin'}`}>
                                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <span className="valorIngressoInfoSemac">
                                    {formatarCentavos(tipo.valor)}
                                    {tipo.porDia && <span className="sufixoValorIngressoInfoSemac"> / dia</span>}
                                </span>
                                <div className="etiquetasIngressoInfoSemac">
                                    <span className={`etiquetaIngressoInfoSemac ${tipo.camisetasGratis > 0 ? 'etiquetaCamisetaIngressoInfoSemac' : ''}`}>
                                        {rotuloCamisetasIngresso(tipo.camisetasGratis)}
                                    </span>
                                    {tipo.porDia && (
                                        <span className="etiquetaIngressoInfoSemac">
                                            até {tipo.maxDias} {tipo.maxDias === 1 ? 'diária' : 'diárias'}
                                        </span>
                                    )}
                                </div>
                                <div className="acoesCartaoIngressoInfoSemac">
                                    <button
                                        type="button"
                                        className="botaoAcaoLinhaFinancas"
                                        aria-label={`Editar ${tipo.nome}`}
                                        title="Editar"
                                        onClick={() => abrirEdicao(tipo)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className={
                                            idConfirmandoExclusao === tipo.id
                                                ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                : 'botaoAcaoLinhaFinancas'
                                        }
                                        aria-label={
                                            idConfirmandoExclusao === tipo.id
                                                ? `Confirmar exclusão de ${tipo.nome}`
                                                : `Excluir ${tipo.nome}`
                                        }
                                        title={
                                            idConfirmandoExclusao === tipo.id
                                                ? 'Clique novamente para confirmar'
                                                : 'Excluir'
                                        }
                                        onClick={() => excluir(tipo.id)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Preço da camiseta avulsa ────────────────────── */}
            <section className="blocoInfoSemac" aria-label="Camiseta avulsa">
                <div className="cabecalhoBlocoInfoSemac">
                    <div>
                        <h2 className="tituloBlocoInfoSemac">Camiseta avulsa</h2>
                        <p className="notaBlocoInfoSemac">
                            Quanto custa cada camiseta além das inclusas no ingresso. É o preço
                            oferecido na etapa de camiseta do cadastro.
                        </p>
                    </div>
                </div>

                {erroPrecoCamiseta && <p className="avisoErroAdmin" role="alert">{erroPrecoCamiseta}</p>}

                <div className="cartaoPrecoCamisetaInfoSemac">
                    <span className="rotuloPrecoCamisetaInfoSemac">Preço por unidade</span>
                    {editandoPrecoCamiseta ? (
                        <div className="edicaoPrecoCamisetaInfoSemac">
                            <CampoMoeda
                                id="campoPrecoCamisetaExtra"
                                valorCentavos={rascunhoPrecoCamiseta}
                                aoMudar={setRascunhoPrecoCamiseta}
                                aoTeclar={teclasPrecoCamiseta}
                                rotuloAcessivel="Preço da camiseta avulsa"
                                autoFoco
                            />
                            <button
                                type="button"
                                className="botaoAcaoLinhaFinancas"
                                aria-label="Salvar preço da camiseta"
                                title="Salvar"
                                disabled={salvandoPrecoCamiseta}
                                onClick={confirmarPrecoCamiseta}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="botaoAcaoLinhaFinancas"
                                aria-label="Descartar alteração no preço da camiseta"
                                title="Descartar"
                                onClick={cancelarPrecoCamiseta}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="edicaoPrecoCamisetaInfoSemac">
                            <span className="valorIngressoInfoSemac">{formatarCentavos(precoCamiseta)}</span>
                            <button
                                type="button"
                                className="botaoAcaoLinhaFinancas"
                                aria-label="Editar preço da camiseta"
                                title="Editar"
                                onClick={editarPrecoCamiseta}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Meta de doação ─────────────────────────────── */}
            <section className="blocoInfoSemac" aria-label="Meta de doação">
                <div className="cabecalhoBlocoInfoSemac">
                    <div>
                        <h2 className="tituloBlocoInfoSemac">Meta de doação</h2>
                        <p className="notaBlocoInfoSemac">
                            Valor exibido na barra de progresso da campanha de doação, na
                            página pública.
                        </p>
                    </div>
                </div>

                {erroMetaDoacao && <p className="avisoErroAdmin" role="alert">{erroMetaDoacao}</p>}

                <div className="cartaoPrecoCamisetaInfoSemac">
                    <span className="rotuloPrecoCamisetaInfoSemac">Meta de arrecadação</span>
                    {editandoMetaDoacao ? (
                        <div className="edicaoPrecoCamisetaInfoSemac">
                            <CampoMoeda
                                id="campoMetaDoacao"
                                valorCentavos={rascunhoMetaDoacao}
                                aoMudar={setRascunhoMetaDoacao}
                                aoTeclar={teclasMetaDoacao}
                                rotuloAcessivel="Meta de doação"
                                autoFoco
                            />
                            <button
                                type="button"
                                className="botaoAcaoLinhaFinancas"
                                aria-label="Salvar meta de doação"
                                title="Salvar"
                                disabled={salvandoMetaDoacao}
                                onClick={confirmarMetaDoacao}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="botaoAcaoLinhaFinancas"
                                aria-label="Descartar alteração na meta de doação"
                                title="Descartar"
                                onClick={cancelarMetaDoacao}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="edicaoPrecoCamisetaInfoSemac">
                            <span className="valorIngressoInfoSemac">{formatarCentavos(metaDoacao)}</span>
                            <button
                                type="button"
                                className="botaoAcaoLinhaFinancas"
                                aria-label="Editar meta de doação"
                                title="Editar"
                                onClick={editarMetaDoacao}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Níveis de participante ──────────────────────── */}
            <section className="blocoInfoSemac" aria-label="Níveis de participante">
                <div className="cabecalhoBlocoInfoSemac">
                    <h2 className="tituloBlocoInfoSemac">Níveis de participante</h2>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoNivelParticipante}>
                        + Novo nível
                    </button>
                </div>

                {erroNiveisParticipante && <p className="avisoErroAdmin" role="alert">{erroNiveisParticipante}</p>}

                {carregandoNiveisParticipante ? (
                    <p className="estadoCarregandoParticipantesAdmin">Carregando níveis…</p>
                ) : niveisParticipante.length === 0 ? (
                    <div className="vazioInfoSemac">
                        Nenhum nível cadastrado. Crie o primeiro para que participantes confirmados possam ser associados a ele.
                    </div>
                ) : (
                    <div className="gradeIngressosInfoSemac">
                        {niveisParticipante.map((nivel) => (
                            <div className="cartaoIngressoInfoSemac" key={nivel.id}>
                                <div className="topoCartaoIngressoInfoSemac">
                                    <span className="nomeIngressoInfoSemac">{nivel.nome}</span>
                                </div>
                                <span className="valorIngressoInfoSemac">{nivel.xpMinimo} xp</span>
                                <div className="acoesCartaoIngressoInfoSemac">
                                    <button
                                        type="button"
                                        className="botaoAcaoLinhaFinancas"
                                        aria-label={`Editar ${nivel.nome}`}
                                        title="Editar"
                                        onClick={() => abrirEdicaoNivelParticipante(nivel)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className={
                                            idNivelParticipanteConfirmandoExclusao === nivel.id
                                                ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                : 'botaoAcaoLinhaFinancas'
                                        }
                                        aria-label={
                                            idNivelParticipanteConfirmandoExclusao === nivel.id
                                                ? `Confirmar exclusão de ${nivel.nome}`
                                                : `Excluir ${nivel.nome}`
                                        }
                                        title={
                                            idNivelParticipanteConfirmandoExclusao === nivel.id
                                                ? 'Clique novamente para confirmar'
                                                : 'Excluir'
                                        }
                                        onClick={() => removerNivelParticipante(nivel.id)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Cotas de patrocínio ─────────────────────────── */}
            <section className="blocoInfoSemac" aria-label="Cotas de patrocínio">
                <div className="cabecalhoBlocoInfoSemac">
                    <div>
                        <h2 className="tituloBlocoInfoSemac">Cotas de patrocínio</h2>
                        <p className="notaBlocoInfoSemac">
                            Benefícios e cores de cada cota seguem definidos no código —
                            aqui se gerencia o valor exibido na página /cotas.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="botaoPrimarioFinancas"
                        onClick={abrirNovaCota}
                        disabled={niveisDisponiveis.length === 0}
                        title={
                            niveisDisponiveis.length === 0
                                ? 'Todos os níveis já possuem cota cadastrada'
                                : undefined
                        }
                    >
                        + Nova cota
                    </button>
                </div>

                {erroCotas && <p className="avisoErroAdmin" role="alert">{erroCotas}</p>}

                {carregandoCotas ? (
                    <p className="estadoCarregandoParticipantesAdmin">Carregando cotas…</p>
                ) : cotas.length === 0 ? (
                    <div className="vazioInfoSemac">
                        Nenhuma cota cadastrada. Crie as cotas para que os valores apareçam na página /cotas.
                    </div>
                ) : (
                    <div className="gradeIngressosInfoSemac">
                        {cotas.map((cota) => (
                            <div className="cartaoIngressoInfoSemac" key={cota.id}>
                                <div className="topoCartaoIngressoInfoSemac">
                                    <span className="nomeIngressoInfoSemac">{rotuloDoNivel(cota.nivel)}</span>
                                </div>
                                <span className="valorIngressoInfoSemac">
                                    {cota.valor === 0 ? 'Sob consulta' : formatarCentavos(cota.valor)}
                                </span>
                                <div className="acoesCartaoIngressoInfoSemac">
                                    <button
                                        type="button"
                                        className="botaoAcaoLinhaFinancas"
                                        aria-label={`Editar cota ${rotuloDoNivel(cota.nivel)}`}
                                        title="Editar"
                                        onClick={() => abrirEdicaoCota(cota)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className={
                                            idCotaConfirmandoExclusao === cota.id
                                                ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                : 'botaoAcaoLinhaFinancas'
                                        }
                                        aria-label={
                                            idCotaConfirmandoExclusao === cota.id
                                                ? `Confirmar exclusão da cota ${rotuloDoNivel(cota.nivel)}`
                                                : `Excluir cota ${rotuloDoNivel(cota.nivel)}`
                                        }
                                        title={
                                            idCotaConfirmandoExclusao === cota.id
                                                ? 'Clique novamente para confirmar'
                                                : 'Excluir'
                                        }
                                        onClick={() => removerCota(cota.id)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <PainelLateral
                aberto={painelAberto}
                titulo={idEmEdicao !== null ? 'Editar ingresso' : 'Novo ingresso'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvar}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeIngresso">
                            Tipo de ingresso *
                        </label>
                        <input
                            id="campoNomeIngresso"
                            className="entradaFormularioFinancas"
                            required
                            placeholder="ex.: Ingresso Permanência"
                            value={formulario.nome}
                            onInput={(e) => setFormulario({ ...formulario, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoValorIngresso">
                            {formulario.porDia ? 'Valor por dia *' : 'Valor *'}
                        </label>
                        <CampoMoeda
                            id="campoValorIngresso"
                            valorCentavos={formulario.valor}
                            aoMudar={(centavos) => setFormulario({ ...formulario, valor: centavos })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoCamisetasGratisIngresso">
                            Camisetas grátis inclusas
                        </label>
                        <input
                            id="campoCamisetasGratisIngresso"
                            className="entradaFormularioFinancas"
                            type="number"
                            min="0"
                            max="5"
                            value={formulario.camisetasGratis}
                            onInput={(e) => setFormulario({
                                ...formulario,
                                camisetasGratis: Number(e.currentTarget.value) || 0,
                            })}
                        />
                        <p className="ajudaCampoInfoSemac">
                            0 deixa a camiseta como compra opcional. Acima de 1, o participante
                            escolhe modelagem e tamanho uma única vez e recebe todas iguais.
                        </p>
                    </div>

                    <label className="campoCheckboxInfoSemac">
                        <input
                            type="checkbox"
                            checked={formulario.porDia}
                            onInput={(e) => setFormulario({ ...formulario, porDia: e.currentTarget.checked })}
                        />
                        <span>Cobrar por diária (o valor acima passa a valer por dia)</span>
                    </label>

                    {formulario.porDia && (
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoMaxDiasIngresso">
                                Máximo de diárias *
                            </label>
                            <input
                                id="campoMaxDiasIngresso"
                                className="entradaFormularioFinancas"
                                type="number"
                                min="1"
                                max="15"
                                required
                                value={formulario.maxDias}
                                onInput={(e) => setFormulario({
                                    ...formulario,
                                    maxDias: Number(e.currentTarget.value) || 1,
                                })}
                            />
                            <p className="ajudaCampoInfoSemac">
                                Quantos dias o participante pode escolher no cadastro. Normalmente
                                é a duração da semana.
                            </p>
                        </div>
                    )}

                    <label className="campoCheckboxInfoSemac">
                        <input
                            type="checkbox"
                            checked={formulario.ativo}
                            onInput={(e) => setFormulario({ ...formulario, ativo: e.currentTarget.checked })}
                        />
                        <span>Ingresso ativo (disponível para seleção no cadastro)</span>
                    </label>

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvando}>
                            {salvando
                                ? 'Salvando…'
                                : idEmEdicao !== null
                                    ? 'Salvar alterações'
                                    : 'Adicionar ingresso'}
                        </button>
                    </div>
                </form>
            </PainelLateral>

            <PainelLateral
                aberto={painelCotaAberto}
                titulo={idCotaEmEdicao !== null ? 'Editar cota' : 'Nova cota'}
                aoFechar={() => setPainelCotaAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarCota}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNivelCota">
                            Nível *
                        </label>
                        {idCotaEmEdicao !== null ? (
                            <input
                                id="campoNivelCota"
                                className="entradaFormularioFinancas"
                                value={rotuloDoNivel(formularioCota.nivel)}
                                disabled
                            />
                        ) : (
                            <select
                                id="campoNivelCota"
                                className="entradaFormularioFinancas"
                                required
                                value={formularioCota.nivel}
                                onInput={(e) =>
                                    setFormularioCota({ ...formularioCota, nivel: e.currentTarget.value })
                                }
                            >
                                {niveisDisponiveis.map((nivel) => (
                                    <option key={nivel.valor} value={nivel.valor}>
                                        {nivel.rotulo}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoValorCota">
                            Valor *
                        </label>
                        <CampoMoeda
                            id="campoValorCota"
                            valorCentavos={formularioCota.valor}
                            aoMudar={(centavos) => setFormularioCota({ ...formularioCota, valor: centavos })}
                        />
                        <span className="ajudaCampoInfoSemac">
                            Valor zero aparece como “Sob consulta” na página /cotas.
                        </span>
                    </div>

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelCotaAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoCota}>
                            {salvandoCota
                                ? 'Salvando…'
                                : idCotaEmEdicao !== null
                                    ? 'Salvar alterações'
                                    : 'Adicionar cota'}
                        </button>
                    </div>
                </form>
            </PainelLateral>

            <PainelLateral
                aberto={painelNivelParticipanteAberto}
                titulo={idNivelParticipanteEmEdicao !== null ? 'Editar nível' : 'Novo nível'}
                aoFechar={() => setPainelNivelParticipanteAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarNivelParticipante}>
                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeNivelParticipante">
                            Nome do nível *
                        </label>
                        <input
                            id="campoNomeNivelParticipante"
                            className="entradaFormularioFinancas"
                            required
                            placeholder="ex.: Bronze"
                            value={formularioNivelParticipante.nome}
                            onInput={(e) =>
                                setFormularioNivelParticipante({ ...formularioNivelParticipante, nome: e.currentTarget.value })
                            }
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoXpMinimoNivelParticipante">
                            Xp mínimo *
                        </label>
                        <input
                            id="campoXpMinimoNivelParticipante"
                            type="number"
                            min="0"
                            step="1"
                            className="entradaFormularioFinancas"
                            required
                            value={formularioNivelParticipante.xpMinimo}
                            onInput={(e) =>
                                setFormularioNivelParticipante({
                                    ...formularioNivelParticipante,
                                    xpMinimo: e.currentTarget.value,
                                })
                            }
                        />
                    </div>

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelNivelParticipanteAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoNivelParticipante}>
                            {salvandoNivelParticipante
                                ? 'Salvando…'
                                : idNivelParticipanteEmEdicao !== null
                                    ? 'Salvar alterações'
                                    : 'Adicionar nível'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

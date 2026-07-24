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

/* Informações SEMAC — dois blocos:
   1. Tipos de ingresso (tabela `tipo_inscricao`) da edição atual;
   2. Cotas de patrocínio (tabela `cota`), nível + valor.
   Valores em centavos na interface, convertidos na borda da API.

   Os benefícios e as cores de cada cota seguem no código
   (src/data/cotas.js) — aqui só se gerencia o valor. */

const ANO_ATUAL = new Date().getFullYear();

const FORMULARIO_VAZIO = {
    nome: '',
    valor: 0,
    ativo: true,
};

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

    useEffect(() => {
        let ativo = true;
        listarTiposInscricao(ANO_ATUAL)
            .then((lista) => { if (ativo) setTipos(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        listarCotas()
            .then((lista) => { if (ativo) setCotas([...lista].sort(porValorCrescente)); })
            .catch((e) => { if (ativo) setErroCotas(e.message); })
            .finally(() => { if (ativo) setCarregandoCotas(false); });
        return () => { ativo = false; };
    }, []);

    const abrirNovo = () => {
        setFormulario(FORMULARIO_VAZIO);
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicao = (tipo) => {
        setFormulario({ nome: tipo.nome, valor: tipo.valor, ativo: tipo.ativo });
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
                                <span className="valorIngressoInfoSemac">{formatarCentavos(tipo.valor)}</span>
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
                                        className="botaoExcluirIngressoInfoSemac"
                                        onClick={() => excluir(tipo.id)}
                                    >
                                        {idConfirmandoExclusao === tipo.id ? 'Confirmar exclusão' : 'Excluir'}
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
                                        className="botaoExcluirIngressoInfoSemac"
                                        onClick={() => removerCota(cota.id)}
                                    >
                                        {idCotaConfirmandoExclusao === cota.id ? 'Confirmar exclusão' : 'Excluir'}
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
                            Valor *
                        </label>
                        <CampoMoeda
                            id="campoValorIngresso"
                            valorCentavos={formulario.valor}
                            aoMudar={(centavos) => setFormulario({ ...formulario, valor: centavos })}
                        />
                    </div>

                    <label className="campoCheckboxInfoSemac">
                        <input
                            type="checkbox"
                            checked={formulario.ativo}
                            onInput={(e) => setFormulario({ ...formulario, ativo: e.currentTarget.checked })}
                        />
                        <span>Ingresso ativo (disponível para seleção na confirmação)</span>
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
        </div>
    );
}

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

/* Informações SEMAC — tipos de ingresso (tabela `tipo_inscricao`) da
   edição atual. O admin visualiza, cria quantos quiser e edita os
   valores. Valores em centavos na interface, convertidos na borda. */

const ANO_ATUAL = new Date().getFullYear();

const FORMULARIO_VAZIO = {
    nome: '',
    valor: 0,
    ativo: true,
};

export default function InformacoesSemac() {
    const [tipos, setTipos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);

    useEffect(() => {
        let ativo = true;
        listarTiposInscricao(ANO_ATUAL)
            .then((lista) => { if (ativo) setTipos(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
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

    return (
        <div className="conteudoInfoSemac">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Informações SEMAC</h1>
                    <p className="subtituloSecaoFinancas">
                        Tipos de ingresso e valores — edição {ANO_ATUAL}
                    </p>
                </div>
                <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovo}>
                    + Novo ingresso
                </button>
            </header>

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
                                    className="botaoAlterarRoleAdmin"
                                    onClick={() => abrirEdicao(tipo)}
                                >
                                    Editar
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
        </div>
    );
}

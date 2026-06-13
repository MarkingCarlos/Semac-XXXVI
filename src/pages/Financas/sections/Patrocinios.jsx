import { useState } from 'preact/hooks';
import PainelLateral from '../components/PainelLateral.jsx';
import CampoMoeda from '../components/CampoMoeda.jsx';
import { formatarCentavos, formatarData, normalizar } from '../utils/moeda.js';
import { COTAS, NIVEIS_COTA } from '../data/mockFinancas.js';
import './patrocinios.css';

const FORMULARIO_VAZIO = {
    nome: '',
    descricao: '',
    logoUrl: '',
    nivel: '',
    valorCota: 0,
    desconto: 0,
    adicao: 0,
    statusPagamento: 'A_RECEBER',
    observacao: '',
};

/* Patrocínios — mesma entidade exibida no site (nome, descrição, logo)
   estendida com os campos financeiros (cota, desconto, adição, status). */
export default function Patrocinios({ patrocinadores, setPatrocinadores }) {
    const [painelAberto, setPainelAberto] = useState(false);
    const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
    const [idEmEdicao, setIdEmEdicao] = useState(null);
    const [idConfirmandoExclusao, setIdConfirmandoExclusao] = useState(null);
    const [filtro, setFiltro] = useState('');

    const valorFinal = formulario.valorCota - formulario.desconto + formulario.adicao;
    const patrocinadoresFiltrados = filtro.trim()
        ? patrocinadores.filter((patrocinador) => normalizar(patrocinador.nome).includes(normalizar(filtro)))
        : patrocinadores;

    const abrirNovoPatrocinio = () => {
        setFormulario(FORMULARIO_VAZIO);
        setIdEmEdicao(null);
        setPainelAberto(true);
    };

    const abrirEdicaoPatrocinio = (patrocinador) => {
        setFormulario({ ...patrocinador });
        setIdEmEdicao(patrocinador.id);
        setPainelAberto(true);
    };

    /* Ao trocar o nível, o valor da cota é preenchido automaticamente */
    const aoSelecionarNivel = (evento) => {
        const nivel = evento.currentTarget.value;
        setFormulario({ ...formulario, nivel, valorCota: COTAS[nivel] ?? 0 });
    };

    const salvarPatrocinio = (evento) => {
        evento.preventDefault();
        const registro = {
            ...formulario,
            valorFinal,
            dataRecebimento:
                formulario.statusPagamento === 'RECEBIDO'
                    ? formulario.dataRecebimento ?? new Date().toISOString()
                    : null,
        };

        if (idEmEdicao !== null) {
            setPatrocinadores(
                patrocinadores.map((patrocinador) =>
                    patrocinador.id === idEmEdicao ? { ...registro, id: idEmEdicao } : patrocinador,
                ),
            );
        } else {
            const proximoId = Math.max(0, ...patrocinadores.map((patrocinador) => patrocinador.id)) + 1;
            setPatrocinadores([...patrocinadores, { ...registro, id: proximoId }]);
        }
        setPainelAberto(false);
    };

    const alternarStatusPagamento = (patrocinador) => {
        const recebido = patrocinador.statusPagamento === 'RECEBIDO';
        setPatrocinadores(
            patrocinadores.map((patrocinadorItem) =>
                patrocinadorItem.id === patrocinador.id
                    ? {
                          ...patrocinadorItem,
                          statusPagamento: recebido ? 'A_RECEBER' : 'RECEBIDO',
                          dataRecebimento: recebido ? null : new Date().toISOString(),
                      }
                    : patrocinadorItem,
            ),
        );
    };

    const excluirPatrocinio = (id) => {
        if (idConfirmandoExclusao !== id) {
            setIdConfirmandoExclusao(id);
            return;
        }
        setPatrocinadores(patrocinadores.filter((patrocinador) => patrocinador.id !== id));
        setIdConfirmandoExclusao(null);
    };

    return (
        <div className="conteudoPatrociniosFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Patrocínios</h1>
                    <p className="subtituloSecaoFinancas">
                        Contratos assinados — patrocinadores exibidos no site
                    </p>
                </div>
                <div className="controlesCabecalhoFinancas">
                    <div className="filtroTabelaFinancas">
                        <span className="iconeFiltroFinancas">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </span>
                        <input
                            className="entradaFiltroFinancas"
                            type="search"
                            placeholder="Filtrar por empresa…"
                            value={filtro}
                            onInput={(e) => setFiltro(e.currentTarget.value)}
                            aria-label="Filtrar patrocínios por empresa"
                        />
                    </div>
                    <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoPatrocinio}>
                        + Novo patrocínio
                    </button>
                </div>
            </header>

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Cota</th>
                            <th>Valor final</th>
                            <th>Status</th>
                            <th>Recebido em</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {patrocinadoresFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={6} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhuma empresa encontrada para esse filtro.'
                                        : 'Nenhum patrocínio registrado ainda.'}
                                </td>
                            </tr>
                        )}
                        {patrocinadoresFiltrados.map((patrocinador) => (
                            <tr key={patrocinador.id}>
                                <td>
                                    <div className="celulaEmpresaPatrocinios">
                                        <span className="nomeEmpresaPatrocinios">{patrocinador.nome}</span>
                                        {patrocinador.observacao && (
                                            <span className="notaEmpresaPatrocinios">
                                                {patrocinador.observacao}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className="seloCotaPatrocinios">{patrocinador.nivel}</span>
                                </td>
                                <td className="celulaValorFinancas">
                                    {formatarCentavos(patrocinador.valorFinal)}
                                </td>
                                <td>
                                    <span
                                        className={
                                            patrocinador.statusPagamento === 'RECEBIDO'
                                                ? 'seloStatusFinancas seloRecebidoFinancas'
                                                : 'seloStatusFinancas seloAReceberFinancas'
                                        }
                                    >
                                        {patrocinador.statusPagamento === 'RECEBIDO' ? 'Recebido' : 'A receber'}
                                    </span>
                                </td>
                                <td className="celulaDataFinancas">
                                    {patrocinador.dataRecebimento
                                        ? formatarData(patrocinador.dataRecebimento)
                                        : '—'}
                                </td>
                                <td>
                                    <div className="grupoAcoesLinhaFinancas">
                                        <button
                                            type="button"
                                            className="botaoStatusLinhaFinancas"
                                            onClick={() => alternarStatusPagamento(patrocinador)}
                                        >
                                            {patrocinador.statusPagamento === 'RECEBIDO' ? 'Desfazer' : 'Receber'}
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoAcaoLinhaFinancas"
                                            aria-label={`Editar ${patrocinador.nome}`}
                                            title="Editar"
                                            onClick={() => abrirEdicaoPatrocinio(patrocinador)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                idConfirmandoExclusao === patrocinador.id
                                                    ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                    : 'botaoAcaoLinhaFinancas'
                                            }
                                            aria-label={
                                                idConfirmandoExclusao === patrocinador.id
                                                    ? `Confirmar exclusão de ${patrocinador.nome}`
                                                    : `Excluir ${patrocinador.nome}`
                                            }
                                            title={
                                                idConfirmandoExclusao === patrocinador.id
                                                    ? 'Clique novamente para confirmar'
                                                    : 'Excluir'
                                            }
                                            onClick={() => excluirPatrocinio(patrocinador.id)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PainelLateral
                aberto={painelAberto}
                titulo={idEmEdicao !== null ? 'Editar patrocínio' : 'Novo patrocínio'}
                aoFechar={() => setPainelAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarPatrocinio}>
                    <h3 className="divisorFormularioFinancas">Contrato</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomePatrocinio">
                            Empresa *
                        </label>
                        <input
                            id="campoNomePatrocinio"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.nome}
                            onInput={(e) => setFormulario({ ...formulario, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNivelPatrocinio">
                            Nível da cota *
                        </label>
                        <select
                            id="campoNivelPatrocinio"
                            className="entradaFormularioFinancas"
                            required
                            value={formulario.nivel}
                            onChange={aoSelecionarNivel}
                        >
                            <option value="" disabled>
                                Selecione o nível
                            </option>
                            {NIVEIS_COTA.map((nivel) => (
                                <option key={nivel} value={nivel}>
                                    {nivel} — {formatarCentavos(COTAS[nivel])}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoValorCotaPatrocinio">
                            Valor da cota
                        </label>
                        <CampoMoeda
                            id="campoValorCotaPatrocinio"
                            valorCentavos={formulario.valorCota}
                            aoMudar={() => {}}
                            desabilitado
                        />
                    </div>

                    <div className="linhaDuplaFormularioFinancas">
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoDescontoPatrocinio">
                                Desconto
                            </label>
                            <CampoMoeda
                                id="campoDescontoPatrocinio"
                                valorCentavos={formulario.desconto}
                                aoMudar={(centavos) => setFormulario({ ...formulario, desconto: centavos })}
                            />
                        </div>
                        <div className="campoFormularioFinancas">
                            <label className="rotuloCampoFinancas" htmlFor="campoAdicaoPatrocinio">
                                Adição
                            </label>
                            <CampoMoeda
                                id="campoAdicaoPatrocinio"
                                valorCentavos={formulario.adicao}
                                aoMudar={(centavos) => setFormulario({ ...formulario, adicao: centavos })}
                            />
                        </div>
                    </div>

                    <div className="blocoValorFinalFinancas">
                        <span className="rotuloCampoFinancas">Valor final</span>
                        <strong className="valorCalculadoFinancas">{formatarCentavos(valorFinal)}</strong>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoStatusPatrocinio">
                            Status do pagamento
                        </label>
                        <select
                            id="campoStatusPatrocinio"
                            className="entradaFormularioFinancas"
                            value={formulario.statusPagamento}
                            onChange={(e) =>
                                setFormulario({ ...formulario, statusPagamento: e.currentTarget.value })
                            }
                        >
                            <option value="A_RECEBER">A receber</option>
                            <option value="RECEBIDO">Recebido</option>
                        </select>
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoObservacaoPatrocinio">
                            Observação
                        </label>
                        <textarea
                            id="campoObservacaoPatrocinio"
                            className="entradaFormularioFinancas areaTextoFinancas"
                            rows={2}
                            value={formulario.observacao}
                            onInput={(e) =>
                                setFormulario({ ...formulario, observacao: e.currentTarget.value })
                            }
                        />
                    </div>

                    <h3 className="divisorFormularioFinancas">Exibição no site</h3>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoDescricaoPatrocinio">
                            Descrição
                        </label>
                        <textarea
                            id="campoDescricaoPatrocinio"
                            className="entradaFormularioFinancas areaTextoFinancas"
                            rows={2}
                            value={formulario.descricao}
                            onInput={(e) =>
                                setFormulario({ ...formulario, descricao: e.currentTarget.value })
                            }
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoLogoPatrocinio">
                            URL da logo
                        </label>
                        <input
                            id="campoLogoPatrocinio"
                            className="entradaFormularioFinancas"
                            placeholder="https://… ou /src/assets/…"
                            value={formulario.logoUrl}
                            onInput={(e) => setFormulario({ ...formulario, logoUrl: e.currentTarget.value })}
                        />
                    </div>

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas">
                            {idEmEdicao !== null ? 'Salvar alterações' : 'Adicionar patrocínio'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </div>
    );
}

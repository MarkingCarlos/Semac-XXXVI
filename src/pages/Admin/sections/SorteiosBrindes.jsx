import { useState } from 'preact/hooks';
import PainelLateral from '../../Financas/components/PainelLateral.jsx';
import { normalizar } from '../../Financas/utils/moeda.js';
import { criarSorteio, atualizarSorteio, excluirSorteio } from '../../Sorteio/data/apiSorteio.js';
import ListaItensMobileAdmin from '../../../components/ListaItensMobileAdmin/ListaItensMobileAdmin.jsx';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';

/* Sub-aba "Sorteios" da seção Conteúdo — tabela `sorteio` (nome + evento).
   Um evento pode ter vários sorteios; cada brinde pertence a um. Os
   ganhadores (quem ganhou e quem realizou) são gravados pela tela
   /sorteio e aparecem aqui, só leitura, ao abrir um sorteio.

   A lista vive no Brindes.jsx (o formulário de brinde também precisa
   dela), por isso chega por props e volta por `aoAlterarSorteios`. */

const FORMULARIO_VAZIO_SORTEIO = { nome: '', eventoId: '' };

/* "2026-10-05T14:00:00" → "05/10 · 14:00" */
function formatarDataHoraSorteio(iso) {
    if (!iso) return '';
    const [data, hora = ''] = iso.split('T');
    const [, mes, dia] = data.split('-');
    return `${dia}/${mes} · ${hora.slice(0, 5)}`;
}

export default function SorteiosBrindes({ sorteios, eventos, carregando, aoAlterarSorteios }) {
    const [erroSorteios, setErroSorteios] = useState('');
    const [salvandoSorteio, setSalvandoSorteio] = useState(false);
    const [painelSorteioAberto, setPainelSorteioAberto] = useState(false);
    const [formularioSorteio, setFormularioSorteio] = useState(FORMULARIO_VAZIO_SORTEIO);
    const [sorteioEmEdicao, setSorteioEmEdicao] = useState(null);
    const [idConfirmandoExclusaoSorteio, setIdConfirmandoExclusaoSorteio] = useState(null);
    const [filtroSorteios, setFiltroSorteios] = useState('');

    /* Mobile: sorteio aberto no modal de detalhes. Só o id, buscado na
       lista a cada render: o modal some sozinho depois de uma exclusão. */
    const [idSorteioDetalhado, setIdSorteioDetalhado] = useState(null);
    const sorteioDetalhado = sorteios.find((s) => s.id === idSorteioDetalhado) ?? null;

    // Fechar o modal descarta um "toque de novo para confirmar" pendente.
    const fecharDetalhesSorteio = () => {
        setIdSorteioDetalhado(null);
        setIdConfirmandoExclusaoSorteio(null);
    };

    const sorteiosFiltrados = filtroSorteios.trim()
        ? sorteios.filter((sorteio) =>
            normalizar(`${sorteio.nome} ${sorteio.eventoNome}`).includes(normalizar(filtroSorteios)))
        : sorteios;

    const eventosOrdenados = [...eventos].sort((a, b) =>
        `${a.data}T${a.horaInicio}`.localeCompare(`${b.data}T${b.horaInicio}`));

    const abrirNovoSorteio = () => {
        setFormularioSorteio(FORMULARIO_VAZIO_SORTEIO);
        setSorteioEmEdicao(null);
        setErroSorteios('');
        setPainelSorteioAberto(true);
    };

    const abrirEdicaoSorteio = (sorteio) => {
        setFormularioSorteio({ nome: sorteio.nome, eventoId: String(sorteio.eventoId) });
        setSorteioEmEdicao(sorteio);
        setErroSorteios('');
        setPainelSorteioAberto(true);
    };

    const salvarSorteio = async (evento) => {
        evento.preventDefault();
        setSalvandoSorteio(true);
        setErroSorteios('');
        try {
            if (sorteioEmEdicao) {
                const atualizado = await atualizarSorteio(sorteioEmEdicao.id, formularioSorteio);
                aoAlterarSorteios(sorteios.map((s) => (s.id === sorteioEmEdicao.id ? atualizado : s)));
            } else {
                const criado = await criarSorteio(formularioSorteio);
                aoAlterarSorteios([...sorteios, criado]);
            }
            setPainelSorteioAberto(false);
        } catch (e) {
            setErroSorteios(e.message);
        } finally {
            setSalvandoSorteio(false);
        }
    };

    const removerSorteio = async (id) => {
        if (idConfirmandoExclusaoSorteio !== id) {
            setIdConfirmandoExclusaoSorteio(id);
            return;
        }
        setErroSorteios('');
        try {
            await excluirSorteio(id);
            aoAlterarSorteios(sorteios.filter((s) => s.id !== id));
        } catch (e) {
            setErroSorteios(e.message);
        } finally {
            setIdConfirmandoExclusaoSorteio(null);
        }
    };

    const temGanhadores = sorteioEmEdicao && sorteioEmEdicao.ganhadores.length > 0;

    return (
        <>
            <div className="controlesCabecalhoFinancas barraFerramentasBrindesAdmin">
                <div className="filtroTabelaFinancas">
                    <span className="iconeFiltroFinancas">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </span>
                    <input
                        className="entradaFiltroFinancas"
                        type="search"
                        placeholder="Filtrar por sorteio ou evento…"
                        value={filtroSorteios}
                        onInput={(e) => setFiltroSorteios(e.currentTarget.value)}
                        aria-label="Filtrar sorteios por nome ou evento"
                    />
                </div>
                <button type="button" className="botaoPrimarioFinancas" onClick={abrirNovoSorteio}>
                    + Novo sorteio
                </button>
            </div>

            {erroSorteios && !painelSorteioAberto && <p className="avisoErroAdmin" role="alert">{erroSorteios}</p>}

            <div className="envelopeTabelaFinancas">
                {/* Mobile: só os nomes; o toque abre o modal de detalhes. */}
                <ListaItensMobileAdmin
                    itens={carregando ? [] : sorteiosFiltrados}
                    textoVazio={
                        carregando
                            ? 'Carregando sorteios…'
                            : filtroSorteios.trim()
                                ? 'Nenhum sorteio encontrado para esse filtro.'
                                : 'Nenhum sorteio cadastrado ainda.'
                    }
                    aoSelecionar={(sorteio) => { setErroSorteios(''); setIdSorteioDetalhado(sorteio.id); }}
                />

                <table className="tabelaFinancas tabelaOcultaMobileAdmin">
                    <thead>
                        <tr>
                            <th>Sorteio</th>
                            <th>Evento</th>
                            <th>Brindes</th>
                            <th>Entregues</th>
                            <th aria-label="Ações" />
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={5} className="celulaVaziaFinancas">Carregando sorteios…</td>
                            </tr>
                        )}
                        {!carregando && sorteiosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={5} className="celulaVaziaFinancas">
                                    {filtroSorteios.trim()
                                        ? 'Nenhum sorteio encontrado para esse filtro.'
                                        : 'Nenhum sorteio cadastrado ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && sorteiosFiltrados.map((sorteio) => (
                            <tr key={sorteio.id}>
                                <td><span className="nomeDoadorDoacoes">{sorteio.nome}</span></td>
                                <td>
                                    <span className="celulaEventoSorteiosBrindes">
                                        <span>{sorteio.eventoNome}</span>
                                        <span className="dataEventoSorteiosBrindes">
                                            {formatarDataHoraSorteio(sorteio.eventoDataHoraInicio)}
                                        </span>
                                    </span>
                                </td>
                                <td>{sorteio.quantidadeBrindes}</td>
                                <td>{sorteio.quantidadeEntregue}</td>
                                <td>
                                    <div className="grupoAcoesLinhaFinancas">
                                        <button
                                            type="button"
                                            className="botaoAcaoLinhaFinancas"
                                            aria-label={`Editar sorteio ${sorteio.nome}`}
                                            title="Editar e ver ganhadores"
                                            onClick={() => abrirEdicaoSorteio(sorteio)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                idConfirmandoExclusaoSorteio === sorteio.id
                                                    ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                    : 'botaoAcaoLinhaFinancas'
                                            }
                                            aria-label={
                                                idConfirmandoExclusaoSorteio === sorteio.id
                                                    ? `Confirmar exclusão do sorteio ${sorteio.nome}`
                                                    : `Excluir sorteio ${sorteio.nome}`
                                            }
                                            title={
                                                idConfirmandoExclusaoSorteio === sorteio.id
                                                    ? 'Clique novamente para confirmar'
                                                    : 'Excluir'
                                            }
                                            onClick={() => removerSorteio(sorteio.id)}
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

            {/* ── Modal de detalhes do sorteio (mobile) ──────────
                Mesmas colunas e ações da tabela; "Editar" fecha o modal
                antes de abrir o painel, para não empilhar. */}
            {sorteioDetalhado && (
                <ModalInferiorAdmin
                    titulo={sorteioDetalhado.nome}
                    subtitulo={sorteioDetalhado.eventoNome}
                    aoFechar={fecharDetalhesSorteio}
                >
                    {(fecharDetalhes) => {
                        const confirmandoExclusao = idConfirmandoExclusaoSorteio === sorteioDetalhado.id;
                        return (
                            <>
                                <dl className="listaDetalhesItemModalInferiorAdmin">
                                    <div className="linhaDetalheItemModalInferiorAdmin">
                                        <dt className="rotuloDetalheItemModalInferiorAdmin">Evento</dt>
                                        <dd className="valorDetalheItemModalInferiorAdmin">
                                            <span className="celulaEventoSorteiosBrindes">
                                                <span>{sorteioDetalhado.eventoNome}</span>
                                                <span className="dataEventoSorteiosBrindes">
                                                    {formatarDataHoraSorteio(sorteioDetalhado.eventoDataHoraInicio)}
                                                </span>
                                            </span>
                                        </dd>
                                    </div>
                                    <div className="linhaDetalheItemModalInferiorAdmin">
                                        <dt className="rotuloDetalheItemModalInferiorAdmin">Brindes</dt>
                                        <dd className="valorDetalheItemModalInferiorAdmin">{sorteioDetalhado.quantidadeBrindes}</dd>
                                    </div>
                                    <div className="linhaDetalheItemModalInferiorAdmin">
                                        <dt className="rotuloDetalheItemModalInferiorAdmin">Entregues</dt>
                                        <dd className="valorDetalheItemModalInferiorAdmin">{sorteioDetalhado.quantidadeEntregue}</dd>
                                    </div>
                                </dl>

                                {erroSorteios && <p className="avisoErroAdmin" role="alert">{erroSorteios}</p>}

                                <div className="grupoAcoesItemModalInferiorAdmin">
                                    <button
                                        type="button"
                                        className="botaoAcaoItemModalInferiorAdmin botaoAcaoPrincipalItemModalInferiorAdmin"
                                        onClick={() => fecharDetalhes(() => abrirEdicaoSorteio(sorteioDetalhado))}
                                    >
                                        Editar e ver ganhadores
                                    </button>
                                    <div className="linhaAcoesDestrutivasItemModalInferiorAdmin">
                                        <button
                                            type="button"
                                            className={`botaoAcaoItemModalInferiorAdmin botaoAcaoPerigoItemModalInferiorAdmin ${confirmandoExclusao ? 'botaoAcaoConfirmandoItemModalInferiorAdmin' : ''}`}
                                            onClick={() => removerSorteio(sorteioDetalhado.id)}
                                        >
                                            {confirmandoExclusao ? 'Toque de novo para excluir' : 'Excluir'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        );
                    }}
                </ModalInferiorAdmin>
            )}

            <PainelLateral
                aberto={painelSorteioAberto}
                titulo={sorteioEmEdicao ? 'Editar sorteio' : 'Novo sorteio'}
                aoFechar={() => setPainelSorteioAberto(false)}
            >
                <form className="formularioFinancas" onSubmit={salvarSorteio}>
                    {erroSorteios && <p className="avisoErroAdmin" role="alert">{erroSorteios}</p>}

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoNomeSorteio">Nome *</label>
                        <input
                            id="campoNomeSorteio"
                            className="entradaFormularioFinancas"
                            required
                            placeholder="Ex.: Sorteio da abertura"
                            value={formularioSorteio.nome}
                            onInput={(e) => setFormularioSorteio({ ...formularioSorteio, nome: e.currentTarget.value })}
                        />
                    </div>

                    <div className="campoFormularioFinancas">
                        <label className="rotuloCampoFinancas" htmlFor="campoEventoSorteio">Evento *</label>
                        <select
                            id="campoEventoSorteio"
                            className="entradaFormularioFinancas"
                            required
                            disabled={temGanhadores}
                            value={formularioSorteio.eventoId}
                            onChange={(e) => setFormularioSorteio({ ...formularioSorteio, eventoId: e.currentTarget.value })}
                        >
                            <option value="" disabled>Selecione o evento</option>
                            {eventosOrdenados.map((eventoOpcao) => (
                                <option key={eventoOpcao.id} value={String(eventoOpcao.id)}>
                                    {formatarDataHoraSorteio(`${eventoOpcao.data}T${eventoOpcao.horaInicio}`)} — {eventoOpcao.nome}
                                </option>
                            ))}
                        </select>
                        {temGanhadores && (
                            <span className="dicaCampoSorteiosBrindes">
                                Já há ganhadores neste sorteio — o evento não pode mais ser trocado.
                            </span>
                        )}
                    </div>

                    {sorteioEmEdicao && (
                        <>
                            <p className="divisorFormularioFinancas">Ganhadores</p>
                            {sorteioEmEdicao.ganhadores.length === 0 ? (
                                <p className="dicaCampoSorteiosBrindes">Ninguém ganhou neste sorteio ainda.</p>
                            ) : (
                                <ul className="listaGanhadoresSorteiosBrindes">
                                    {sorteioEmEdicao.ganhadores.map((ganhador) => (
                                        <li key={ganhador.id} className="itemGanhadorSorteiosBrindes">
                                            <span className="nomeGanhadorSorteiosBrindes">{ganhador.participanteNome}</span>
                                            <span className="brindeGanhadorSorteiosBrindes">{ganhador.brindeNome}</span>
                                            <span className="realizadoPorGanhadorSorteiosBrindes">
                                                Sorteado por {ganhador.organizadorNome} · {formatarDataHoraSorteio(ganhador.ganhouEm)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}

                    <div className="rodapeFormularioFinancas">
                        <button
                            type="button"
                            className="botaoFantasmaFinancas"
                            onClick={() => setPainelSorteioAberto(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="botaoPrimarioFinancas" disabled={salvandoSorteio}>
                            {salvandoSorteio
                                ? 'Salvando…'
                                : sorteioEmEdicao
                                    ? 'Salvar alterações'
                                    : 'Adicionar sorteio'}
                        </button>
                    </div>
                </form>
            </PainelLateral>
        </>
    );
}

// Subaba "Kits" da aba Pessoas: marca a entrega do kit (camisa, caneta e
// afins) quando a pessoa chega no credenciamento.
//
// Lista de GET /api/pessoa/kits: participantes confirmados (sem diaristas,
// cujo ingresso não inclui kit) e toda a comissão. Aberta a toda a
// comissão, então a lista não traz contato, RA nem pagamento.
//
// Marcar é um toque; desfazer exige dois, mesmo padrão do "Desconfirmar"
// da tabela de participantes — no balcão, com fila, um toque errado em
// quem já recebeu não pode apagar o registro sem querer.
//
// Várias pessoas entregam ao mesmo tempo, então a lista se atualiza sozinha
// (usarConsultaPeriodica, mesmo "tempo real" da dashboard). O que este
// aparelho acabou de marcar vale por cima de uma consulta que saiu antes
// do clique — senão uma resposta atrasada desmarcaria o kit na tela.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { listarKits, marcarKitEntregue } from '../data/apiParticipantes.js';
import { usarConsultaPeriodica } from '../../../components/dashboardAdmin/usarConsultaPeriodica.js';
import './entregaKits.css';

// Guarda quando cada consulta saiu, para comparar com as alterações locais.
function consultarKitsComHorario() {
    const consultadoEm = Date.now();
    return listarKits().then(lista => ({ lista, consultadoEm }));
}

const ROTULOS_PAPEL_KITS = {
    PARTICIPANTE: 'Participante',
    MEMBRO: 'Membro',
    DIRETOR_SITE: 'Dir. Site',
    DIRETOR_CONTEUDO: 'Dir. Conteúdo',
    DIRETOR_PATROCINIO: 'Dir. Patrocínio',
    DIRETOR_APOIO: 'Dir. Apoio',
    DIRETOR_MARKETING: 'Dir. Marketing',
    PRESIDENTE: 'Presidência',
};

const FILTROS_ENTREGA_KITS = [
    { id: 'pendentes', rotulo: 'Pendentes' },
    { id: 'entregues', rotulo: 'Entregues' },
    { id: 'todos', rotulo: 'Todos' },
];

const FILTROS_PUBLICO_KITS = [
    { id: 'todos', rotulo: 'Todos' },
    { id: 'participantes', rotulo: 'Participantes' },
    { id: 'comissao', rotulo: 'Comissão' },
];

// Busca sem diferenciar acento nem maiúscula ("joao" acha "João").
function normalizarBuscaKits(texto) {
    return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// "M" ou "M baby look", juntando as camisetas com " · ".
function textoCamisetasKits(camisetas) {
    if (!camisetas?.length) return 'Sem camiseta';
    return camisetas
        .map(camiseta => camiseta.modelo === 'BABY_LOOK' ? `${camiseta.tamanho} baby look` : camiseta.tamanho)
        .join(' · ');
}

function textoEntregaKits(pessoa) {
    const dataEntrega = new Date(pessoa.kitEntregueEm);
    const dia = dataEntrega.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const hora = dataEntrega.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const autor = pessoa.kitEntreguePorNome ? ` por ${pessoa.kitEntreguePorNome.split(' ')[0]}` : '';
    return `Entregue ${dia} às ${hora}${autor}`;
}

export default function EntregaKits() {
    const consultaKits = usarConsultaPeriodica(consultarKitsComHorario, true);
    // id → { pessoa, alteradoEm }: respostas dos PATCHs feitos neste aparelho.
    const [alteracoesLocaisKits, setAlteracoesLocaisKits] = useState({});
    const [erroMarcarKit, setErroMarcarKit] = useState('');
    const [buscaKits, setBuscaKits] = useState('');
    const [filtroKits, setFiltroKits] = useState('pendentes');
    const [filtroPublicoKits, setFiltroPublicoKits] = useState('todos');
    const [idProcessandoKit, setIdProcessandoKit] = useState(null);
    const [idConfirmandoDesfazerKit, setIdConfirmandoDesfazerKit] = useState(null);
    // No filtro "Pendentes" quem acabou de receber some da lista; o aviso
    // confirma a entrega e deixa desfazer ali mesmo se foi a pessoa errada.
    const [ultimaEntregaKits, setUltimaEntregaKits] = useState(null);

    const consultadoEmKits = consultaKits.dados?.consultadoEm ?? 0;

    // Alteração local só vale enquanto nenhuma consulta posterior a ela
    // chegou; depois disso o servidor já a inclui (ou outra pessoa mudou de novo).
    const pessoasKits = useMemo(() => {
        const lista = consultaKits.dados?.lista ?? [];
        return lista.map(pessoa => {
            const alteracao = alteracoesLocaisKits[pessoa.id];
            return alteracao && alteracao.alteradoEm > consultadoEmKits ? alteracao.pessoa : pessoa;
        });
    }, [consultaKits.dados, alteracoesLocaisKits]);

    // Descarta as alterações que a consulta mais recente já cobriu.
    useEffect(() => {
        setAlteracoesLocaisKits(anteriores => {
            const pendentes = Object.entries(anteriores).filter(([, alteracao]) => alteracao.alteradoEm > consultadoEmKits);
            return pendentes.length === Object.keys(anteriores).length ? anteriores : Object.fromEntries(pendentes);
        });
    }, [consultadoEmKits]);

    const carregandoKits = consultaKits.carregando && !consultaKits.dados;
    const erroCarregarKits = consultaKits.dados ? '' : consultaKits.erro;
    const semConexaoKits = !!consultaKits.dados && !!consultaKits.erro;

    const contagemKits = useMemo(() => {
        const participantes = pessoasKits.filter(p => p.role === 'PARTICIPANTE');
        const comissao = pessoasKits.filter(p => p.role !== 'PARTICIPANTE');
        const entregues = lista => lista.filter(p => p.kitEntregueEm).length;
        return {
            total: pessoasKits.length,
            entregues: entregues(pessoasKits),
            participantes: participantes.length,
            participantesEntregues: entregues(participantes),
            comissao: comissao.length,
            comissaoEntregues: entregues(comissao),
        };
    }, [pessoasKits]);

    const pessoasFiltradasKits = useMemo(() => {
        const termo = normalizarBuscaKits(buscaKits.trim());
        return pessoasKits.filter(pessoa => {
            if (filtroKits === 'pendentes' && pessoa.kitEntregueEm) return false;
            if (filtroKits === 'entregues' && !pessoa.kitEntregueEm) return false;
            const ehParticipante = pessoa.role === 'PARTICIPANTE';
            if (filtroPublicoKits === 'participantes' && !ehParticipante) return false;
            if (filtroPublicoKits === 'comissao' && ehParticipante) return false;
            return !termo || normalizarBuscaKits(pessoa.nome).includes(termo);
        });
    }, [pessoasKits, buscaKits, filtroKits, filtroPublicoKits]);

    async function alternarEntregaKit(pessoa, { semConfirmacao = false } = {}) {
        const desfazendo = !!pessoa.kitEntregueEm;
        if (desfazendo && !semConfirmacao && idConfirmandoDesfazerKit !== pessoa.id) {
            setIdConfirmandoDesfazerKit(pessoa.id);
            return;
        }
        setErroMarcarKit('');
        setIdProcessandoKit(pessoa.id);
        try {
            const atualizada = await marcarKitEntregue(pessoa.id, !desfazendo);
            setAlteracoesLocaisKits(anteriores => ({
                ...anteriores,
                [atualizada.id]: { pessoa: atualizada, alteradoEm: Date.now() },
            }));
            setUltimaEntregaKits(desfazendo ? null : atualizada);
        } catch (e) {
            setErroMarcarKit(e.message);
        } finally {
            setIdProcessandoKit(null);
            setIdConfirmandoDesfazerKit(null);
        }
    }

    const percentualEntregueKits = contagemKits.total
        ? Math.round((contagemKits.entregues / contagemKits.total) * 100)
        : 0;

    return (
        <div className="conteudoParticipantesAdmin">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Kits</h1>
                    <p className="subtituloSecaoFinancas">
                        Entrega do kit no credenciamento
                    </p>
                </div>
            </header>

            {erroCarregarKits && <p class="avisoErroAdmin">{erroCarregarKits}</p>}

            {carregandoKits ? (
                <p class="estadoCarregandoParticipantesAdmin">Carregando kits...</p>
            ) : (
                <>
                    <section class="cartaoContadorKits" aria-label="Contador de kits entregues">
                        <div class="linhaNumeroContadorKits">
                            <span class="numeroEntreguesContadorKits">{contagemKits.entregues}</span>
                            <span class="numeroTotalContadorKits">de {contagemKits.total} kits entregues</span>
                            <span class="percentualContadorKits">{percentualEntregueKits}%</span>
                        </div>
                        <div
                            class="trilhoProgressoContadorKits"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={contagemKits.total}
                            aria-valuenow={contagemKits.entregues}
                        >
                            <div class="barraProgressoContadorKits" style={{ width: `${percentualEntregueKits}%` }} />
                        </div>
                        <p class="divisaoContadorKits">
                            Participantes {contagemKits.participantesEntregues}/{contagemKits.participantes}
                            {' · '}
                            Comissão {contagemKits.comissaoEntregues}/{contagemKits.comissao}
                        </p>
                    </section>

                    <div class="conteinerTabelaAdmin">
                        <div class="topoTabelaAdmin">
                            <div class="conjuntoFiltrosKits">
                                <div class="grupoFiltrosKits" role="group" aria-label="Filtrar por entrega">
                                    {FILTROS_ENTREGA_KITS.map(filtro => (
                                        <button
                                            key={filtro.id}
                                            type="button"
                                            class={`botaoFiltroKits ${filtroKits === filtro.id ? 'botaoFiltroAtivoKits' : ''}`}
                                            aria-pressed={filtroKits === filtro.id}
                                            onClick={() => setFiltroKits(filtro.id)}
                                        >
                                            {filtro.rotulo}
                                        </button>
                                    ))}
                                </div>
                                <div class="grupoFiltrosKits" role="group" aria-label="Filtrar por participante ou comissão">
                                    {FILTROS_PUBLICO_KITS.map(filtro => (
                                        <button
                                            key={filtro.id}
                                            type="button"
                                            class={`botaoFiltroKits ${filtroPublicoKits === filtro.id ? 'botaoFiltroAtivoKits' : ''}`}
                                            aria-pressed={filtroPublicoKits === filtro.id}
                                            onClick={() => setFiltroPublicoKits(filtro.id)}
                                        >
                                            {filtro.rotulo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <input
                                class="inputBuscaAdmin inputBuscaKits"
                                type="search"
                                placeholder="Buscar por nome..."
                                value={buscaKits}
                                onInput={e => setBuscaKits(e.target.value)}
                            />
                        </div>

                        {semConexaoKits && (
                            <p class="avisoSemConexaoKits" role="status">Sem conexão, tentando de novo…</p>
                        )}
                        {erroMarcarKit && <p class="avisoErroModalParticipantesAdmin">{erroMarcarKit}</p>}

                        {ultimaEntregaKits && (
                            <div class="avisoUltimaEntregaKits" role="status">
                                <span>Kit entregue para <strong>{ultimaEntregaKits.nome}</strong></span>
                                <button
                                    type="button"
                                    class="botaoDesfazerUltimaEntregaKits"
                                    disabled={idProcessandoKit === ultimaEntregaKits.id}
                                    onClick={() => alternarEntregaKit(ultimaEntregaKits, { semConfirmacao: true })}
                                >
                                    Desfazer
                                </button>
                            </div>
                        )}

                        {pessoasFiltradasKits.length === 0 ? (
                            <p class="tabelaVaziaAdmin">Ninguém encontrado.</p>
                        ) : (
                            <ul class="listaPessoasKits">
                                {pessoasFiltradasKits.map(pessoa => {
                                    const entregue = !!pessoa.kitEntregueEm;
                                    const processando = idProcessandoKit === pessoa.id;
                                    const confirmandoDesfazer = idConfirmandoDesfazerKit === pessoa.id;
                                    return (
                                        <li key={pessoa.id} class={`linhaPessoaKits ${entregue ? 'linhaEntregueKits' : ''}`}>
                                            <div class="infoPessoaKits">
                                                <span class="nomePessoaKits">{pessoa.nome}</span>
                                                <span class="detalhesPessoaKits">
                                                    <span class={`seloPapelKits ${pessoa.role === 'PARTICIPANTE' ? '' : 'seloComissaoKits'}`}>
                                                        {ROTULOS_PAPEL_KITS[pessoa.role] ?? pessoa.role}
                                                    </span>
                                                    {pessoa.ingresso && <span>{pessoa.ingresso}</span>}
                                                    <span class="camisetaPessoaKits">Camiseta: {textoCamisetasKits(pessoa.camisetas)}</span>
                                                </span>
                                                {entregue && <span class="textoEntregueKits">{textoEntregaKits(pessoa)}</span>}
                                            </div>
                                            <button
                                                type="button"
                                                class={`botaoEntregaKits ${entregue ? 'botaoDesfazerKits' : ''} ${confirmandoDesfazer ? 'botaoConfirmandoDesfazerKits' : ''}`}
                                                disabled={processando}
                                                onClick={() => alternarEntregaKit(pessoa)}
                                                onBlur={() => { if (confirmandoDesfazer) setIdConfirmandoDesfazerKit(null); }}
                                            >
                                                {processando
                                                    ? 'Salvando...'
                                                    : entregue
                                                        ? confirmandoDesfazer ? 'Toque de novo para desfazer' : 'Desfazer entrega'
                                                        : 'Marcar kit como entregue'}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div class="rodapeTabelaAdmin">
                            Exibindo {pessoasFiltradasKits.length} de {pessoasKits.length} pessoas
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

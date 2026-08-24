import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CATEGORIAS_COMPRA, CORES_CATEGORIA } from '../data/mockFinancas.js';
import { formatarCentavos, normalizar } from '../utils/moeda.js';
import { menorFornecedor } from './melhorPreco.js';
import './buscaItensConjunto.css';

const corDaCategoria = (categoria) => CORES_CATEGORIA[categoria] ?? CORES_CATEGORIA['Outros'];

/* Categorias na ordem em que aparecem no cadastro — mantém a mesma
   sequência nos resultados da busca e nas fichas. */
const ordemDaCategoria = (categoria) => {
    const indice = CATEGORIAS_COMPRA.indexOf(categoria);
    return indice === -1 ? CATEGORIAS_COMPRA.length : indice;
};

/* Busca as cotações já cadastradas e monta a lista de itens que entram no
   conjunto. As tabelas das variações renderizam só o que estiver aqui —
   por isso a página deixa de despejar todo o catálogo de cotações.

   O select de categoria restringe APENAS os resultados da busca: uma vez
   adicionado, o item continua na lista (e nas tabelas) independente da
   categoria selecionada. */
export default function BuscaItensConjunto({
    cotacoes,
    fornecedores,
    selecionados,
    aoAdicionar,
    aoRemover,
    aoLimpar,
}) {
    const [termo, setTermo] = useState('');
    const [categoria, setCategoria] = useState('');
    const [aberto, setAberto] = useState(false);
    const [indiceAtivo, setIndiceAtivo] = useState(0);

    const refEntrada = useRef(null);
    const refLista = useRef(null);

    const idsSelecionados = useMemo(() => new Set(selecionados), [selecionados]);
    const nomeFornecedor = (fornecedorId) => fornecedores.find((f) => f.id === fornecedorId)?.nome ?? '—';

    /* Cotações que a busca alcança: precisam ter ao menos um fornecedor
       cotado (sem preço não dá pra montar variação). */
    const candidatos = useMemo(() => {
        const termoNormalizado = normalizar(termo.trim());
        return cotacoes.filter((cotacao) => {
            if (cotacao.fornecedores.length === 0) return false;
            if (categoria && cotacao.categoria !== categoria) return false;
            if (termoNormalizado && !normalizar(cotacao.descricao).includes(termoNormalizado)) return false;
            return true;
        });
    }, [cotacoes, termo, categoria]);

    const gruposResultado = useMemo(() => {
        const porCategoria = new Map();
        for (const cotacao of candidatos) {
            if (idsSelecionados.has(cotacao.id)) continue;
            const lista = porCategoria.get(cotacao.categoria) ?? [];
            lista.push(cotacao);
            porCategoria.set(cotacao.categoria, lista);
        }
        return Array.from(porCategoria.entries()).sort(
            ([a], [b]) => ordemDaCategoria(a) - ordemDaCategoria(b),
        );
    }, [candidatos, idsSelecionados]);

    /* Lista achatada na mesma ordem em que é renderizada — é ela que o
       teclado percorre (aria-activedescendant aponta pro índice ativo). */
    const opcoesNavegaveis = useMemo(
        () => gruposResultado.flatMap(([, itens]) => itens),
        [gruposResultado],
    );

    const itensSelecionados = useMemo(
        () =>
            selecionados
                .map((id) => cotacoes.find((cotacao) => cotacao.id === id))
                .filter(Boolean)
                .sort(
                    (a, b) =>
                        ordemDaCategoria(a.categoria) - ordemDaCategoria(b.categoria) ||
                        a.descricao.localeCompare(b.descricao, 'pt-BR'),
                ),
        [selecionados, cotacoes],
    );

    useEffect(() => {
        if (indiceAtivo > opcoesNavegaveis.length - 1) setIndiceAtivo(0);
    }, [opcoesNavegaveis.length, indiceAtivo]);

    useEffect(() => {
        if (!aberto) return;
        refLista.current
            ?.querySelector(`[data-indice="${indiceAtivo}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [indiceAtivo, aberto]);

    const idDaOpcao = (indice) => `opcaoBuscaItensConjunto-${indice}`;

    const adicionar = (cotacao) => {
        aoAdicionar(cotacao);
        setTermo('');
        setIndiceAtivo(0);
        setAberto(true);
        refEntrada.current?.focus();
    };

    const aoTeclarNaBusca = (evento) => {
        if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
            evento.preventDefault();
            if (!aberto) {
                setAberto(true);
                return;
            }
            if (opcoesNavegaveis.length === 0) return;
            const passo = evento.key === 'ArrowDown' ? 1 : -1;
            setIndiceAtivo((atual) => (atual + passo + opcoesNavegaveis.length) % opcoesNavegaveis.length);
            return;
        }
        if (evento.key === 'Enter') {
            if (!aberto || !opcoesNavegaveis[indiceAtivo]) return;
            evento.preventDefault();
            adicionar(opcoesNavegaveis[indiceAtivo]);
            return;
        }
        if (evento.key === 'Escape' && aberto) {
            evento.preventDefault();
            setAberto(false);
        }
    };

    /* Fecha só quando o foco sai do bloco inteiro — clicar num resultado
       tira o foco do input, mas continua dentro do combobox. */
    const aoSairDoFoco = (evento) => {
        if (evento.currentTarget.contains(evento.relatedTarget)) return;
        setAberto(false);
    };

    return (
        <section className="painelItensConjuntoDetalhe">
            <div className="cabecalhoPainelItensConjuntoDetalhe">
                <h2 className="tituloPainelItensConjuntoDetalhe">Itens do conjunto</h2>
            </div>

            <div className="linhaBuscaItensConjuntoDetalhe" onFocusOut={aoSairDoFoco}>
                <div className="comboboxBuscaItensConjuntoDetalhe">
                    <div className="campoBuscaItensConjuntoDetalhe">
                        <span className="iconeBuscaItensConjuntoDetalhe">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </span>
                        <input
                            ref={refEntrada}
                            className="entradaBuscaItensConjuntoDetalhe"
                            type="text"
                            role="combobox"
                            placeholder="Buscar item cotado…"
                            aria-label="Buscar item cotado para adicionar ao conjunto"
                            aria-expanded={aberto}
                            aria-controls="listaResultadosBuscaItensConjunto"
                            aria-autocomplete="list"
                            aria-activedescendant={aberto && opcoesNavegaveis[indiceAtivo] ? idDaOpcao(indiceAtivo) : undefined}
                            autocomplete="off"
                            value={termo}
                            onInput={(e) => {
                                setTermo(e.currentTarget.value);
                                setIndiceAtivo(0);
                                setAberto(true);
                            }}
                            onFocus={() => setAberto(true)}
                            onKeyDown={aoTeclarNaBusca}
                        />
                    </div>

                    {aberto && (
                        <div
                            id="listaResultadosBuscaItensConjunto"
                            className="listaResultadosBuscaItensConjuntoDetalhe"
                            role="listbox"
                            aria-label="Itens cotados disponíveis"
                            ref={refLista}
                        >
                            {opcoesNavegaveis.length === 0 && (
                                <p className="vazioResultadosBuscaItensConjuntoDetalhe">
                                    {candidatos.length > 0
                                        ? 'Todos os itens dessa busca já estão no conjunto.'
                                        : 'Nenhum item cotado encontrado para essa busca.'}
                                </p>
                            )}

                            {gruposResultado.map(([categoriaGrupo, itensGrupo]) => {
                                const cor = corDaCategoria(categoriaGrupo);
                                return (
                                    <div
                                        className="grupoResultadosBuscaItensConjuntoDetalhe"
                                        key={categoriaGrupo}
                                        role="group"
                                        aria-label={categoriaGrupo}
                                    >
                                        <span
                                            className="tituloGrupoResultadosBuscaItensConjuntoDetalhe"
                                            style={{ color: cor.color }}
                                        >
                                            <span
                                                className="pontoGrupoResultadosBuscaItensConjuntoDetalhe"
                                                style={{ background: cor.color }}
                                            />
                                            {categoriaGrupo}
                                        </span>
                                        {itensGrupo.map((cotacao) => {
                                            const indice = opcoesNavegaveis.indexOf(cotacao);
                                            const linhaMaisBarata = menorFornecedor(cotacao);
                                            return (
                                                <div
                                                    key={cotacao.id}
                                                    id={idDaOpcao(indice)}
                                                    data-indice={indice}
                                                    role="option"
                                                    aria-selected={indice === indiceAtivo}
                                                    className={
                                                        indice === indiceAtivo
                                                            ? 'opcaoResultadoBuscaItensConjuntoDetalhe opcaoAtivaResultadoBuscaItensConjuntoDetalhe'
                                                            : 'opcaoResultadoBuscaItensConjuntoDetalhe'
                                                    }
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onMouseEnter={() => setIndiceAtivo(indice)}
                                                    onClick={() => adicionar(cotacao)}
                                                >
                                                    <span className="descricaoOpcaoBuscaItensConjuntoDetalhe">
                                                        {cotacao.descricao}
                                                    </span>
                                                    <span className="metaOpcaoBuscaItensConjuntoDetalhe">
                                                        <span className="fornecedorOpcaoBuscaItensConjuntoDetalhe">
                                                            {nomeFornecedor(linhaMaisBarata?.fornecedorId)}
                                                        </span>
                                                        <span className="precoOpcaoBuscaItensConjuntoDetalhe">
                                                            {formatarCentavos(linhaMaisBarata?.valorUnitario ?? 0)}
                                                        </span>
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <select
                    className="seletorCategoriaBuscaItensConjuntoDetalhe"
                    value={categoria}
                    onChange={(e) => {
                        setCategoria(e.currentTarget.value);
                        setIndiceAtivo(0);
                    }}
                    aria-label="Restringir a busca a uma categoria"
                >
                    <option value="">Todas as categorias</option>
                    {CATEGORIAS_COMPRA.map((nomeCategoria) => (
                        <option key={nomeCategoria} value={nomeCategoria}>{nomeCategoria}</option>
                    ))}
                </select>
            </div>

            {itensSelecionados.length === 0 ? (
                <p className="vazioFichasItensConjuntoDetalhe">
                    Nenhum item ainda. Busque acima e escolha o que entra neste conjunto.
                </p>
            ) : (
                <>
                    <div className="resumoFichasItensConjuntoDetalhe">
                        <span className="contagemFichasItensConjuntoDetalhe">
                            {itensSelecionados.length} {itensSelecionados.length === 1 ? 'item' : 'itens'} no conjunto
                        </span>
                        <button
                            type="button"
                            className="botaoLimparItensConjuntoDetalhe"
                            onClick={aoLimpar}
                        >
                            Limpar seleção
                        </button>
                    </div>
                    <ul className="trilhaFichasItensConjuntoDetalhe">
                        {itensSelecionados.map((cotacao) => {
                            const cor = corDaCategoria(cotacao.categoria);
                            return (
                                <li
                                    className="fichaItemSelecionadoConjuntoDetalhe"
                                    key={cotacao.id}
                                    style={{ background: cor.bg }}
                                >
                                    <span className="categoriaFichaItemConjuntoDetalhe" style={{ color: cor.color }}>
                                        {cotacao.categoria}
                                    </span>
                                    <span className="nomeFichaItemConjuntoDetalhe">{cotacao.descricao}</span>
                                    <button
                                        type="button"
                                        className="botaoRemoverFichaItemConjuntoDetalhe"
                                        aria-label={`Remover ${cotacao.descricao} do conjunto`}
                                        title="Remover do conjunto"
                                        onClick={() => aoRemover(cotacao)}
                                    >
                                        ×
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </section>
    );
}

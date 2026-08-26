import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CATEGORIAS_COMPRA, CORES_CATEGORIA } from '../data/mockFinancas.js';
import { formatarCentavos, normalizar } from '../utils/moeda.js';
import { menorFornecedor } from './melhorPreco.js';
import './buscaItemVariacao.css';

const corDaCategoria = (categoria) => CORES_CATEGORIA[categoria] ?? CORES_CATEGORIA['Outros'];

/* Categorias na ordem em que aparecem no cadastro — mantém a mesma
   sequência nos resultados da busca e nas linhas da tabela. */
const ordemDaCategoria = (categoria) => {
    const indice = CATEGORIAS_COMPRA.indexOf(categoria);
    return indice === -1 ? CATEGORIAS_COMPRA.length : indice;
};

/* Busca que alimenta UMA variação: cada variação monta a própria lista de
   itens, então esta barra aparece no topo de cada tabela e só enxerga o
   que já foi escolhido naquela variação.

   Os resultados abrem como bloco (empurrando a tabela) em vez de flutuar
   por cima: as colunas de variação vivem dentro de um container com
   overflow-x, que recortaria um painel posicionado de forma absoluta.

   O select de categoria restringe APENAS os resultados da busca — item já
   adicionado continua na tabela independente da categoria escolhida. */
export default function BuscaItemVariacao({
    variacaoId,
    variacaoNome,
    cotacoes,
    fornecedores,
    selecionados,
    aoAdicionar,
}) {
    const [termo, setTermo] = useState('');
    const [categoria, setCategoria] = useState('');
    const [aberto, setAberto] = useState(false);
    const [indiceAtivo, setIndiceAtivo] = useState(0);

    const refEntrada = useRef(null);
    const refLista = useRef(null);

    const idsSelecionados = useMemo(() => new Set(selecionados), [selecionados]);
    const nomeFornecedor = (fornecedorId) => fornecedores.find((f) => f.id === fornecedorId)?.nome ?? '—';

    const idDaLista = `listaResultadosBuscaItemVariacao-${variacaoId}`;
    const idDaOpcao = (indice) => `opcaoBuscaItemVariacao-${variacaoId}-${indice}`;

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

    useEffect(() => {
        if (indiceAtivo > opcoesNavegaveis.length - 1) setIndiceAtivo(0);
    }, [opcoesNavegaveis.length, indiceAtivo]);

    useEffect(() => {
        if (!aberto) return;
        refLista.current
            ?.querySelector(`[data-indice="${indiceAtivo}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [indiceAtivo, aberto]);

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
        <div className="buscaItemVariacao" onFocusOut={aoSairDoFoco}>
            <div className="linhaBuscaItemVariacao">
                <div className="campoBuscaItemVariacao">
                    <span className="iconeBuscaItemVariacao">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </span>
                    <input
                        ref={refEntrada}
                        className="entradaBuscaItemVariacao"
                        type="text"
                        role="combobox"
                        placeholder="Adicionar item cotado…"
                        aria-label={`Adicionar item cotado em ${variacaoNome}`}
                        aria-expanded={aberto}
                        aria-controls={idDaLista}
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

                <select
                    className="seletorCategoriaBuscaItemVariacao"
                    value={categoria}
                    onChange={(e) => {
                        setCategoria(e.currentTarget.value);
                        setIndiceAtivo(0);
                    }}
                    aria-label={`Restringir a busca de ${variacaoNome} a uma categoria`}
                >
                    <option value="">Todas as categorias</option>
                    {CATEGORIAS_COMPRA.map((nomeCategoria) => (
                        <option key={nomeCategoria} value={nomeCategoria}>{nomeCategoria}</option>
                    ))}
                </select>
            </div>

            {aberto && (
                <div
                    id={idDaLista}
                    className="painelResultadosBuscaItemVariacao"
                    role="listbox"
                    aria-label={`Itens cotados disponíveis para ${variacaoNome}`}
                    ref={refLista}
                >
                    {opcoesNavegaveis.length === 0 && (
                        <p className="vazioResultadosBuscaItemVariacao">
                            {candidatos.length > 0
                                ? 'Todos os itens dessa busca já estão nesta variação.'
                                : 'Nenhum item cotado encontrado para essa busca.'}
                        </p>
                    )}

                    {gruposResultado.map(([categoriaGrupo, itensGrupo]) => {
                        const cor = corDaCategoria(categoriaGrupo);
                        return (
                            <div
                                className="grupoResultadosBuscaItemVariacao"
                                key={categoriaGrupo}
                                role="group"
                                aria-label={categoriaGrupo}
                            >
                                <span className="tituloGrupoResultadosBuscaItemVariacao" style={{ color: cor.color }}>
                                    <span
                                        className="pontoGrupoResultadosBuscaItemVariacao"
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
                                                    ? 'opcaoResultadoBuscaItemVariacao opcaoAtivaResultadoBuscaItemVariacao'
                                                    : 'opcaoResultadoBuscaItemVariacao'
                                            }
                                            onMouseDown={(e) => e.preventDefault()}
                                            onMouseEnter={() => setIndiceAtivo(indice)}
                                            onClick={() => adicionar(cotacao)}
                                        >
                                            <span className="descricaoOpcaoBuscaItemVariacao">{cotacao.descricao}</span>
                                            <span className="metaOpcaoBuscaItemVariacao">
                                                <span className="fornecedorOpcaoBuscaItemVariacao">
                                                    {nomeFornecedor(linhaMaisBarata?.fornecedorId)}
                                                </span>
                                                <span className="precoOpcaoBuscaItemVariacao">
                                                    {formatarCentavos(linhaMaisBarata?.valorUnitario ?? 0)}
                                                    <span className="unidadeOpcaoBuscaItemVariacao"> / un</span>
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
    );
}

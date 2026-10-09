/* Categorias de gasto compartilhadas pelo módulo financeiro.

   A fonte única é a tabela `previsao_categoria`, cadastrada na aba
   Previsão — Compras, Cotações e Conjuntos usam a mesma lista (e a mesma
   cor) em filtros, formulários e selos. Compras e cotações guardam só o
   NOME da categoria, então um registro antigo pode citar uma categoria
   que não existe mais: ele segue exibido, com selo neutro. */

import { useEffect, useState } from 'preact/hooks';
import { listarCategoriasPrevisao } from './apiPrevisaoCategorias.js';

const COR_CATEGORIA_DESCONHECIDA = '#94a3b8';

/* Carrega as categorias uma vez por montagem — as abas do financeiro são
   recriadas a cada troca, então uma categoria criada na Previsão já
   aparece ao voltar para Compras ou Cotações. A API devolve na ordem do
   cadastro (ordem, nome). */
export function useCategoriasPrevisao() {
    const [categoriasPrevisao, setCategoriasPrevisao] = useState([]);
    const [erroCategoriasPrevisao, setErroCategoriasPrevisao] = useState('');

    useEffect(() => {
        let ativo = true;
        listarCategoriasPrevisao()
            .then((lista) => {
                if (ativo && lista) setCategoriasPrevisao(lista);
            })
            .catch((e) => {
                if (ativo) setErroCategoriasPrevisao(e.message);
            });
        return () => { ativo = false; };
    }, []);

    return { categoriasPrevisao, erroCategoriasPrevisao };
}

export function corDaCategoriaPrevisao(categoriasPrevisao, nomeCategoria) {
    return categoriasPrevisao.find((categoria) => categoria.nome === nomeCategoria)?.cor
        ?? COR_CATEGORIA_DESCONHECIDA;
}

/* Mesmo tratamento do seloCategoriaPrevisao: texto na cor e fundo na
   própria cor a ~15% de opacidade (sufixo hex 26). */
export function estiloSeloCategoriaPrevisao(categoriasPrevisao, nomeCategoria) {
    const cor = corDaCategoriaPrevisao(categoriasPrevisao, nomeCategoria);
    return { background: `${cor}26`, color: cor };
}

/* Posição da categoria no cadastro; desconhecidas vão para o fim. */
export function ordemDaCategoriaPrevisao(categoriasPrevisao, nomeCategoria) {
    const indice = categoriasPrevisao.findIndex((categoria) => categoria.nome === nomeCategoria);
    return indice === -1 ? categoriasPrevisao.length : indice;
}

/* Nomes para um <select>. Ao editar um registro com categoria que saiu do
   cadastro, o nome antigo entra no fim da lista para não ser trocado sem
   querer ao salvar. */
export function nomesCategoriasPrevisao(categoriasPrevisao, nomeAtual = '') {
    const nomes = categoriasPrevisao.map((categoria) => categoria.nome);
    if (nomeAtual && !nomes.includes(nomeAtual)) nomes.push(nomeAtual);
    return nomes;
}

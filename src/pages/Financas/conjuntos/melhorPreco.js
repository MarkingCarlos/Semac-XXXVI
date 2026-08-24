/* Melhor preço (menor valorUnitario) entre os fornecedores cotados pra um
   produto — usado como fornecedor padrão de uma linha até o usuário
   escolher outro no dropdown, e como preço de referência na busca de
   itens. Ignora o frete de propósito: ele é cobrado uma vez por
   fornecedor na variação inteira, então não dá pra atribuir a um produto
   isolado (ainda mais com quantidade zero, onde só o frete decidiria a
   escolha). */
export const menorFornecedor = (cotacao) =>
    cotacao.fornecedores.reduce((menor, linha) => (!menor || linha.valorUnitario < menor.valorUnitario ? linha : menor), null);

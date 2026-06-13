/* Utilidades de formatação monetária do módulo financeiro.
   Todos os valores são guardados em CENTAVOS (inteiros) para
   evitar erros de ponto flutuante em somas. */

export const formatarCentavos = (centavos) =>
    ((centavos ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const somenteDigitos = (texto) => texto.replace(/\D/g, '');

export const formatarData = (iso) =>
    new Date(iso).toLocaleDateString('pt-BR');

export const normalizar = (str) =>
    (str ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

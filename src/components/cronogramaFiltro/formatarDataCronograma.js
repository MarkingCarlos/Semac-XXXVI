/* "10 DE OUTUBRO" a partir de um Date. Usado no título do filtro e nos
   cabeçalhos de dia da lista do cronograma. */
export function formatarDataCronograma(data) {
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }).toUpperCase();
}

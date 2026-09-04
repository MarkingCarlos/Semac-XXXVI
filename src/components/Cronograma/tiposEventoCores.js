/* Cor do selo de tipo de evento (Minicurso, Mesa Redonda, Palestra...).
   `tipo_evento` é cadastrado livremente pelo admin (não é um enum fixo no
   banco), então mantemos aqui só um mapa para os nomes mais comuns; um
   tipo novo que o admin cadastrar cai no fallback por hash, que sempre
   devolve a mesma cor da paleta para o mesmo nome. */

const PALETA_FALLBACK_TIPO_EVENTO = ['#cebfd1', '#B13571', '#E79839', '#52ABB1', '#3DAA6A'];

const CORES_TIPO_EVENTO_CONHECIDO = {
  minicurso: '#E79839',
  mesa_redonda : '#52ABB1',
  palestra: 'var(--Branco)',
  workshop: '#3DAA6A',
  painel: '#B13571',
};

function normalizarNomeTipoEvento(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function hashNomeTipoEvento(nome) {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash * 31 + nome.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getCorTipoEvento(nomeTipo) {
  if (!nomeTipo) return null;
  const chave = normalizarNomeTipoEvento(nomeTipo);
  if (CORES_TIPO_EVENTO_CONHECIDO[chave]) return CORES_TIPO_EVENTO_CONHECIDO[chave];
  const indice = hashNomeTipoEvento(chave) % PALETA_FALLBACK_TIPO_EVENTO.length;
  return PALETA_FALLBACK_TIPO_EVENTO[indice];
}

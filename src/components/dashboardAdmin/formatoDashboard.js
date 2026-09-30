/* Formatação compartilhada pelos cards e modais da dashboard. As datas
   chegam do backend como LocalDateTime sem fuso ('2026-10-08T19:00:00'),
   então são lidas como texto e não passam por Date (evita deslocar fuso). */

/* '2026-10-08T19:00:00' → '08/10 · 19:00' */
export function formatarDiaHora(iso) {
    if (!iso) return '';
    const [data, hora = ''] = iso.split('T');
    const [, mes, dia] = data.split('-');
    return `${dia}/${mes} · ${hora.slice(0, 5)}`;
}

/* '2026-10-08T19:04:31' → '19:04' */
export function formatarHora(iso) {
    return iso ? iso.split('T')[1]?.slice(0, 5) ?? '' : '';
}

/* Porcentagem inteira entre 0 e 100; 0 quando não há total. */
export function porcentagem(parte, total) {
    if (!total) return 0;
    return Math.min(100, Math.max(0, Math.round((parte / total) * 100)));
}

/* Nome do membro que leu o QR; check-ins anteriores ao registro do
   operador (V47) vêm com nome nulo. */
export function nomeOperador(nome) {
    return nome || 'Operador não registrado';
}

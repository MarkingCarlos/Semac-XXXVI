/* Camada de acesso à programação pública (tabela `evento`). `GET /api/evento`
   é aberto (não exige login) — mesmo endpoint usado pelo /admin e pela
   agenda do participante, ver apiEventosParticipantes.js.

   O backend não guarda "dia da semana" nem link de transmissão por evento;
   aqui traduzimos a data/hora real (`dataHoraInicio`/`dataHoraFim`) para o
   formato que o Cronograma exibe, e mantemos o link de transmissão fixo
   (não há campo pra isso no banco — é o mesmo canal para todo evento). */

import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_EVENTO = `${API_URL}/api/evento`;
const ROTA_TRILHA = `${API_URL}/api/trilha`;

const LINK_TEXTO = 'YOUTUBE/SEMAC';
const LINK_URL = 'https://www.youtube.com/@SEMACsjrp';

const DIAS_SEMANA = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];

/* 'YYYY-MM-DDTHH:mm:ss' → Date local (sem conversão de fuso, como o resto
   do projeto já faz com datas vindas do backend). */
function paraDataLocal(iso) {
    const [dataParte, horaParte = '00:00:00'] = iso.split('T');
    const [ano, mes, dia] = dataParte.split('-').map(Number);
    const [hora, minuto] = horaParte.split(':').map(Number);
    return new Date(ano, mes - 1, dia, hora, minuto);
}

function horaCurta(iso) {
    const [, resto = ''] = iso.split('T');
    return resto.slice(0, 5);
}

function deResposta(evento) {
    const inicio = paraDataLocal(evento.dataHoraInicio);
    return {
        id: evento.id,
        titulo: evento.nome,
        palestrante: (evento.palestrantes || []).map((p) => p.nome).join(', ') || '—',
        descricao: evento.descricao || '',
        dia: DIAS_SEMANA[inicio.getDay()],
        categoria: evento.trilha ? evento.trilha.nome : null,
        tipo: evento.tipoEvento ? evento.tipoEvento.nome : null,
        horarioInicio: horaCurta(evento.dataHoraInicio),
        horarioFim: horaCurta(evento.dataHoraFim),
        dataHoraInicio: inicio,
        dataHoraFim: paraDataLocal(evento.dataHoraFim),
        local: evento.local || '—',
        linkTexto: LINK_TEXTO,
        linkUrl: LINK_URL,
    };
}

export async function listarEventosProgramacao() {
    const resposta = await apiFetch(ROTA_EVENTO);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar a programação.');
    }
    const lista = await resposta.json();
    return lista.map(deResposta);
}

/* Trilhas cadastradas no /admin — alimenta os chips de filtro (mesma
   lista que aparece no formulário de evento). */
export async function listarTrilhasProgramacao() {
    const resposta = await apiFetch(ROTA_TRILHA);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar as trilhas.');
    }
    const lista = await resposta.json();
    return lista.map((trilha) => trilha.nome);
}

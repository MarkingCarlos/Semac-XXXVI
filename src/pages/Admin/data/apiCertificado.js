/* Comunicação com a API de certificados (java_api). Base: /api/certificado.
   Usada pela subaba Certificados da aba Pessoas do /admin. */

import { apiFetch } from '../../../lib/apiFetch.js';
import { cabecalhosAuth } from '../../../auth/sessao.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/* Um item por palestrante em cada evento que ministrou, ordenado por nome
   e data: { palestranteId, nomePalestrante, eventoId, nomeEvento,
   codigoTipoEvento, dataHoraInicio, dataHoraFim }. */
export async function listarCertificados() {
    const resposta = await apiFetch(`${API_URL}/api/certificado`, { headers: cabecalhosAuth() });
    if (!resposta.ok) throw new Error('Não foi possível carregar a lista de certificados.');
    return resposta.json();
}

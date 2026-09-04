/* Camada de acesso aos patrocinadores exibidos no site (tabela `patrocinador`).
   `GET /api/patrocinador` é aberto (não exige login) — mesmo endpoint usado
   no financeiro (ver Financas/data/apiPatrocinios.js), aqui só filtramos e
   simplificamos pro que a seção pública (BoxPatrocinadores) precisa. */

import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA_PATROCINADOR = `${API_URL}/api/patrocinador`;

function deResposta(patrocinador) {
    return {
        id: patrocinador.id,
        nome: patrocinador.nome,
        nivel: patrocinador.cota?.nivel ?? null,
        logo: `${ROTA_PATROCINADOR}/${patrocinador.id}/logo`,
    };
}

/* Só entram patrocinadores com cota e logo já definidos — sem isso não há
   nível pra agrupar nem imagem pra mostrar. */
export async function listarPatrocinadoresPublicos() {
    const resposta = await apiFetch(ROTA_PATROCINADOR);
    if (!resposta.ok) {
        throw new Error('Falha ao carregar patrocinadores.');
    }
    const lista = await resposta.json();
    return lista
        .filter((p) => p.cota && p.logoUrl)
        .map(deResposta);
}

/* Camada de acesso aos desafios da Cifra do Dia (tabelas `desafio_cifra`
   e `desafio_cifra_etapa`), a partir do /admin -> Cifra do Dia. Restrito
   aos mesmos papéis do Termo.

   Só leitura: os desafios entram por migration no backend, e o admin
   apenas os vê e testa.

   A leitura devolve as respostas — a tela as mostra mascaradas até alguém
   clicar em "Mostrar". */

import { cabecalhosAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/desafio-cifra/admin`;

async function mensagemDeErro(resposta, padrao) {
    const corpo = await resposta.json().catch(() => null);
    return corpo?.mensagem || corpo?.message || padrao;
}

export async function listarDesafiosCifraAdmin(ano) {
    const resposta = await apiFetch(`${ROTA}?ano=${ano}`, { headers: cabecalhosAuth() });
    if (!resposta.ok) {
        throw new Error(await mensagemDeErro(resposta, 'Falha ao carregar os desafios da Cifra do Dia.'));
    }
    return resposta.json();
}

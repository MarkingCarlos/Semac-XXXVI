import { cabecalhosAuth, tratarErroAuth } from '../../../auth/sessao.js';
import { apiFetch } from '../../../lib/apiFetch.js';

/* Camada de acesso à API dos times (tabelas `time_semac` e
   `time_integrante`). Gerenciado no /admin, aba Times — restrito a
   DIRETOR_SITE/PRESIDENTE no backend, exceto o mascote (público, vai
   direto num <img src>) e `meu` (participante, usado pela página /time).

   Toda escrita do /admin devolve o painel inteiro atualizado, então a
   tela só precisa trocar o estado pelo que voltou. */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const ROTA = `${API_URL}/api/time`;

async function lerOuFalhar(resposta, mensagemPadrao, rotaRetorno = '/admin') {
    if (!resposta.ok) {
        if (tratarErroAuth(resposta, rotaRetorno)) return;
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.mensagem || mensagemPadrao);
    }
    return resposta.json();
}

export async function lerPainelTimes() {
    const resposta = await apiFetch(ROTA, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Falha ao carregar os times.');
}

export async function alterarTimesAtivos(ativos) {
    const resposta = await apiFetch(`${ROTA}/ativos`, {
        method: 'PATCH',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ativo: ativos }),
    });
    return lerOuFalhar(resposta, 'Falha ao ligar/desligar os times.');
}

export async function renomearTime(id, nome) {
    const resposta = await apiFetch(`${ROTA}/${id}`, {
        method: 'PUT',
        headers: cabecalhosAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nome }),
    });
    return lerOuFalhar(resposta, 'Falha ao salvar o nome do time.');
}

export async function enviarMascoteTime(id, arquivo) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    const resposta = await apiFetch(`${ROTA}/${id}/mascote`, {
        method: 'POST',
        headers: cabecalhosAuth(),
        body: formData,
        timeout: 60000, // upload de arquivo: janela maior que o padrão
    });
    return lerOuFalhar(resposta, 'Falha ao enviar o mascote.');
}

export async function sortearTimes() {
    const resposta = await apiFetch(`${ROTA}/sortear`, {
        method: 'POST',
        headers: cabecalhosAuth(),
    });
    return lerOuFalhar(resposta, 'Falha ao sortear os times.');
}

/* Página /time: o time do participante logado. */
export async function lerMeuTime() {
    const resposta = await apiFetch(`${ROTA}/meu`, { headers: cabecalhosAuth() });
    return lerOuFalhar(resposta, 'Não foi possível carregar seu time.', '/time');
}

/* O mascote aparece num círculo. Imagem quase quadrada preenche o círculo
   (object-fit: cover) sem perder nada; imagem alongada (ex.: 1268×3844)
   perderia topo e base no cover, então entra inteira, contida e com
   margem calculada (devolve a margem em %, ou false para preencher).

   Carrega a imagem por conta própria em vez de depender do onLoad do
   <img>: com a imagem já em cache o evento podia passar antes do handler
   e o mascote ficava cortado. De quebra, /time pré-carrega o mascote
   antes da revelação. Falha ao carregar resolve como não alongado. */
export function medirMascoteAlongado(url) {
    if (!url) return Promise.resolve(false);
    return new Promise((resolver) => {
        const imagem = new Image();
        imagem.onload = () => {
            const { naturalWidth: largura, naturalHeight: altura } = imagem;
            if (!largura || !altura) {
                resolver(false);
                return;
            }
            const proporcao = largura / altura;
            resolver(proporcao < 0.8 || proporcao > 1.25 ? margemMascoteContido(proporcao) : false);
        };
        imagem.onerror = () => resolver(false);
        imagem.src = url;
    });
}

/* Margem (em % do círculo) para a imagem contida ficar o maior possível
   sem os cantos saírem do círculo: um retângulo de proporção r cabe num
   círculo de diâmetro 1 com o lado maior = 1/√(1+r²), r ≤ 1. Usa 92% do
   círculo para o desenho não encostar na borda. Ex.: 1268×3844 → o lado
   maior ocupa ~87% do círculo; uma imagem quadrada, ~65%. */
function margemMascoteContido(proporcao) {
    const r = Math.min(proporcao, 1 / proporcao);
    const ladoMaior = 0.92 / Math.sqrt(1 + r * r);
    return `${(((1 - ladoMaior) / 2) * 100).toFixed(1)}%`;
}

/* URL pública do mascote. `mascoteVersao` (nome do arquivo em disco) entra
   como cache-buster — a rota responde com max-age de um dia. Null quando
   o time ainda não tem mascote. */
export function urlMascoteTime(id, mascoteVersao) {
    if (!mascoteVersao) return null;
    return `${ROTA}/${id}/mascote?v=${encodeURIComponent(mascoteVersao)}`;
}

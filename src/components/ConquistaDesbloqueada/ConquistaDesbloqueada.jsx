import { useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { urlImagemConquista } from '../../pages/Participantes/data/apiConquistasParticipante.js';
import './conquistaDesbloqueada.css';

/* Celebração de conquista desbloqueada — variante 1A ("mobile ·
   revelação") do protótipo feito no Claude Design.

   Tela cheia sobre o vinho escuro: os selos entram em preto e branco e
   ganham cor um a um, com um anel âmbar rompendo em cada um. O XP
   creditado soma no fim.

   Aparece UMA VEZ por conquista. Quem garante isso é o backend, não este
   componente: `participante_conquista.vista_em` (V36). Cada conquista é
   confirmada assim que a animação dela termina — não no fim da fila —,
   então fechar o app no meio não perde as que faltam nem repete as já
   vistas.

   Só transform, opacity e filter são animados. */

/* ⚠️ MODO DE TESTE — DESLIGAR ANTES DO DEPLOY ⚠️

   Com `true`, a celebração:
     · reaparece a cada recarregamento da página, ignorando `celebrar`;
     · não marca nada como vista no backend (`vista_em` fica intacto);
     · não sai sozinha — só sai no toque.

   É para ajustar a animação sem precisar conceder conquista nova a cada
   tentativa. Serve só para isso: ligado, ele desliga exatamente a regra do
   "uma vez só" que o sistema existe para garantir, e em produção todo
   participante veria a mesma celebração toda vez que abrisse o app.

   Voltar para `false` é a única coisa a fazer — nada mais depende disto. */
export const MODO_TESTE_CONQUISTA = false;

const RARIDADES = ['COMUM', 'COMUM', 'INCOMUM', 'RARA', 'ÉPICA', 'LENDÁRIA'];

/* Acima disso a fila não celebra uma a uma: seis animações seguidas é o
   incômodo que a regra do "uma vez só" existe para evitar. As excedentes
   entram na linha de resumo e são marcadas como vistas junto. */
const MAXIMO_CELEBRADAS = 3;

const PAUSA_MS = 1600;
const INTERVALO_MS = 160;

function iniciaisConquista(nome) {
    if (!nome) return '?';
    return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function ConquistaDesbloqueada({ conquistas, onConcluir, onCelebrada }) {
    const raizRef = useRef(null);
    const linhaTempoRef = useRef(null);

    const celebradas = conquistas.slice(0, MAXIMO_CELEBRADAS);
    const excedentes = conquistas.length - celebradas.length;
    const somaXp = conquistas.reduce((total, c) => total + (c.pontosBase ?? 0), 0);

    useGSAP(() => {
        const raiz = raizRef.current;
        if (!raiz || celebradas.length === 0) return;

        const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const q = gsap.utils.selector(raiz);

        const sobreposicao = raiz;
        const brilho = q('[data-brilho]');
        const titulo = q('[data-titulo]');
        const itens = q('[data-item]');
        const imagens = q('[data-imagem]');
        const aneis = q('[data-anel]');
        const textos = q('[data-texto]');
        const total = q('[data-total]');
        const dica = q('[data-dica]');

        /* Estado inicial: selo em preto e branco e menor, anel pronto para
           romper, textos abaixo. É de onde a revelação parte. */
        gsap.set(imagens, { filter: 'grayscale(1) contrast(0.85)', opacity: 0.45, scale: reduzir ? 1 : 0.8 });
        gsap.set(aneis, { autoAlpha: 0, scale: 0.9 });
        gsap.set(textos, { autoAlpha: reduzir ? 1 : 0, y: reduzir ? 0 : 8 });
        gsap.set(brilho, { autoAlpha: 0, scale: 0.7 });
        gsap.set(total, { autoAlpha: 0, scale: 0.9 });
        gsap.set(dica, { autoAlpha: 0 });

        const duracao = reduzir ? 0.2 : 0.4;
        const intervalo = reduzir ? 0.08 : INTERVALO_MS / 1000;

        const linha = gsap.timeline();
        linhaTempoRef.current = linha;

        linha.fromTo(sobreposicao, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
        if (!reduzir) {
            linha.to(brilho, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.05);
        } else {
            linha.set(brilho, { autoAlpha: 1, scale: 1 }, 0);
        }
        linha.fromTo(titulo, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'expo.out' }, 0.12);

        celebradas.forEach((conquista, i) => {
            const t = 0.25 + i * intervalo;
            const raridade = conquista.raridade ?? 1;

            linha.fromTo(itens[i],
                { autoAlpha: 0, y: reduzir ? 0 : 10 },
                { autoAlpha: 1, y: 0, duration: 0.3, ease: 'expo.out' }, t);

            /* A virada: é a mesma metáfora do CardConquista em repouso
               (grayscale + opacity .45), só que animada. */
            linha.to(imagens[i],
                { filter: 'grayscale(0) contrast(1)', opacity: 1, scale: 1, duration: duracao, ease: 'back.out(1.6)' },
                t + 0.05);

            /* O anel é o único lugar em que a raridade pesa: quanto mais
               rara, mais longe ele se abre. Nada além disso muda. */
            if (!reduzir) {
                linha.fromTo(aneis[i],
                    { autoAlpha: 1, scale: 0.9 },
                    { autoAlpha: 0, scale: 1 + raridade * 0.14, duration: 0.55, ease: 'power2.out' },
                    t + 0.1);
            }

            linha.to(textos[i], { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out' }, t + 0.15);

            /* Confirma a exibição desta conquista assim que a dela acaba. */
            linha.call(() => onCelebrada?.(conquista.id), null, t + 0.55);
        });

        const fim = 0.25 + (celebradas.length - 1) * intervalo + 0.75;
        linha.to(total, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, fim);
        linha.to(dica, { autoAlpha: 1, duration: 0.3 }, fim + 0.3);

        /* Sai sozinha se ninguém tocar — quem abriu o app só para ver o
           horário não fica preso. No modo de teste fica parada, para dar
           tempo de olhar o resultado. */
        if (!MODO_TESTE_CONQUISTA) {
            linha.call(() => fechar(), null, fim + PAUSA_MS / 1000);
        }
    }, { scope: raizRef, dependencies: [] });

    function fechar() {
        const raiz = raizRef.current;
        if (!raiz) { onConcluir?.(); return; }

        linhaTempoRef.current?.kill();

        /* As que não chegaram a ser celebradas (toque antes do fim, ou
           excedentes da fila) são confirmadas aqui: a pessoa dispensou, e
           reexibir na próxima abertura seria repetir. */
        conquistas.forEach((c) => onCelebrada?.(c.id));

        gsap.to(raiz, {
            autoAlpha: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => onConcluir?.(),
        });
    }

    if (celebradas.length === 0) return null;

    const titulo = conquistas.length > 1
        ? `${conquistas.length} CONQUISTAS DESBLOQUEADAS`
        : 'CONQUISTA DESBLOQUEADA';

    return createPortal(
        <div
            className={
                celebradas.length > 2
                    ? 'sobreposicaoConquistaDesbloqueada sobreposicaoConquistaDesbloqueadaFilaCheia'
                    : 'sobreposicaoConquistaDesbloqueada'
            }
            ref={raizRef}
            role="alertdialog"
            aria-label={titulo}
            onClick={fechar}
        >
            <div className="brilhoConquistaDesbloqueada" data-brilho aria-hidden="true" />

            <div className="tituloConquistaDesbloqueada" data-titulo>{titulo}</div>

            <div className="listaConquistaDesbloqueada">
                {celebradas.map((conquista) => {
                    const urlImagem = urlImagemConquista(conquista.id, conquista.imagemVersao);
                    return (
                        <div className="itemConquistaDesbloqueada" key={conquista.id} data-item>
                            <div className="molduraSeloConquistaDesbloqueada">
                                <div className="anelSeloConquistaDesbloqueada" data-anel aria-hidden="true" />
                                <div className="seloConquistaDesbloqueada" data-imagem>
                                    {urlImagem
                                        ? <img className="imagemSeloConquistaDesbloqueada" src={urlImagem} alt="" />
                                        : <span className="iniciaisSeloConquistaDesbloqueada">{iniciaisConquista(conquista.nome)}</span>}
                                </div>
                            </div>

                            <div className="textoConquistaDesbloqueada" data-texto>
                                <span className="nomeConquistaDesbloqueada">{conquista.nome}</span>
                                <span className="raridadeConquistaDesbloqueada">
                                    {RARIDADES[conquista.raridade ?? 1] ?? RARIDADES[1]}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {excedentes > 0 && (
                <span className="excedentesConquistaDesbloqueada">
                    {excedentes === 1 ? 'e mais 1 conquista' : `e mais ${excedentes} conquistas`}
                </span>
            )}

            <div className="totalConquistaDesbloqueada" data-total>+{somaXp} XP</div>

            <span className="dicaConquistaDesbloqueada" data-dica>toque em qualquer lugar para continuar</span>
        </div>,
        document.body,
    );
}

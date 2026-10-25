import { useState } from 'preact/hooks';
import {
    adicionarPerguntaMediacao,
    definirBlocoPerguntaDebate,
    editarPerguntaMediacao,
    excluirPerguntaDebate,
} from '../Admin/data/apiPerguntasDebate.js';

/* Roteiro do debate no painel (/debate/<id>): os blocos, cada um com as
   perguntas da mediação e a pergunta da plateia escolhida. Tudo fica no
   banco (pergunta_debate.bloco / da_mediacao), então dá para preparar
   antes, em qualquer aparelho, e editar as perguntas da mediação.

   A pergunta da plateia é escolhida na lista "Enviadas pelo público" do
   painel ("Usar no Bloco N"); aqui ela só aparece, é exibida ou sai do
   bloco. Os limites por bloco são só contador — não travam um imprevisto.

   `aoMudarPerguntas(perguntaAtualizada | null)` avisa o painel para
   atualizar a lista depois de cada alteração. `emModal`: dentro do modal
   do celular, sem a moldura e o título (o modal já tem) e sem recolher —
   o modal já é a forma de esconder o roteiro. */

export const TOTAL_BLOCOS_DEBATE = 4;
const PERGUNTAS_MEDIACAO_POR_BLOCO_DEBATE = 3;
const PERGUNTAS_PLATEIA_POR_BLOCO_DEBATE = 1;

/* Bloco recolhido (só as abas à mostra), lembrado neste aparelho. */
const CHAVE_ROTEIRO_RECOLHIDO_DEBATE = 'semacDebateRoteiroRecolhido';

function lerRoteiroRecolhidoDebate() {
    try {
        return localStorage.getItem(CHAVE_ROTEIRO_RECOLHIDO_DEBATE) === '1';
    } catch {
        return false;
    }
}

function salvarRoteiroRecolhidoDebate(recolhido) {
    try {
        localStorage.setItem(CHAVE_ROTEIRO_RECOLHIDO_DEBATE, recolhido ? '1' : '0');
    } catch {
        // sem armazenamento: só não lembra na próxima vez
    }
}

export default function RoteiroBlocosDebate({
    eventoId, perguntas, blocoAtivo, aoTrocarBloco, perguntaNoTelao, idsExibidas, aoExibir, aoMudarPerguntas,
    emModal = false,
}) {
    const [textoNovaPerguntaRoteiro, setTextoNovaPerguntaRoteiro] = useState('');
    const [idEditandoRoteiro, setIdEditandoRoteiro] = useState(null);
    const [textoEdicaoRoteiro, setTextoEdicaoRoteiro] = useState('');
    const [blocoEdicaoRoteiro, setBlocoEdicaoRoteiro] = useState(1);
    const [idConfirmandoRemocaoRoteiro, setIdConfirmandoRemocaoRoteiro] = useState(null);
    const [salvandoRoteiro, setSalvandoRoteiro] = useState(false);
    const [erroRoteiro, setErroRoteiro] = useState('');
    const [blocoRecolhidoSalvoRoteiro, setBlocoRecolhidoRoteiro] = useState(lerRoteiroRecolhidoDebate);
    const blocoRecolhidoRoteiro = !emModal && blocoRecolhidoSalvoRoteiro;

    function definirBlocoRecolhidoRoteiro(recolhido) {
        setBlocoRecolhidoRoteiro(recolhido);
        salvarRoteiroRecolhidoDebate(recolhido);
        if (recolhido) setIdEditandoRoteiro(null);
    }

    /* Tocar na aba já aberta recolhe/expande; tocar em outra abre ela. */
    function tocarAbaBlocoRoteiro(bloco) {
        if (bloco === blocoAtivo) {
            if (!emModal) definirBlocoRecolhidoRoteiro(!blocoRecolhidoRoteiro);
            return;
        }
        aoTrocarBloco(bloco);
        setIdEditandoRoteiro(null);
        definirBlocoRecolhidoRoteiro(false);
    }

    const mediacaoDoBloco = (bloco) => perguntas.filter((p) => p.daMediacao && p.bloco === bloco);
    const plateiaDoBloco = (bloco) => perguntas.filter((p) => !p.daMediacao && p.bloco === bloco);
    const perguntasMediacaoBloco = mediacaoDoBloco(blocoAtivo);
    const perguntasPlateiaBloco = plateiaDoBloco(blocoAtivo);

    async function executarRoteiro(acao) {
        setSalvandoRoteiro(true);
        setErroRoteiro('');
        try {
            aoMudarPerguntas(await acao());
            return true;
        } catch (e) {
            setErroRoteiro(e.message);
            return false;
        } finally {
            setSalvandoRoteiro(false);
        }
    }

    async function adicionarPerguntaRoteiro() {
        const limpo = textoNovaPerguntaRoteiro.trim();
        if (!limpo) return;
        const salvou = await executarRoteiro(() => adicionarPerguntaMediacao(eventoId, limpo, blocoAtivo));
        if (salvou) setTextoNovaPerguntaRoteiro('');
    }

    function iniciarEdicaoRoteiro(perguntaRoteiro) {
        setIdEditandoRoteiro(perguntaRoteiro.id);
        setTextoEdicaoRoteiro(perguntaRoteiro.texto);
        setBlocoEdicaoRoteiro(perguntaRoteiro.bloco ?? blocoAtivo);
        setIdConfirmandoRemocaoRoteiro(null);
    }

    async function salvarEdicaoRoteiro() {
        const limpo = textoEdicaoRoteiro.trim();
        if (!limpo) return;
        const salvou = await executarRoteiro(() =>
            editarPerguntaMediacao(idEditandoRoteiro, limpo, Number(blocoEdicaoRoteiro)));
        if (salvou) setIdEditandoRoteiro(null);
    }

    // Remover pede dois toques, como os outros "desfazer" do /admin.
    async function removerPerguntaRoteiro(perguntaRoteiro) {
        if (idConfirmandoRemocaoRoteiro !== perguntaRoteiro.id) {
            setIdConfirmandoRemocaoRoteiro(perguntaRoteiro.id);
            return;
        }
        setIdConfirmandoRemocaoRoteiro(null);
        await executarRoteiro(async () => {
            await excluirPerguntaDebate(perguntaRoteiro.id);
            return null;
        });
    }

    const tirarPlateiaDoBloco = (perguntaRoteiro) =>
        executarRoteiro(() => definirBlocoPerguntaDebate(perguntaRoteiro.id, null));

    const teclaNovaPerguntaRoteiro = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            adicionarPerguntaRoteiro();
        } else if (e.key === 'Escape') {
            e.currentTarget.blur();
        }
    };

    function classeItemRoteiro(perguntaRoteiro) {
        const ativa = perguntaRoteiro.texto === perguntaNoTelao ? 'liPerguntaAtivaPainelDebate' : '';
        const exibida = idsExibidas.includes(perguntaRoteiro.id) ? 'liPerguntaExibidaPainelDebate' : '';
        return `liPerguntaPainelDebate ${ativa} ${exibida}`;
    }

    const blocos = Array.from({ length: TOTAL_BLOCOS_DEBATE }, (_, indice) => indice + 1);

    return (
        <div className={`divRoteiroPainelDebate ${emModal ? 'divRoteiroEmModalPainelDebate' : ''}`}>
            {!emModal && (
                <div className="divCabecalhoRoteiroPainelDebate">
                    <span className="spanRotuloPainelDebate">Roteiro do debate</span>
                    <button
                        type="button"
                        className="botaoRecolherRoteiroPainelDebate"
                        aria-expanded={!blocoRecolhidoRoteiro}
                        onClick={() => definirBlocoRecolhidoRoteiro(!blocoRecolhidoRoteiro)}
                    >
                        {blocoRecolhidoRoteiro ? `Mostrar Bloco ${blocoAtivo}` : 'Recolher'}
                        <svg
                            className={`svgSetaRecolherRoteiroPainelDebate ${blocoRecolhidoRoteiro ? '' : 'svgSetaAbertaRoteiroPainelDebate'}`}
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="divAbasBlocosRoteiroPainelDebate" role="tablist" aria-label="Blocos do debate">
                {blocos.map((bloco) => (
                    <button
                        key={bloco}
                        type="button"
                        role="tab"
                        aria-selected={bloco === blocoAtivo}
                        aria-expanded={bloco === blocoAtivo ? !blocoRecolhidoRoteiro : undefined}
                        className={`botaoAbaBlocoRoteiroPainelDebate ${bloco === blocoAtivo ? 'botaoAbaBlocoAtivaRoteiroPainelDebate' : ''}`}
                        onClick={() => tocarAbaBlocoRoteiro(bloco)}
                    >
                        Bloco {bloco}
                        <span className="spanContagemBlocoRoteiroPainelDebate">
                            {mediacaoDoBloco(bloco).length}+{plateiaDoBloco(bloco).length}
                        </span>
                    </button>
                ))}
            </div>

            {erroRoteiro && <p className="pErroPainelDebate" role="alert">{erroRoteiro}</p>}

            {!blocoRecolhidoRoteiro && (
                <div className="divConteudoBlocoRoteiroPainelDebate">
                    <div className="divGrupoRoteiroPainelDebate">
                        <span className="spanSubrotuloRoteiroPainelDebate">
                            Mediação ({perguntasMediacaoBloco.length}/{PERGUNTAS_MEDIACAO_POR_BLOCO_DEBATE})
                        </span>
                        {perguntasMediacaoBloco.length === 0 && (
                            <p className="pVazioPainelDebate">Nenhuma pergunta da mediação neste bloco.</p>
                        )}
                        {perguntasMediacaoBloco.length > 0 && (
                            <ul className="ulPerguntasPainelDebate">
                                {perguntasMediacaoBloco.map((perguntaRoteiro) => (
                                    idEditandoRoteiro === perguntaRoteiro.id ? (
                                        <li key={perguntaRoteiro.id} className="liPerguntaPainelDebate liEdicaoRoteiroPainelDebate">
                                            <textarea
                                                className="textareaNovaPerguntaPainelDebate"
                                                rows={3}
                                                maxLength={500}
                                                value={textoEdicaoRoteiro}
                                                aria-label="Texto da pergunta"
                                                onInput={(e) => setTextoEdicaoRoteiro(e.currentTarget.value)}
                                            />
                                            <div className="divGrupoBotoesPainelDebate">
                                                <select
                                                    className="selectBlocoRoteiroPainelDebate"
                                                    aria-label="Bloco da pergunta"
                                                    value={blocoEdicaoRoteiro}
                                                    onChange={(e) => setBlocoEdicaoRoteiro(Number(e.currentTarget.value))}
                                                >
                                                    {blocos.map((bloco) => <option key={bloco} value={bloco}>Bloco {bloco}</option>)}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="botaoExibirPerguntaPainelDebate"
                                                    disabled={salvandoRoteiro || !textoEdicaoRoteiro.trim()}
                                                    onClick={salvarEdicaoRoteiro}
                                                >
                                                    {salvandoRoteiro ? 'Salvando…' : 'Salvar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="botaoRemoverPerguntaPainelDebate"
                                                    disabled={salvandoRoteiro}
                                                    onClick={() => setIdEditandoRoteiro(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </li>
                                    ) : (
                                        <li key={perguntaRoteiro.id} className={classeItemRoteiro(perguntaRoteiro)}>
                                            <p className="pTextoPerguntaPainelDebate">
                                                {perguntaRoteiro.texto}
                                                {idsExibidas.includes(perguntaRoteiro.id) && (
                                                    <span className="spanSeloExibidaPainelDebate">já exibida</span>
                                                )}
                                            </p>
                                            <button
                                                type="button"
                                                className="botaoExibirPerguntaPainelDebate"
                                                onClick={() => aoExibir(perguntaRoteiro.texto, perguntaRoteiro.id)}
                                            >
                                                Exibir
                                            </button>
                                            <button
                                                type="button"
                                                className="botaoRemoverPerguntaPainelDebate"
                                                disabled={salvandoRoteiro}
                                                onClick={() => iniciarEdicaoRoteiro(perguntaRoteiro)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="botaoRemoverPerguntaPainelDebate"
                                                disabled={salvandoRoteiro}
                                                onClick={() => removerPerguntaRoteiro(perguntaRoteiro)}
                                                onBlur={() => {
                                                    if (idConfirmandoRemocaoRoteiro === perguntaRoteiro.id) setIdConfirmandoRemocaoRoteiro(null);
                                                }}
                                            >
                                                {idConfirmandoRemocaoRoteiro === perguntaRoteiro.id ? 'Toque de novo' : 'Remover'}
                                            </button>
                                        </li>
                                    )
                                ))}
                            </ul>
                        )}

                        <textarea
                            className="textareaNovaPerguntaPainelDebate"
                            rows={2}
                            maxLength={500}
                            placeholder={`Nova pergunta da mediação para o Bloco ${blocoAtivo}…`}
                            aria-label={`Nova pergunta da mediação para o Bloco ${blocoAtivo}`}
                            value={textoNovaPerguntaRoteiro}
                            onInput={(e) => setTextoNovaPerguntaRoteiro(e.currentTarget.value)}
                            onKeyDown={teclaNovaPerguntaRoteiro}
                        />
                        <div className="divGrupoBotoesPainelDebate">
                            <button
                                type="button"
                                className="botaoTimerPainelDebate"
                                disabled={salvandoRoteiro || !textoNovaPerguntaRoteiro.trim()}
                                onClick={adicionarPerguntaRoteiro}
                            >
                                Adicionar ao Bloco {blocoAtivo}
                            </button>
                        </div>
                    </div>

                    <div className="divGrupoRoteiroPainelDebate">
                        <span className="spanSubrotuloRoteiroPainelDebate">
                            Plateia ({perguntasPlateiaBloco.length}/{PERGUNTAS_PLATEIA_POR_BLOCO_DEBATE})
                        </span>
                        {perguntasPlateiaBloco.length === 0 ? (
                            <p className="pVazioPainelDebate">
                                Escolha em "Enviadas pelo público", no painel, com "Usar no Bloco {blocoAtivo}".
                            </p>
                        ) : (
                            <ul className="ulPerguntasPainelDebate">
                                {perguntasPlateiaBloco.map((perguntaRoteiro) => (
                                    <li key={perguntaRoteiro.id} className={classeItemRoteiro(perguntaRoteiro)}>
                                        <p className="pTextoPerguntaPainelDebate">
                                            {perguntaRoteiro.texto}
                                            <span className="spanAutorRoteiroPainelDebate">{perguntaRoteiro.nomeParticipante}</span>
                                            {idsExibidas.includes(perguntaRoteiro.id) && (
                                                <span className="spanSeloExibidaPainelDebate">já exibida</span>
                                            )}
                                        </p>
                                        <button
                                            type="button"
                                            className="botaoExibirPerguntaPainelDebate"
                                            onClick={() => aoExibir(perguntaRoteiro.texto, perguntaRoteiro.id)}
                                        >
                                            Exibir
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoRemoverPerguntaPainelDebate"
                                            disabled={salvandoRoteiro}
                                            onClick={() => tirarPlateiaDoBloco(perguntaRoteiro)}
                                        >
                                            Tirar do bloco
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

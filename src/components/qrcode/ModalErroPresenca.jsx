import { useFechamentoAnimadoModalCheckin } from './hooks/useFechamentoAnimadoModalCheckin.js';
import './ModalErroPresenca.css';

/* O backend distingue os motivos de erro pela mensagem: uuid sem
   inscrição nesse evento ("não cadastrado"), já com presença marcada
   ("já registrada") ou ingresso diário fora dos dias escolhidos (começa
   com "Ingresso diário", ver InscricaoEventoService.exigirDiaDoIngresso).
   O título muda conforme o caso pra deixar claro de cara o que
   aconteceu, sem o operador precisar ler o parágrafo todo. */
function ehErroIngressoDiario(mensagem) {
    return mensagem.toLowerCase().startsWith('ingresso diário');
}

function tituloErro(mensagem) {
    if (ehErroIngressoDiario(mensagem)) return 'INGRESSO NÃO VÁLIDO HOJE';
    return mensagem.toLowerCase().includes('já registrada') ? 'PRESENÇA JÁ REGISTRADA' : 'NÃO CADASTRADO';
}

/* Painel que sobe da base da tela e desce ao fechar, no mesmo formato do
   de sucesso. Não fecha sozinho: o operador precisa ler o motivo. */
export default function ModalErroPresenca({ mensagem, onFechar }) {
    const ingressoDiario = ehErroIngressoDiario(mensagem);
    const titulo = tituloErro(mensagem);
    const { saindo, fechar, aoTerminarAnimacao } = useFechamentoAnimadoModalCheckin(onFechar);

    return (
        <div
            className={
                saindo
                    ? 'sobreposicaoModalErroPresenca sobreposicaoSaindoModalErroPresenca'
                    : 'sobreposicaoModalErroPresenca'
            }
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-label={titulo}
                className={saindo ? 'cartaoModalErroPresenca cartaoSaindoModalErroPresenca' : 'cartaoModalErroPresenca'}
                onAnimationEnd={aoTerminarAnimacao}
            >
                <div className="formaDecorativaModalErroPresenca" />
                <div className="alcaModalErroPresenca" aria-hidden="true" />
                <div className="conteudoModalErroPresenca">
                    <div className="tituloModalErroPresenca">{titulo}</div>

                    <div className="seloModalErroPresenca" aria-hidden="true">
                        <svg width="76" height="76" viewBox="0 0 24 24">
                            <path
                                className="formaSeloModalErroPresenca"
                                d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                            />
                            <path
                                className="xSeloModalErroPresenca"
                                d="M9.3 9.3l5.4 5.4M14.7 9.3l-5.4 5.4"
                                fill="none"
                                stroke-width="2.2"
                                stroke-linecap="round"
                            />
                        </svg>
                    </div>

                    <div className="mensagemModalErroPresenca">{mensagem}</div>
                    {ingressoDiario && (
                        <div className="avisoIngressoDiarioModalErroPresenca">
                            Não libere a entrada. O participante pode trocar os dias do ingresso na área do
                            participante, se o dia ainda não começou.
                        </div>
                    )}
                    <div className="acoesModalErroPresenca">
                        <button
                            type="button"
                            onClick={fechar}
                            disabled={saindo}
                            className="botaoFecharModalErroPresenca"
                        >
                            FECHAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

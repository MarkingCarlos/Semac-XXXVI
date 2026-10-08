import { useFechamentoAnimadoModalCheckin } from './hooks/useFechamentoAnimadoModalCheckin.js';
import './ModalSucessoPresenca.css';

/* Tela de sucesso dos modos do /checkin, em formato de painel que sobe
   da base da tela (e desce ao fechar). Recebe um `resultado` já
   normalizado por quem chamou — presença, conquista e teste têm DTOs
   diferentes, e a normalização fica no chamador para esta tela não
   precisar saber de qual operação veio.

   `fecharEmMs` (opcional) fecha sozinho depois desse tempo, com a mesma
   animação de saída do botão. */
export default function ModalSucessoPresenca({ resultado, onFechar, fecharEmMs = null }) {
    const { saindo, fechar, aoTerminarAnimacao } = useFechamentoAnimadoModalCheckin(onFechar, fecharEmMs);

    return (
        <div
            className={
                saindo
                    ? 'sobreposicaoModalSucessoPresenca sobreposicaoSaindoModalSucessoPresenca'
                    : 'sobreposicaoModalSucessoPresenca'
            }
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={resultado.titulo}
                className={
                    saindo
                        ? 'cartaoModalSucessoPresenca cartaoSaindoModalSucessoPresenca'
                        : 'cartaoModalSucessoPresenca'
                }
                onAnimationEnd={aoTerminarAnimacao}
            >
                <div className="formaDecorativaModalSucessoPresenca" />
                <div className="alcaModalSucessoPresenca" aria-hidden="true" />
                <div className="conteudoModalSucessoPresenca">
                    <div className="tituloModalSucessoPresenca">{resultado.titulo}</div>

                    <div className="seloModalSucessoPresenca" aria-hidden="true">
                        <svg width="76" height="76" viewBox="0 0 24 24">
                            <path
                                className="formaSeloModalSucessoPresenca"
                                d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                            />
                            <path
                                className="checkSeloModalSucessoPresenca"
                                d="m8.6 12.2 2.3 2.3 4.5-4.6"
                                fill="none"
                                stroke-width="2.2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </div>

                    <div className="nomeParticipanteModalSucessoPresenca">{resultado.nome}</div>
                    {resultado.info && (
                        <div className="infoParticipanteModalSucessoPresenca">{resultado.info}</div>
                    )}
                    {resultado.xpTexto && (
                        <div
                            className={
                                resultado.xpZerado
                                    ? 'xpModalSucessoPresenca xpZeradoModalSucessoPresenca'
                                    : 'xpModalSucessoPresenca'
                            }
                        >
                            {resultado.xpTexto}
                            {resultado.detalhe && (
                                <span className="atrasoModalSucessoPresenca"> · {resultado.detalhe}</span>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={fechar}
                        disabled={saindo}
                        className="botaoProximoModalSucessoPresenca"
                    >
                        LER PRÓXIMO
                    </button>
                </div>
            </div>
        </div>
    );
}

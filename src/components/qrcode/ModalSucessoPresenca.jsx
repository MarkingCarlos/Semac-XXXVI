import './ModalSucessoPresenca.css';

/* Tela de sucesso dos dois modos do /checkin. Recebe um `resultado` já
   normalizado por quem chamou — presença e conquista têm DTOs diferentes,
   e a normalização fica no chamador para esta tela não precisar saber de
   qual operação veio. */
export default function ModalSucessoPresenca({ resultado, onFechar }) {
    return (
        <div className="sobreposicaoModalSucessoPresenca">
            <div className="cartaoModalSucessoPresenca">
                <div className="formaDecorativaModalSucessoPresenca" />
                <div className="conteudoModalSucessoPresenca">
                    <div className="iconeCheckModalSucessoPresenca">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12.5l5.2 5.2L20 6.5" />
                        </svg>
                    </div>
                    <div className="tituloModalSucessoPresenca">{resultado.titulo}</div>
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
                    <button type="button" onClick={onFechar} className="botaoProximoModalSucessoPresenca">
                        LER PRÓXIMO
                    </button>
                </div>
            </div>
        </div>
    );
}

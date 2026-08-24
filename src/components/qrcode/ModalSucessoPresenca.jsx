import './ModalSucessoPresenca.css';

export default function ModalSucessoPresenca({ participante, onFechar }) {
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
                    <div className="tituloModalSucessoPresenca">PRESENÇA CONFIRMADA</div>
                    <div className="nomeParticipanteModalSucessoPresenca">{participante.nome}</div>
                    {participante.infoAdicional && (
                        <div className="infoParticipanteModalSucessoPresenca">{participante.infoAdicional}</div>
                    )}
                    <button type="button" onClick={onFechar} className="botaoProximoModalSucessoPresenca">
                        LER PRÓXIMO
                    </button>
                </div>
            </div>
        </div>
    );
}

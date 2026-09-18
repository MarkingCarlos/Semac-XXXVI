import './TelaSelecaoModoCheckin.css';

/* Qual conquista manual vai ser concedida nesta rodada de leituras.

   Só chegam aqui as MANUAIS e ativas (ver listarConquistasManuaisCheckin):
   automática o sistema concede sozinho, e inativa ainda não vale. */
export default function TelaSelecaoConquistaCheckin({ conquistas, onEscolher, onVoltar }) {
    return (
        <div className="containerTelaSelecaoModoCheckin">
            <div className="cabecalhoVoltarTelaSelecaoModoCheckin">
                <h2 className="tituloTelaSelecaoModoCheckin">QUAL CONQUISTA?</h2>
                <button type="button" onClick={onVoltar} className="botaoVoltarTelaSelecaoModoCheckin">
                    VOLTAR
                </button>
            </div>

            {conquistas.map((conquista) => (
                <button
                    key={conquista.id}
                    type="button"
                    className="cartaoModoCheckin"
                    onClick={() => onEscolher(conquista)}
                >
                    <span className="tituloCartaoModoCheckin">{conquista.nome}</span>
                    <span className="descricaoCartaoModoCheckin">
                        {conquista.descricao || 'Sem descrição.'}
                    </span>
                    <span className="pontosCartaoModoCheckin">+{conquista.pontosBase} XP</span>
                </button>
            ))}
        </div>
    );
}

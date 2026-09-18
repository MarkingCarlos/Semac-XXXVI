import './TelaSelecaoModoCheckin.css';

/* Primeira tela do /checkin: o que se vai fazer com os QR codes.

   "Conceder conquista" só aparece para diretores e presidência — quem é
   MEMBRO continua marcando presença normalmente, mas conceder credita
   pontos que mexem no ranking e fica com a diretoria (a checagem de
   verdade é no backend; aqui é para não oferecer o que vai dar 403).

   Sem conquista manual ativa, o modo aparece desabilitado com o motivo:
   é mais útil dizer "nenhuma conquista ativa" do que sumir e deixar a
   pessoa procurando o botão. */
export default function TelaSelecaoModoCheckin({
    podeConcederConquista,
    conquistasDisponiveis,
    onEscolherPresenca,
    onEscolherConquista,
}) {
    const semConquistas = conquistasDisponiveis === 0;

    return (
        <div className="containerTelaSelecaoModoCheckin">
            <h2 className="tituloTelaSelecaoModoCheckin">O QUE VOCÊ VAI FAZER?</h2>

            <button
                type="button"
                className="cartaoModoCheckin"
                onClick={onEscolherPresenca}
            >
                <span className="tituloCartaoModoCheckin">MARCAR PRESENÇA</span>
                <span className="descricaoCartaoModoCheckin">
                    Ler o crachá na entrada de uma palestra ou minicurso.
                </span>
            </button>

            {podeConcederConquista && (
                <button
                    type="button"
                    className="cartaoModoCheckin"
                    disabled={semConquistas}
                    onClick={onEscolherConquista}
                >
                    <span className="tituloCartaoModoCheckin">CONCEDER CONQUISTA</span>
                    <span className="descricaoCartaoModoCheckin">
                        {semConquistas
                            ? 'Nenhuma conquista manual ativa no momento.'
                            : 'Validar algo feito no mundo físico, como o cartaz carimbado.'}
                    </span>
                </button>
            )}
        </div>
    );
}

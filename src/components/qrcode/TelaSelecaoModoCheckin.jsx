import { useLocation } from 'wouter';
import './TelaSelecaoModoCheckin.css';

/* Primeira tela do /checkin: o que se vai fazer com os QR codes.

   "Conceder conquista" aparece para toda a comissão, mas MEMBRO só vê
   na lista as conquistas que pode conceder (hoje, a Alquimia Completa) —
   conceder credita pontos que mexem no ranking, então as outras ficam
   com a diretoria (a checagem de verdade é no backend).

   Sem conquista manual ativa, o modo aparece desabilitado com o motivo:
   é mais útil dizer "nenhuma conquista ativa" do que sumir e deixar a
   pessoa procurando o botão. */
export default function TelaSelecaoModoCheckin({
    podeConcederConquista,
    conquistasDisponiveis,
    onEscolherPresenca,
    onEscolherConquista,
    onEscolherTeste,
    onEscolherBrindeComissao,
}) {
    const semConquistas = conquistasDisponiveis === 0;
    const [, navegar] = useLocation();

    return (
        <div className="containerTelaSelecaoModoCheckin">
            {/* Entrada pelo menu do /admin — esta é a saída de volta. */}
            <div className="cabecalhoVoltarTelaSelecaoModoCheckin">
                <h2 className="tituloTelaSelecaoModoCheckin">O QUE VOCÊ VAI FAZER?</h2>
                <button
                    type="button"
                    onClick={() => navegar('/admin')}
                    className="botaoVoltarTelaSelecaoModoCheckin"
                >
                    ← ADMIN
                </button>
            </div>

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

            {/* Toda a comissão entrega: lê o QR que a pessoa mostra no /admin.
                Só vale em 26/10 — fora do dia o backend recusa com o aviso. */}
            <button
                type="button"
                className="cartaoModoCheckin"
                onClick={onEscolherBrindeComissao}
            >
                <span className="tituloCartaoModoCheckin">ENTREGAR MONSTER DA COMISSÃO</span>
            </button>

            {/* Toda a comissão: confere se o crachá é lido, sem registrar nada. */}
            <button
                type="button"
                className="cartaoModoCheckin"
                onClick={onEscolherTeste}
            >
                <span className="tituloCartaoModoCheckin">TESTAR LEITURA</span>
                <span className="descricaoCartaoModoCheckin">
                    Ler um crachá só para conferir o QR, não registra nada.
                </span>
            </button>
        </div>
    );
}

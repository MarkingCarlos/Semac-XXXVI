import { useState } from 'preact/hooks';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';

/* Palavras cadastradas de um dia do Termo. Fica fora do cartão para a
   tela do admin não virar uma parede de 80 linhas — o cartão só mostra
   quantas são e abre este modal (centralizado no desktop, de baixo para
   cima no mobile — ver ModalInferiorAdmin).

   As palavras continuam mascaradas até alguém clicar em "Mostrar". O
   conjunto de reveladas vive aqui dentro: fechar o modal desmonta o
   componente e mascara todas de novo. */

const rotuloJogadores = (total) => (total === 1 ? '1 jogador' : `${total} jogadores`);

export default function ModalPalavrasDiaTermo({ dia, rotuloData, palavraRemovendo, aoRemover, aoFechar }) {
    const [palavrasVisiveisModalTermo, setPalavrasVisiveisModalTermo] = useState(() => new Set());
    const [erroModalTermo, setErroModalTermo] = useState('');

    const removerPalavra = async (id) => {
        setErroModalTermo('');
        try {
            await aoRemover(id);
        } catch (e) {
            setErroModalTermo(e.message);
        }
    };

    const alternarVisibilidadePalavra = (id) => {
        setPalavrasVisiveisModalTermo((prev) => {
            const proximo = new Set(prev);
            if (proximo.has(id)) proximo.delete(id);
            else proximo.add(id);
            return proximo;
        });
    };

    return (
        <ModalInferiorAdmin
            titulo={`Palavras do dia ${dia.dia} · ${rotuloData}`}
            aoFechar={aoFechar}
            centralizadoNoDesktop
        >
            {erroModalTermo && <p className="avisoErroAdmin" role="alert">{erroModalTermo}</p>}

            {dia.palavras.length === 0 ? (
                <p className="estadoCarregandoParticipantesAdmin">
                    Nenhuma palavra cadastrada neste dia.
                </p>
            ) : (
                <ul className="listaPalavrasDiaTermoAdmin">
                    {dia.palavras.map((palavra) => {
                        const palavraVisivel = palavrasVisiveisModalTermo.has(palavra.id);
                        return (
                            <li key={palavra.id} className="itemPalavraDiaTermoAdmin">
                                <span className="textoPalavraDiaTermoAdmin">
                                    <strong
                                        className={palavraVisivel
                                            ? 'strongPalavraSecretaTermoAdmin'
                                            : 'strongPalavraSecretaTermoAdmin strongPalavraMascaradaTermoAdmin'}
                                        aria-label={palavraVisivel ? undefined : `Palavra oculta de ${palavra.tamanho} letras`}
                                    >
                                        {palavraVisivel ? palavra.palavra : '•'.repeat(palavra.tamanho)}
                                    </strong>
                                    <span className="spanDetalhesPalavraTermoAdmin">
                                        {palavra.tamanho} letras · {rotuloJogadores(palavra.jogadores)}
                                    </span>
                                </span>
                                <div className="divAcoesPalavraTermoAdmin">
                                    <button
                                        type="button"
                                        className="botaoMostrarPalavraTermoAdmin"
                                        aria-pressed={palavraVisivel}
                                        onClick={() => alternarVisibilidadePalavra(palavra.id)}
                                    >
                                        {palavraVisivel ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                    {/* Abre o jogo contra esta palavra em nova guia,
                                        sem gravar jogo nem creditar xp. */}
                                    <a
                                        className="botaoTestarPalavraTermoAdmin"
                                        href={`/termo/teste?palavra=${palavra.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Testar
                                    </a>
                                    {/* Palavra já sorteada fica: apagá-la levaria junto
                                        o jogo e as tentativas de quem a recebeu. */}
                                    <button
                                        type="button"
                                        className="botaoRemoverPalavraTermoAdmin"
                                        disabled={palavra.jogadores > 0 || palavraRemovendo === palavra.id}
                                        title={palavra.jogadores > 0
                                            ? 'Já sorteada para um participante — não pode ser removida'
                                            : 'Remover palavra'}
                                        onClick={() => removerPalavra(palavra.id)}
                                    >
                                        {palavraRemovendo === palavra.id ? 'Removendo…' : 'Remover'}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </ModalInferiorAdmin>
    );
}

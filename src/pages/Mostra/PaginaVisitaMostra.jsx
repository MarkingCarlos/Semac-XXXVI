import { useState, useEffect } from 'preact/hooks';
import { useParams } from 'wouter';
import { registrarVisitaMostra } from './apiVisitaMostra.js';
import './paginaVisitaMostra.css';

/* /mostra/<codigo> — o link do QR code impresso em cada stand da Mostra
   Técnica. O participante aponta a câmera do celular, cai aqui já logado
   (ou passa pelo login e volta, ver main.jsx) e a visita é registrada ao
   abrir a página.

   Ler o mesmo QR de novo não é erro: a tela só diz "você já visitou".
   Quando esta leitura fecha todos os trabalhos, a conquista sai na hora;
   a animação dela aparece na próxima abertura do /participantes, como as
   outras conquistas. */

export default function PaginaVisitaMostra() {
    const { codigo } = useParams();

    /* 'registrando' | 'registrada' | 'erro' */
    const [passoVisitaMostra, setPassoVisitaMostra] = useState('registrando');
    const [visitaMostra, setVisitaMostra] = useState(null);
    const [mensagemErroVisitaMostra, setMensagemErroVisitaMostra] = useState('');
    const [tentativaVisitaMostra, setTentativaVisitaMostra] = useState(0);

    useEffect(() => {
        let montado = true;
        setPassoVisitaMostra('registrando');
        registrarVisitaMostra(codigo)
            .then((dados) => {
                if (!montado || !dados) return;
                setVisitaMostra(dados);
                setPassoVisitaMostra('registrada');
            })
            .catch((e) => {
                if (!montado) return;
                setMensagemErroVisitaMostra(e.message);
                setPassoVisitaMostra('erro');
            });
        return () => { montado = false; };
    }, [codigo, tentativaVisitaMostra]);

    const percentualVisitaMostra = visitaMostra && visitaMostra.total > 0
        ? Math.round((visitaMostra.visitados / visitaMostra.total) * 100)
        : 0;
    const visitouTodosMostra = visitaMostra && visitaMostra.total > 0 && visitaMostra.visitados >= visitaMostra.total;
    const faltamMostra = visitaMostra ? visitaMostra.total - visitaMostra.visitados : 0;

    return (
        <main className="paginaVisitaMostra">
            <header className="cabecalhoVisitaMostra">
                <span className="marcaCabecalhoVisitaMostra">
                    SEMAC <span className="acentoMarcaCabecalhoVisitaMostra">XXXVI</span>
                </span>
                <span className="rotuloCabecalhoVisitaMostra">MOSTRA TÉCNICA</span>
            </header>

            <div className="conteudoVisitaMostra">
                {passoVisitaMostra === 'registrando' && (
                    <section className="passoCentralVisitaMostra" aria-live="polite">
                        <div className="indicadorCarregandoVisitaMostra" aria-hidden="true" />
                        <h1 className="tituloPassoVisitaMostra">REGISTRANDO SUA VISITA</h1>
                    </section>
                )}

                {passoVisitaMostra === 'erro' && (
                    <section className="passoCentralVisitaMostra" role="alert">
                        <h1 className="tituloPassoVisitaMostra">NÃO DEU CERTO</h1>
                        <p className="descricaoPassoVisitaMostra">{mensagemErroVisitaMostra}</p>
                        <button
                            type="button"
                            className="botaoPrincipalVisitaMostra"
                            onClick={() => setTentativaVisitaMostra((n) => n + 1)}
                        >
                            TENTAR DE NOVO
                        </button>
                        <a className="botaoSecundarioVisitaMostra" href="/participantes">IR PARA A PLATAFORMA</a>
                    </section>
                )}

                {passoVisitaMostra === 'registrada' && visitaMostra && (
                    <section className="passoCentralVisitaMostra" aria-live="polite">
                        <span className="chamadaVisitaMostra">
                            {visitaMostra.jaVisitado ? 'VOCÊ JÁ VISITOU ESTE TRABALHO' : 'VISITA REGISTRADA!'}
                        </span>

                        <div className="cartaoTrabalhoVisitaMostra">
                            <h1 className="tituloTrabalhoVisitaMostra">{visitaMostra.titulo}</h1>
                            <p className="apresentadoresTrabalhoVisitaMostra">{visitaMostra.apresentadores}</p>
                        </div>

                        <div className="blocoProgressoVisitaMostra">
                            <div className="linhaProgressoVisitaMostra">
                                <span className="rotuloProgressoVisitaMostra">SEU PROGRESSO</span>
                                <strong className="valorProgressoVisitaMostra">
                                    {visitaMostra.visitados} de {visitaMostra.total}
                                </strong>
                            </div>
                            <div
                                className="trilhaProgressoVisitaMostra"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={visitaMostra.total}
                                aria-valuenow={visitaMostra.visitados}
                            >
                                <div className="preenchimentoProgressoVisitaMostra" style={{ width: `${percentualVisitaMostra}%` }} />
                            </div>
                            <p className="notaProgressoVisitaMostra">
                                {visitouTodosMostra
                                    ? 'Você visitou todos os trabalhos da Mostra!'
                                    : faltamMostra === 1
                                        ? 'Falta 1 trabalho para a conquista "Explorador da Mostra".'
                                        : `Faltam ${faltamMostra} trabalhos para a conquista "Explorador da Mostra".`}
                            </p>
                        </div>

                        {visitaMostra.conquistaConcedida && (
                            <div className="cartaoConquistaVisitaMostra">
                                <span className="rotuloConquistaVisitaMostra">CONQUISTA DESBLOQUEADA</span>
                                <strong className="nomeConquistaVisitaMostra">Explorador da Mostra</strong>
                            </div>
                        )}

                        <div className="acoesVisitaMostra">
                            <a className="botaoPrincipalVisitaMostra" href="/participantes?tab=desafios">VER O QUE FALTA</a>
                            <a className="botaoSecundarioVisitaMostra" href="/participantes">IR PARA A PLATAFORMA</a>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

import { useState, useEffect } from 'preact/hooks';
import { lerProgressoMostra } from '../../Mostra/apiVisitaMostra.js';

/* Bloco "Mostra Técnica" da aba Desafios: quantos trabalhos a pessoa já
   visitou e quais faltam, com o stand de cada um, para ela saber aonde
   ir. A visita em si acontece lendo o QR do stand (/mostra/<codigo>).

   Carrega por conta própria em vez de entrar no catálogo de
   desafiosParticipantes.js: não é um jogo com situação e botão, é uma
   lista de progresso. Sem trabalho cadastrado na edição, o bloco some. */

export default function BlocoMostraDesafiosParticipantes() {
    const [progressoMostra, setProgressoMostra] = useState(null);
    const [erroMostra, setErroMostra] = useState('');

    useEffect(() => {
        let ativo = true;
        lerProgressoMostra()
            .then((dados) => { if (ativo && dados) setProgressoMostra(dados); })
            .catch(() => { if (ativo) setErroMostra('Não foi possível carregar a Mostra Técnica.'); });
        return () => { ativo = false; };
    }, []);

    if (erroMostra) {
        return <p className="avisoErroDesafiosParticipantes" role="alert">{erroMostra}</p>;
    }
    if (!progressoMostra || progressoMostra.total === 0) return null;

    const visitouTodos = progressoMostra.visitados >= progressoMostra.total;
    /* Pendentes primeiro: é o que a pessoa ainda precisa achar. */
    const trabalhosOrdenados = [...progressoMostra.trabalhos].sort((a, b) => Number(a.visitado) - Number(b.visitado));

    return (
        <section className="blocoDesafiosParticipantes">
            <div className="cabecalhoBlocoDesafiosParticipantes">
                <span className="tituloBlocoDesafiosParticipantes">MOSTRA TÉCNICA</span>
                <span className="subtituloBlocoDesafiosParticipantes">
                    Leia o QR code de cada stand para registrar sua visita
                </span>
            </div>

            <article className="cartaoDesafioParticipantes">
                <div className="cabecalhoCartaoDesafioParticipantes">
                    <span className="nomeCartaoDesafioParticipantes">EXPLORADOR DA MOSTRA</span>
                    <span className={`etiquetaCartaoDesafioParticipantes ${visitouTodos
                        ? 'etiquetaConcluidoDesafiosParticipantes'
                        : 'etiquetaDisponivelDesafiosParticipantes'}`}
                    >
                        {visitouTodos ? 'Concluído' : `${progressoMostra.visitados} de ${progressoMostra.total}`}
                    </span>
                </div>

                <div
                    className="trilhaProgressoMostraDesafiosParticipantes"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={progressoMostra.total}
                    aria-valuenow={progressoMostra.visitados}
                    aria-label="Trabalhos visitados"
                >
                    <div
                        className="preenchimentoProgressoMostraDesafiosParticipantes"
                        style={{ width: `${(progressoMostra.visitados / progressoMostra.total) * 100}%` }}
                    />
                </div>

                <ul className="listaTrabalhosMostraDesafiosParticipantes">
                    {trabalhosOrdenados.map((trabalho) => (
                        <li
                            key={trabalho.id}
                            className={trabalho.visitado
                                ? 'itemTrabalhoMostraDesafiosParticipantes itemVisitadoMostraDesafiosParticipantes'
                                : 'itemTrabalhoMostraDesafiosParticipantes'}
                        >
                            <span className="marcadorTrabalhoMostraDesafiosParticipantes" aria-hidden="true">
                                {trabalho.visitado ? '✓' : ''}
                            </span>
                            <span className="textoTrabalhoMostraDesafiosParticipantes">
                                <strong className="tituloTrabalhoMostraDesafiosParticipantes">{trabalho.titulo}</strong>
                                <span className="detalheTrabalhoMostraDesafiosParticipantes">
                                    {trabalho.stand ? `Stand ${trabalho.stand} · ` : ''}
                                    {trabalho.visitado ? 'Visitado' : 'Falta visitar'}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </article>
        </section>
    );
}

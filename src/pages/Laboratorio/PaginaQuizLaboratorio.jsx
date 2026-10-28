import { useState, useEffect } from 'preact/hooks';
import { useParams } from 'wouter';
import {
    abrirQuizLaboratorio,
    enviarRespostasQuizLaboratorio,
    abrirTesteQuizLaboratorio,
    enviarRespostasTesteQuizLaboratorio,
} from './apiQuizLaboratorio.js';
import './paginaQuizLaboratorio.css';

/* /laboratorio/<codigo> — o link do QR code de cada laboratório da Mostra
   Técnica. O participante aponta a câmera, cai aqui já logado (ou passa
   pelo login e volta, ver main.jsx) e responde o quiz do laboratório.

   Uma pergunta por tela; só envia com todas respondidas. É uma tentativa
   só: depois do envio (ou ao reabrir o QR) a tela mostra o placar. A
   correção pergunta a pergunta só aparece logo após o envio — o backend
   guarda apenas o placar. Quem acerta todas ganha 2 XP.

   Modo teste (`modoTeste`, rota /laboratorio/teste?laboratorio={id}),
   aberto pelo botão "Testar" do /admin: a comissão responde mesmo com o
   quiz fechado, a correção não grava nem dá XP e dá para refazer. */

export default function PaginaQuizLaboratorio({ modoTeste = false }) {
    const { codigo } = useParams();
    const laboratorioIdTeste = modoTeste
        ? new URLSearchParams(window.location.search).get('laboratorio')
        : null;
    const rotaSaidaQuizLaboratorio = modoTeste ? '/admin' : '/participantes';
    const textoSaidaQuizLaboratorio = modoTeste ? 'VOLTAR AO ADMIN' : 'IR PARA A PLATAFORMA';

    /* 'carregando' | 'erro' | 'fechado' | 'semPerguntas' | 'respondendo' | 'enviando' | 'resultado' */
    const [passoQuizLaboratorio, setPassoQuizLaboratorio] = useState('carregando');
    const [quizLaboratorio, setQuizLaboratorio] = useState(null);
    const [resultadoQuizLaboratorio, setResultadoQuizLaboratorio] = useState(null);
    const [mensagemErroQuizLaboratorio, setMensagemErroQuizLaboratorio] = useState('');
    const [tentativaCarregarQuizLaboratorio, setTentativaCarregarQuizLaboratorio] = useState(0);

    const [indicePerguntaAtual, setIndicePerguntaAtual] = useState(0);
    /* { [perguntaId]: alternativaId } */
    const [escolhasQuizLaboratorio, setEscolhasQuizLaboratorio] = useState({});

    useEffect(() => {
        let montado = true;
        setPassoQuizLaboratorio('carregando');
        if (modoTeste && !laboratorioIdTeste) {
            setMensagemErroQuizLaboratorio('Abra o teste pelo botão "Testar" do /admin.');
            setPassoQuizLaboratorio('erro');
            return undefined;
        }
        (modoTeste ? abrirTesteQuizLaboratorio(laboratorioIdTeste) : abrirQuizLaboratorio(codigo))
            .then((dados) => {
                if (!montado || !dados) return;
                setQuizLaboratorio(dados);
                if (dados.resultado) {
                    setResultadoQuizLaboratorio(dados.resultado);
                    setPassoQuizLaboratorio('resultado');
                } else if (!dados.quizAberto) {
                    setPassoQuizLaboratorio('fechado');
                } else if (dados.perguntas.length === 0) {
                    setPassoQuizLaboratorio('semPerguntas');
                } else {
                    setIndicePerguntaAtual(0);
                    setEscolhasQuizLaboratorio({});
                    setPassoQuizLaboratorio('respondendo');
                }
            })
            .catch((e) => {
                if (!montado) return;
                setMensagemErroQuizLaboratorio(e.message);
                setPassoQuizLaboratorio('erro');
            });
        return () => { montado = false; };
    }, [codigo, laboratorioIdTeste, tentativaCarregarQuizLaboratorio]);

    const recarregarQuizLaboratorio = () => setTentativaCarregarQuizLaboratorio((n) => n + 1);

    const perguntas = quizLaboratorio?.perguntas ?? [];
    const perguntaAtual = perguntas[indicePerguntaAtual];
    const ultimaPergunta = indicePerguntaAtual === perguntas.length - 1;
    const escolhaAtual = perguntaAtual ? escolhasQuizLaboratorio[perguntaAtual.id] : undefined;

    const enviarRespostas = async () => {
        setPassoQuizLaboratorio('enviando');
        try {
            const escolhas = perguntas.map((p) => ({ perguntaId: p.id, alternativaId: escolhasQuizLaboratorio[p.id] }));
            const resultado = modoTeste
                ? await enviarRespostasTesteQuizLaboratorio(laboratorioIdTeste, escolhas)
                : await enviarRespostasQuizLaboratorio(codigo, escolhas);
            if (!resultado) return;
            setResultadoQuizLaboratorio(resultado);
            setPassoQuizLaboratorio('resultado');
        } catch (e) {
            setMensagemErroQuizLaboratorio(e.message);
            setPassoQuizLaboratorio('erro');
        }
    };

    const avancar = () => {
        if (escolhaAtual === undefined) return;
        if (ultimaPergunta) {
            enviarRespostas();
        } else {
            setIndicePerguntaAtual((i) => i + 1);
        }
    };

    /* Só no teste: volta para a 1ª pergunta sem respostas. */
    const testarNovamente = () => {
        setResultadoQuizLaboratorio(null);
        setEscolhasQuizLaboratorio({});
        setIndicePerguntaAtual(0);
        setPassoQuizLaboratorio('respondendo');
    };

    const textoAlternativa = (pergunta, alternativaId) =>
        pergunta.alternativas.find((a) => a.id === alternativaId)?.texto ?? '—';

    return (
        <main className="paginaQuizLaboratorio">
            <header className="cabecalhoQuizLaboratorio">
                <span className="marcaCabecalhoQuizLaboratorio">
                    SEMAC <span className="acentoMarcaCabecalhoQuizLaboratorio">XXXVI</span>
                </span>
                <span className="rotuloCabecalhoQuizLaboratorio">QUIZ DOS LABORATÓRIOS</span>
            </header>

            {modoTeste && (
                <div className="faixaTesteQuizLaboratorio" role="note">
                    MODO TESTE · não vale XP e não fica gravado
                </div>
            )}

            <div className="conteudoQuizLaboratorio">
                {(passoQuizLaboratorio === 'carregando' || passoQuizLaboratorio === 'enviando') && (
                    <section className="passoCentralQuizLaboratorio" aria-live="polite">
                        <div className="indicadorCarregandoQuizLaboratorio" aria-hidden="true" />
                        <h1 className="tituloPassoQuizLaboratorio">
                            {passoQuizLaboratorio === 'enviando' ? 'CORRIGINDO' : 'ABRINDO O QUIZ'}
                        </h1>
                    </section>
                )}

                {passoQuizLaboratorio === 'erro' && (
                    <section className="passoCentralQuizLaboratorio" role="alert">
                        <h1 className="tituloPassoQuizLaboratorio">NÃO DEU CERTO</h1>
                        <p className="descricaoPassoQuizLaboratorio">{mensagemErroQuizLaboratorio}</p>
                        <button type="button" className="botaoPrincipalQuizLaboratorio" onClick={recarregarQuizLaboratorio}>
                            TENTAR DE NOVO
                        </button>
                        <a className="botaoSecundarioQuizLaboratorio" href={rotaSaidaQuizLaboratorio}>{textoSaidaQuizLaboratorio}</a>
                    </section>
                )}

                {(passoQuizLaboratorio === 'fechado' || passoQuizLaboratorio === 'semPerguntas') && quizLaboratorio && (
                    <section className="passoCentralQuizLaboratorio" aria-live="polite">
                        <div className="cartaoLaboratorioQuizLaboratorio">
                            <h1 className="nomeLaboratorioQuizLaboratorio">{quizLaboratorio.nome}</h1>
                            {quizLaboratorio.responsaveis && (
                                <p className="responsaveisLaboratorioQuizLaboratorio">{quizLaboratorio.responsaveis}</p>
                            )}
                        </div>
                        <h2 className="tituloPassoQuizLaboratorio">
                            {passoQuizLaboratorio === 'fechado' ? 'QUIZ AINDA FECHADO' : 'SEM PERGUNTAS AINDA'}
                        </h2>
                        <p className="descricaoPassoQuizLaboratorio">
                            O quiz deste laboratório ainda não foi liberado. Tente de novo daqui a pouco.
                        </p>
                        <button type="button" className="botaoPrincipalQuizLaboratorio" onClick={recarregarQuizLaboratorio}>
                            TENTAR DE NOVO
                        </button>
                        <a className="botaoSecundarioQuizLaboratorio" href={rotaSaidaQuizLaboratorio}>{textoSaidaQuizLaboratorio}</a>
                    </section>
                )}

                {passoQuizLaboratorio === 'respondendo' && perguntaAtual && (
                    <section className="passoPerguntaQuizLaboratorio">
                        <div className="blocoProgressoQuizLaboratorio">
                            <div className="linhaProgressoQuizLaboratorio">
                                <span className="nomeProgressoQuizLaboratorio">{quizLaboratorio.nome}</span>
                                <strong className="valorProgressoQuizLaboratorio">
                                    {indicePerguntaAtual + 1}/{perguntas.length}
                                </strong>
                            </div>
                            <div
                                className="trilhaProgressoQuizLaboratorio"
                                role="progressbar"
                                aria-label="Progresso do quiz"
                                aria-valuemin={1}
                                aria-valuemax={perguntas.length}
                                aria-valuenow={indicePerguntaAtual + 1}
                            >
                                <div
                                    className="preenchimentoProgressoQuizLaboratorio"
                                    style={{ width: `${((indicePerguntaAtual + 1) / perguntas.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <fieldset key={perguntaAtual.id} className="fieldsetPerguntaQuizLaboratorio">
                            <legend className="enunciadoPerguntaQuizLaboratorio">{perguntaAtual.enunciado}</legend>
                            <div className="listaAlternativasQuizLaboratorio">
                                {perguntaAtual.alternativas.map((alternativa, indice) => {
                                    const marcada = escolhaAtual === alternativa.id;
                                    return (
                                        <label
                                            key={alternativa.id}
                                            className={marcada
                                                ? 'alternativaQuizLaboratorio alternativaMarcadaQuizLaboratorio'
                                                : 'alternativaQuizLaboratorio'}
                                        >
                                            <input
                                                type="radio"
                                                className="radioAlternativaQuizLaboratorio"
                                                name={`pergunta${perguntaAtual.id}`}
                                                checked={marcada}
                                                onChange={() => setEscolhasQuizLaboratorio((e) => ({ ...e, [perguntaAtual.id]: alternativa.id }))}
                                            />
                                            <span className="letraAlternativaQuizLaboratorio" aria-hidden="true">
                                                {String.fromCharCode(65 + indice)}
                                            </span>
                                            <span className="textoAlternativaQuizLaboratorio">{alternativa.texto}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="acoesPerguntaQuizLaboratorio">
                            {indicePerguntaAtual > 0 && (
                                <button
                                    type="button"
                                    className="botaoSecundarioQuizLaboratorio"
                                    onClick={() => setIndicePerguntaAtual((i) => i - 1)}
                                >
                                    VOLTAR
                                </button>
                            )}
                            <button
                                type="button"
                                className="botaoPrincipalQuizLaboratorio"
                                disabled={escolhaAtual === undefined}
                                onClick={avancar}
                            >
                                {ultimaPergunta ? 'ENVIAR RESPOSTAS' : 'PRÓXIMA'}
                            </button>
                        </div>
                        {ultimaPergunta && (
                            <p className="notaEnvioQuizLaboratorio">Você só pode enviar uma vez.</p>
                        )}
                    </section>
                )}

                {passoQuizLaboratorio === 'resultado' && resultadoQuizLaboratorio && quizLaboratorio && (
                    <section className="passoCentralQuizLaboratorio" aria-live="polite">
                        <span className="chamadaQuizLaboratorio">
                            {resultadoQuizLaboratorio.correcao
                                ? (resultadoQuizLaboratorio.gabaritou ? 'GABARITOU!' : 'QUIZ ENVIADO')
                                : 'VOCÊ JÁ RESPONDEU ESTE QUIZ'}
                        </span>

                        <div className="cartaoLaboratorioQuizLaboratorio">
                            <h1 className="nomeLaboratorioQuizLaboratorio">{quizLaboratorio.nome}</h1>
                            <strong className="placarQuizLaboratorio">
                                {resultadoQuizLaboratorio.acertos}/{resultadoQuizLaboratorio.total}
                            </strong>
                            <span className="rotuloPlacarQuizLaboratorio">
                                {resultadoQuizLaboratorio.acertos === 1 ? 'acerto' : 'acertos'}
                            </span>
                        </div>

                        {modoTeste ? (
                            <p className="descricaoPassoQuizLaboratorio">Teste não vale pontos.</p>
                        ) : resultadoQuizLaboratorio.xpCreditado > 0 ? (
                            <div className="cartaoXpQuizLaboratorio">
                                <span className="rotuloXpQuizLaboratorio">RANKING</span>
                                <strong className="valorXpQuizLaboratorio">+{resultadoQuizLaboratorio.xpCreditado} XP</strong>
                            </div>
                        ) : (
                            <p className="descricaoPassoQuizLaboratorio">
                                Só quem acerta todas ganha XP. Aproveite os outros laboratórios!
                            </p>
                        )}

                        {resultadoQuizLaboratorio.correcao && (
                            <ol className="listaCorrecaoQuizLaboratorio">
                                {resultadoQuizLaboratorio.correcao.map((item, indice) => {
                                    const pergunta = perguntas.find((p) => p.id === item.perguntaId);
                                    if (!pergunta) return null;
                                    return (
                                        <li
                                            key={item.perguntaId}
                                            className={item.acertou
                                                ? 'itemCorrecaoQuizLaboratorio itemAcertoQuizLaboratorio'
                                                : 'itemCorrecaoQuizLaboratorio itemErroQuizLaboratorio'}
                                        >
                                            <span className="enunciadoCorrecaoQuizLaboratorio">
                                                {indice + 1}. {pergunta.enunciado}
                                            </span>
                                            <span className="respostaCorrecaoQuizLaboratorio">
                                                {item.acertou ? '✓ ' : '✗ '}
                                                {textoAlternativa(pergunta, item.alternativaEscolhidaId)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}

                        <div className="acoesFinaisQuizLaboratorio">
                            {modoTeste ? (
                                <>
                                    <button type="button" className="botaoPrincipalQuizLaboratorio" onClick={testarNovamente}>
                                        TESTAR NOVAMENTE
                                    </button>
                                    <a className="botaoSecundarioQuizLaboratorio" href={rotaSaidaQuizLaboratorio}>
                                        {textoSaidaQuizLaboratorio}
                                    </a>
                                </>
                            ) : (
                                <a className="botaoPrincipalQuizLaboratorio" href={rotaSaidaQuizLaboratorio}>
                                    {textoSaidaQuizLaboratorio}
                                </a>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

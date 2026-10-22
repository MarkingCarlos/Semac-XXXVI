import { useState, useEffect, useRef } from 'preact/hooks';
import { lerSessao, temSessaoValida, temAcessoParticipante, temAcessoAdmin } from '../../auth/sessao.js';
import { listarDebatesAbertosPerguntas, enviarPerguntaPublica } from './apiPerguntas.js';
import ModalLoginPerguntas from './ModalLoginPerguntas.jsx';
import logoSemacHorizontal from '../../assets/logoSemacHorizontal.svg';
import './paginaPerguntas.css';

/* /perguntas — página pública para mandar pergunta aos debates. É o link
   que vai no QR do telão e que se manda para professores e convidados,
   que não têm conta. Quem tem login pergunta com o nome da conta (e o
   participante ganha a conquista na primeira pergunta); quem não tem
   pode deixar o nome ou mandar como anônimo.

   Sem login, "Enviar" abre antes o ModalLoginPerguntas: entrar (e ganhar
   a conquista) ou enviar assim mesmo. Quem escolhe entrar vai ao login e
   volta para cá com o rascunho restaurado (sessionStorage).

   `?evento=<id>` já deixa um debate escolhido — para um QR por debate. */

/* Mesmos limites validados no backend (PerguntaRequestDTO). */
const LIMITE_CARACTERES_PERGUNTA_PUBLICA = 500;
const LIMITE_CARACTERES_NOME_PERGUNTA_PUBLICA = 120;

const CHAVE_RASCUNHO_PERGUNTA_PUBLICA = 'semacRascunhoPerguntaDebate';
const ROTA_LOGIN_PERGUNTAS = '/inscricoes?tab=entrar&next=/perguntas';

/* O armazenamento pode estar bloqueado (aba anônima, site sem permissão):
   aí o rascunho só não sobrevive ao login, e a página segue funcionando. */
function guardarRascunhoPerguntaPublica(rascunho) {
    try {
        sessionStorage.setItem(CHAVE_RASCUNHO_PERGUNTA_PUBLICA, JSON.stringify(rascunho));
    } catch { /* sem armazenamento: segue sem rascunho */ }
}

/* Lê e apaga: o rascunho vale para uma volta do login, não para sempre. */
function retirarRascunhoPerguntaPublica() {
    try {
        const texto = sessionStorage.getItem(CHAVE_RASCUNHO_PERGUNTA_PUBLICA);
        sessionStorage.removeItem(CHAVE_RASCUNHO_PERGUNTA_PUBLICA);
        return texto ? JSON.parse(texto) : null;
    } catch {
        return null;
    }
}

function formatarHorarioDebatePerguntas(dataHoraInicio) {
    const data = new Date(dataHoraInicio);
    const dia = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dia.replace('.', '')} · ${hora}`;
}

function idDebateDaUrlPerguntas() {
    const id = Number(new URLSearchParams(window.location.search).get('evento'));
    return Number.isInteger(id) && id > 0 ? id : null;
}

export default function PaginaPerguntas() {
    const logadoPerguntas = temSessaoValida() && !!lerSessao()?.nome;
    const nomeContaPerguntas = logadoPerguntas ? lerSessao().nome : '';
    const participantePerguntas = temAcessoParticipante();

    /* Atalho para a área de quem está logado: participante vai para o
       /participantes, comissão para o /admin. Inscrição ainda pendente (sem
       papel) não tem área nenhuma, então fica sem o botão. */
    const areaLogadaPerguntas = participantePerguntas
        ? { rota: '/participantes', rotulo: 'IR PARA PARTICIPANTES' }
        : temAcessoAdmin()
            ? { rota: '/admin', rotulo: 'IR PARA O ADMIN' }
            : null;

    /* 'carregando' | 'erroCarregar' | 'semDebates' | 'formulario' | 'enviada' */
    const [passoPerguntas, setPassoPerguntas] = useState('carregando');
    const [debatesAbertosPerguntas, setDebatesAbertosPerguntas] = useState([]);
    const [idDebateEscolhidoPerguntas, setIdDebateEscolhidoPerguntas] = useState(null);
    const [textoPerguntaPublica, setTextoPerguntaPublica] = useState('');
    const [nomeAutorPerguntaPublica, setNomeAutorPerguntaPublica] = useState('');
    const [enviandoPerguntaPublica, setEnviandoPerguntaPublica] = useState(false);
    const [erroEnvioPerguntaPublica, setErroEnvioPerguntaPublica] = useState('');
    const [conquistaConcedidaPerguntas, setConquistaConcedidaPerguntas] = useState(false);
    const [perguntasEnviadasPerguntas, setPerguntasEnviadasPerguntas] = useState(0);
    const [tentativaCarregarPerguntas, setTentativaCarregarPerguntas] = useState(0);
    const [modalLoginAbertoPerguntas, setModalLoginAbertoPerguntas] = useState(false);
    const campoTextoPerguntaPublicaRef = useRef(null);

    useEffect(() => {
        let montado = true;
        setPassoPerguntas('carregando');
        listarDebatesAbertosPerguntas()
            .then((debates) => {
                if (!montado) return;
                setDebatesAbertosPerguntas(debates);
                if (debates.length === 0) {
                    setPassoPerguntas('semDebates');
                    return;
                }
                /* Volta do login: o rascunho guardado antes vence o ?evento=. */
                const rascunho = retirarRascunhoPerguntaPublica();
                const idPreferido = rascunho?.idDebate ?? idDebateDaUrlPerguntas();
                const debatePreferido = debates.find((debate) => debate.id === idPreferido);
                setIdDebateEscolhidoPerguntas(debatePreferido?.id ?? (debates.length === 1 ? debates[0].id : null));
                if (rascunho) {
                    setTextoPerguntaPublica(String(rascunho.texto ?? '').slice(0, LIMITE_CARACTERES_PERGUNTA_PUBLICA));
                    setNomeAutorPerguntaPublica(String(rascunho.nome ?? '').slice(0, LIMITE_CARACTERES_NOME_PERGUNTA_PUBLICA));
                }
                setPassoPerguntas('formulario');
            })
            .catch(() => { if (montado) setPassoPerguntas('erroCarregar'); });
        return () => { montado = false; };
    }, [tentativaCarregarPerguntas]);

    const debateEscolhidoPerguntas = debatesAbertosPerguntas.find((debate) => debate.id === idDebateEscolhidoPerguntas);
    const textoLimpoPerguntaPublica = textoPerguntaPublica.trim();
    const podeEnviarPerguntaPublica = !!debateEscolhidoPerguntas && textoLimpoPerguntaPublica.length > 0 && !enviandoPerguntaPublica;

    /* Sem login, o envio passa antes pelo modal que oferece entrar. */
    function aoEnviarFormularioPerguntas(envio) {
        envio.preventDefault();
        if (!podeEnviarPerguntaPublica) return;
        if (logadoPerguntas) {
            enviarPergunta();
            return;
        }
        setModalLoginAbertoPerguntas(true);
    }

    function aoFecharModalLoginPerguntas(escolha) {
        setModalLoginAbertoPerguntas(false);
        if (escolha === 'entrar') {
            guardarRascunhoPerguntaPublica({
                idDebate: idDebateEscolhidoPerguntas,
                texto: textoPerguntaPublica,
                nome: nomeAutorPerguntaPublica,
            });
            window.location.assign(ROTA_LOGIN_PERGUNTAS);
        } else if (escolha === 'enviarSemLogin') {
            enviarPergunta();
        }
    }

    async function enviarPergunta() {
        if (!podeEnviarPerguntaPublica) return;
        setEnviandoPerguntaPublica(true);
        setErroEnvioPerguntaPublica('');
        try {
            const resposta = await enviarPerguntaPublica({
                eventoId: idDebateEscolhidoPerguntas,
                texto: textoLimpoPerguntaPublica,
                nome: logadoPerguntas ? null : nomeAutorPerguntaPublica.trim(),
            });
            setConquistaConcedidaPerguntas(!!resposta?.conquistaConcedida);
            setPerguntasEnviadasPerguntas((total) => total + 1);
            setTextoPerguntaPublica('');
            setPassoPerguntas('enviada');
        } catch (erro) {
            setErroEnvioPerguntaPublica(erro.message);
        } finally {
            setEnviandoPerguntaPublica(false);
        }
    }

    function mandarOutraPergunta() {
        setConquistaConcedidaPerguntas(false);
        setPassoPerguntas('formulario');
        /* Espera o textarea voltar ao DOM para focar. */
        requestAnimationFrame(() => campoTextoPerguntaPublicaRef.current?.focus({ preventScroll: true }));
    }

    return (
        <main className="paginaPerguntas">
            <header className="cabecalhoPerguntas">
                <a className="marcaCabecalhoPerguntas" href="/" aria-label="SEMAC 2026 — página inicial">
                    <img className="imgLogoCabecalhoPerguntas" src={logoSemacHorizontal} alt="" />
                </a>
                <span className="rotuloCabecalhoPerguntas">PERGUNTAS PARA O DEBATE</span>
            </header>

            {/* A rolagem fica aqui dentro (tela travada, ver o CSS); o Lenis
                do site não pode capturar a roda do mouse. */}
            <div className="conteudoPerguntas" data-lenis-prevent>
                {passoPerguntas === 'carregando' && (
                    <section className="passoCentralPerguntas" aria-live="polite">
                        <div className="indicadorCarregandoPerguntas" aria-hidden="true" />
                        <h1 className="tituloPassoPerguntas">CARREGANDO OS DEBATES</h1>
                    </section>
                )}

                {passoPerguntas === 'erroCarregar' && (
                    <section className="passoCentralPerguntas" role="alert">
                        <h1 className="tituloPassoPerguntas">NÃO DEU CERTO</h1>
                        <p className="descricaoPassoPerguntas">Não foi possível carregar os debates. Verifique sua conexão.</p>
                        <button
                            type="button"
                            className="botaoPrincipalPerguntas"
                            onClick={() => setTentativaCarregarPerguntas((n) => n + 1)}
                        >
                            TENTAR DE NOVO
                        </button>
                    </section>
                )}

                {passoPerguntas === 'semDebates' && (
                    <section className="passoCentralPerguntas" aria-live="polite">
                        <h1 className="tituloPassoPerguntas">PERGUNTAS FECHADAS</h1>
                        <p className="descricaoPassoPerguntas">
                            Nenhum debate está recebendo perguntas agora. Volte quando a organização abrir o envio.
                        </p>
                        <a className="botaoSecundarioPerguntas" href="/">VER A PROGRAMAÇÃO</a>
                    </section>
                )}

                {passoPerguntas === 'enviada' && (
                    <section className="passoCentralPerguntas" aria-live="polite">
                        <span className="chamadaPerguntas">PERGUNTA ENVIADA!</span>
                        <p className="descricaoPassoPerguntas">
                            {perguntasEnviadasPerguntas === 1
                                ? 'A mediação vai levar sua pergunta para o debate.'
                                : `Você já mandou ${perguntasEnviadasPerguntas} perguntas por aqui.`}
                        </p>

                        {conquistaConcedidaPerguntas && (
                            <div className="cartaoConquistaPerguntas">
                                <span className="rotuloConquistaPerguntas">CONQUISTA DESBLOQUEADA</span>
                                <span className="textoConquistaPerguntas">
                                    Ela aparece na próxima vez que você abrir a plataforma.
                                </span>
                            </div>
                        )}

                        <div className="acoesPerguntas">
                            <button type="button" className="botaoPrincipalPerguntas" onClick={mandarOutraPergunta}>
                                MANDAR OUTRA
                            </button>
                            {areaLogadaPerguntas && (
                                <a className="botaoSecundarioPerguntas" href={areaLogadaPerguntas.rota}>
                                    {areaLogadaPerguntas.rotulo}
                                </a>
                            )}
                        </div>
                    </section>
                )}

                {passoPerguntas === 'formulario' && (
                    <form className="formularioPerguntas" onSubmit={aoEnviarFormularioPerguntas}>
                        <h1 className="tituloPassoPerguntas">MANDE SUA PERGUNTA</h1>

                        {debatesAbertosPerguntas.length > 1 ? (
                            <fieldset className="grupoDebatesPerguntas">
                                <legend className="rotuloCampoPerguntas">Para qual debate?</legend>
                                {debatesAbertosPerguntas.map((debate) => (
                                    <label
                                        key={debate.id}
                                        className={debate.id === idDebateEscolhidoPerguntas
                                            ? 'opcaoDebatePerguntas opcaoDebateEscolhidaPerguntas'
                                            : 'opcaoDebatePerguntas'}
                                    >
                                        <input
                                            type="radio"
                                            name="debatePerguntas"
                                            className="radioDebatePerguntas"
                                            value={debate.id}
                                            checked={debate.id === idDebateEscolhidoPerguntas}
                                            onChange={() => setIdDebateEscolhidoPerguntas(debate.id)}
                                        />
                                        <span className="textoOpcaoDebatePerguntas">
                                            <strong className="nomeOpcaoDebatePerguntas">{debate.nome}</strong>
                                            <span className="horarioOpcaoDebatePerguntas">
                                                {formatarHorarioDebatePerguntas(debate.dataHoraInicio)}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </fieldset>
                        ) : (
                            <div className="cartaoDebateUnicoPerguntas">
                                <span className="rotuloCampoPerguntas">Debate</span>
                                <strong className="nomeOpcaoDebatePerguntas">{debateEscolhidoPerguntas?.nome}</strong>
                                <span className="horarioOpcaoDebatePerguntas">
                                    {debateEscolhidoPerguntas && formatarHorarioDebatePerguntas(debateEscolhidoPerguntas.dataHoraInicio)}
                                </span>
                            </div>
                        )}

                        <div className="campoPerguntas">
                            <label htmlFor="campoTextoPerguntaPublica" className="rotuloCampoPerguntas">Sua pergunta</label>
                            <textarea
                                id="campoTextoPerguntaPublica"
                                ref={campoTextoPerguntaPublicaRef}
                                className="areaTextoPerguntas"
                                rows={5}
                                maxLength={LIMITE_CARACTERES_PERGUNTA_PUBLICA}
                                placeholder="O que você quer perguntar aos debatedores?"
                                value={textoPerguntaPublica}
                                onInput={(digitacao) => setTextoPerguntaPublica(digitacao.currentTarget.value)}
                            />
                            <span className="contadorCaracteresPerguntas" aria-live="polite">
                                {textoPerguntaPublica.length}/{LIMITE_CARACTERES_PERGUNTA_PUBLICA}
                            </span>
                        </div>

                        {logadoPerguntas ? (
                            <p className="avisoAutorPerguntas">
                                Enviando como <strong>{nomeContaPerguntas}</strong>
                                {participantePerguntas && ' · sua primeira pergunta vale uma conquista'}
                            </p>
                        ) : (
                            <div className="campoPerguntas">
                                <label htmlFor="campoNomeAutorPerguntaPublica" className="rotuloCampoPerguntas">
                                    Seu nome <span className="opcionalCampoPerguntas">(opcional)</span>
                                </label>
                                <input
                                    id="campoNomeAutorPerguntaPublica"
                                    className="entradaNomePerguntas"
                                    type="text"
                                    autoComplete="name"
                                    maxLength={LIMITE_CARACTERES_NOME_PERGUNTA_PUBLICA}
                                    placeholder="Em branco, a pergunta vai como anônima"
                                    value={nomeAutorPerguntaPublica}
                                    onInput={(digitacao) => setNomeAutorPerguntaPublica(digitacao.currentTarget.value)}
                                />
                            </div>
                        )}

                        {erroEnvioPerguntaPublica && (
                            <p className="erroPerguntas" role="alert">{erroEnvioPerguntaPublica}</p>
                        )}

                        <button type="submit" className="botaoPrincipalPerguntas" disabled={!podeEnviarPerguntaPublica}>
                            {enviandoPerguntaPublica ? 'ENVIANDO…' : 'ENVIAR PERGUNTA'}
                        </button>
                        {areaLogadaPerguntas && (
                            <a className="botaoSecundarioPerguntas" href={areaLogadaPerguntas.rota}>
                                {areaLogadaPerguntas.rotulo}
                            </a>
                        )}
                    </form>
                )}
            </div>

            {modalLoginAbertoPerguntas && <ModalLoginPerguntas aoFechar={aoFecharModalLoginPerguntas} />}
        </main>
    );
}

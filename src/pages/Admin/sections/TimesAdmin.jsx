import { useState, useEffect } from 'preact/hooks';
import {
    lerPainelTimes,
    alterarTimesAtivos,
    renomearTime,
    enviarMascoteTime,
    sortearTimes,
    urlMascoteTime,
    medirMascoteAlongado,
} from '../data/apiTimes.js';
import './timesAdmin.css';

/* Times — os três times da SEMAC. Bloco da sub-aba Gamificação de
   Informações SEMAC, restrito a DIRETOR_SITE/PRESIDENTE (quem monta ou
   não este componente é o InformacoesSemac.jsx).

   O participante descobre o time em /time, link do QR code do cartão
   entregue no evento. Enquanto o interruptor estiver desligado, quem
   escaneia vai para o /participantes sem ver nada.

   O sorteio reparte só quem tem pagamento confirmado, com no máximo 1
   pessoa de diferença entre os times. Quem confirmar depois entra
   sozinho no time com menos gente, na primeira vez que abrir /time.

   Revelação programada (`revelacaoProgramadaEm`, V73): a partir do
   horário os times valem mesmo com o interruptor desligado. O interruptor
   serve para liberar antes. */

/* "Programada para 26/10 às 07:00" ou, já passado o horário, o aviso de
   que desligar o interruptor não esconde mais os times. */
function textoRevelacaoProgramadaTimes(painel) {
    const horario = new Date(painel.revelacaoProgramadaEm);
    const dia = horario.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const hora = horario.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const jaPassou = horario.getTime() <= Date.now();
    return jaPassou
        ? `Revelados automaticamente em ${dia} às ${hora} — desligar aqui não esconde mais os times.`
        : `Revelação programada para ${dia} às ${hora}.`;
}

export default function TimesAdmin() {
    const [painel, setPainel] = useState(null);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    /* Nome em edição por time (id → texto). */
    const [rascunhosNome, setRascunhosNome] = useState({});
    /* Trava as ações enquanto uma escrita está em trânsito. */
    const [acaoEmCurso, setAcaoEmCurso] = useState(null);
    const [confirmandoSorteio, setConfirmandoSorteio] = useState(false);
    /* Preview igual ao de /time: mascote alongado entra contido (id → margem, ou false). */
    const [mascotesAlongados, setMascotesAlongados] = useState({});

    useEffect(() => {
        let ativo = true;
        lerPainelTimes()
            .then((dados) => { if (ativo && dados) aplicarPainel(dados); })
            .catch((e) => { if (ativo) setErro(e.message); });
        return () => { ativo = false; };
    }, []);

    /* Mede cada mascote de novo sempre que a versão muda (upload novo). */
    const versoesMascote = painel ? painel.times.map((t) => `${t.id}:${t.mascoteVersao ?? ''}`).join('|') : '';
    useEffect(() => {
        if (!painel) return;
        let ativo = true;
        painel.times.forEach((time) => {
            medirMascoteAlongado(urlMascoteTime(time.id, time.mascoteVersao)).then((alongado) => {
                if (ativo) setMascotesAlongados((prev) => ({ ...prev, [time.id]: alongado }));
            });
        });
        return () => { ativo = false; };
    }, [versoesMascote]);

    function aplicarPainel(dados) {
        setPainel(dados);
        setRascunhosNome(Object.fromEntries(dados.times.map((t) => [t.id, t.nome])));
    }

    async function executar(idAcao, operacao, mensagemSucesso) {
        setErro('');
        setAviso('');
        setAcaoEmCurso(idAcao);
        try {
            const dados = await operacao();
            if (dados) aplicarPainel(dados);
            if (mensagemSucesso) setAviso(mensagemSucesso);
        } catch (e) {
            setErro(e.message);
        } finally {
            setAcaoEmCurso(null);
        }
    }

    const alternarAtivos = (ativos) => executar(
        'ativos',
        () => alterarTimesAtivos(ativos),
        ativos ? 'Revelação ligada: o QR code já mostra o time.' : 'Revelação desligada.',
    );

    const salvarNome = (time) => {
        const nome = (rascunhosNome[time.id] ?? '').trim();
        if (!nome) {
            setErro('O nome do time não pode ficar vazio.');
            return;
        }
        executar(`nome-${time.id}`, () => renomearTime(time.id, nome), `Nome do ${nome.toUpperCase()} salvo.`);
    };

    const trocarMascote = (time, arquivo) => {
        if (!arquivo) return;
        executar(`mascote-${time.id}`, () => enviarMascoteTime(time.id, arquivo), `Mascote do ${time.nome} atualizado.`);
    };

    const confirmarSorteio = () => {
        setConfirmandoSorteio(false);
        executar('sorteio', sortearTimes, 'Times sorteados.');
    };

    if (!painel) {
        return (
            <section className="blocoInfoSemac" aria-label="Times">
                <CabecalhoTimesAdmin />
                {erro
                    ? <p className="avisoErroAdmin" role="alert">{erro}</p>
                    : <p className="estadoCarregandoParticipantesAdmin">Carregando times…</p>}
            </section>
        );
    }

    const jaSorteado = painel.sorteados > 0;
    const foraDoSorteio = Math.max(painel.participantesElegiveis - painel.sorteados, 0);

    return (
        <section className="blocoInfoSemac" aria-label="Times">
            <CabecalhoTimesAdmin />

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}
            {aviso && <p className="avisoSucessoTimesAdmin" role="status">{aviso}</p>}

            <div className="faixaResumoAdmin">
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Pagamento confirmado</span>
                    <strong className="valorItemResumoAdmin">{painel.participantesElegiveis}</strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Com time</span>
                    <strong className="valorItemResumoAdmin valorDestaqueAdmin">{painel.sorteados}</strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Já viram o time</span>
                    <strong className="valorItemResumoAdmin">{painel.revelados}</strong>
                </div>
            </div>

            {/* ── Interruptor e sorteio ───────────────────────── */}
            <div className="faixaControlesTimesAdmin">
                <label className="cartaoInterruptorTimesAdmin">
                    <input
                        type="checkbox"
                        className="entradaInterruptorTimesAdmin"
                        checked={painel.ativos}
                        disabled={acaoEmCurso !== null}
                        onInput={(e) => alternarAtivos(e.currentTarget.checked)}
                    />
                    <span className="trilhoInterruptorTimesAdmin" aria-hidden="true" />
                    <span className="textoInterruptorTimesAdmin">
                        <strong>
                            {painel.ativos
                                ? 'Revelação ligada'
                                : painel.liberados ? 'Revelação automática' : 'Revelação desligada'}
                        </strong>
                        <span>
                            {painel.liberados
                                ? 'Quem escaneia o QR code vê o próprio time.'
                                : 'Quem escaneia o QR code vai para o /participantes.'}
                        </span>
                        {/* Horário da V73: depois dele os times valem mesmo com
                            o interruptor desligado (ver TimeService.timesAtivos). */}
                        {painel.revelacaoProgramadaEm && (
                            <span className="textoRevelacaoProgramadaTimesAdmin">
                                {textoRevelacaoProgramadaTimes(painel)}
                            </span>
                        )}
                    </span>
                </label>

                <div className="cartaoSorteioTimesAdmin">
                    {!confirmandoSorteio ? (
                        <>
                            <span className="textoSorteioTimesAdmin">
                                {jaSorteado
                                    ? 'Sortear de novo apaga a distribuição atual.'
                                    : 'Distribui os participantes confirmados em partes iguais.'}
                                {jaSorteado && foraDoSorteio > 0 && (
                                    <> {foraDoSorteio} confirmado(s) depois do sorteio entram sozinhos no time menor ao abrir /time.</>
                                )}
                            </span>
                            <button
                                type="button"
                                className="botaoPrimarioFinancas"
                                disabled={acaoEmCurso !== null || painel.participantesElegiveis === 0}
                                onClick={() => setConfirmandoSorteio(true)}
                            >
                                {acaoEmCurso === 'sorteio' ? 'Sorteando…' : jaSorteado ? 'Sortear de novo' : 'Sortear times'}
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="textoSorteioTimesAdmin textoAlertaSorteioTimesAdmin">
                                {painel.revelados > 0
                                    ? `${painel.revelados} pessoa(s) já viram o time e podem cair em outro. Sortear mesmo assim?`
                                    : `Sortear ${painel.participantesElegiveis} participante(s) entre os ${painel.times.length} times?`}
                            </span>
                            <div className="acoesSorteioTimesAdmin">
                                <button type="button" className="botaoFantasmaFinancas" onClick={() => setConfirmandoSorteio(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="botaoPrimarioFinancas" onClick={confirmarSorteio}>
                                    Confirmar sorteio
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Os três times ───────────────────────────────── */}
            <div className="listaCartoesTimesAdmin">
                {painel.times.map((time) => {
                    const urlMascote = urlMascoteTime(time.id, time.mascoteVersao);
                    const rascunho = rascunhosNome[time.id] ?? '';
                    const nomeAlterado = rascunho.trim().toUpperCase() !== time.nome;
                    return (
                        <article key={time.id} className="cartaoTimeTimesAdmin" style={{ '--corTimeAdmin': time.cor }}>
                            <div className="faixaCorCartaoTimesAdmin" />

                            <div className="circuloMascoteTimesAdmin">
                                {urlMascote
                                    ? (
                                        <img
                                            className={mascotesAlongados[time.id] ? 'imgMascoteTimesAdmin imgMascoteContidoTimesAdmin' : 'imgMascoteTimesAdmin'}
                                            style={mascotesAlongados[time.id] ? { padding: mascotesAlongados[time.id] } : undefined}
                                            src={urlMascote}
                                            alt={`Mascote do ${time.nome}`}
                                        />
                                    )
                                    : <span className="semMascoteTimesAdmin">sem<br />mascote</span>}
                            </div>

                            <form
                                className="formularioNomeTimesAdmin"
                                onSubmit={(e) => { e.preventDefault(); salvarNome(time); }}
                            >
                                <label className="campoFormularioFinancas">
                                    <span className="rotuloCampoFinancas">Nome do time</span>
                                    <input
                                        className="entradaFormularioFinancas entradaNomeTimesAdmin"
                                        type="text"
                                        maxLength={40}
                                        value={rascunho}
                                        onInput={(e) => setRascunhosNome((prev) => ({ ...prev, [time.id]: e.currentTarget.value }))}
                                    />
                                </label>
                                <div className="acoesCartaoTimesAdmin">
                                    <label className="botaoFantasmaFinancas rotuloUploadMascoteTimesAdmin">
                                        {acaoEmCurso === `mascote-${time.id}`
                                            ? 'Enviando…'
                                            : time.mascoteVersao ? 'Trocar mascote' : 'Enviar mascote'}
                                        <input
                                            type="file"
                                            accept="image/png,image/svg+xml,.svg"
                                            disabled={acaoEmCurso !== null}
                                            onChange={(e) => {
                                                trocarMascote(time, e.currentTarget.files?.[0]);
                                                e.currentTarget.value = '';
                                            }}
                                        />
                                    </label>
                                    <button
                                        type="submit"
                                        className="botaoPrimarioFinancas"
                                        disabled={acaoEmCurso !== null || !nomeAlterado}
                                    >
                                        {acaoEmCurso === `nome-${time.id}` ? 'Salvando…' : 'Salvar nome'}
                                    </button>
                                </div>
                            </form>

                            <dl className="listaNumerosTimesAdmin">
                                <div>
                                    <dt>Integrantes</dt>
                                    <dd>{time.integrantes}</dd>
                                </div>
                                <div>
                                    <dt>Viram</dt>
                                    <dd>{time.revelados}</dd>
                                </div>
                                <div>
                                    <dt>XP médio</dt>
                                    <dd>{time.xpTime.toLocaleString('pt-BR')}</dd>
                                </div>
                            </dl>
                        </article>
                    );
                })}
            </div>

            <p className="notaRodapeTimesAdmin">
                Mascote: PNG ou SVG de até 2MB, de preferência quadrado com fundo transparente — aparece num círculo.
            </p>
        </section>
    );
}

function CabecalhoTimesAdmin() {
    return (
        <div className="cabecalhoBlocoInfoSemac cabecalhoBlocoTimesTermoInfoSemac">
            <div>
                <h2 className="tituloBlocoInfoSemac">Times</h2>
                <p className="notaBlocoInfoSemac">
                    Sorteio, nomes e mascotes — o participante descobre o time pelo QR code do cartão (semac.cc/time)
                </p>
            </div>
        </div>
    );
}

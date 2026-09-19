import { useState, useEffect, useRef } from 'preact/hooks';
import {
    listarPublicos,
    contarDestinatarios,
    previaComunicado,
    enviarTesteComunicado,
    dispararComunicado,
    listarHistorico,
} from '../data/apiComunicados.js';
import { listarEventos } from '../data/apiEventos.js';
import './comunicados.css';

/* Comunicados — mensagem avulsa disparada para um público escolhido.

   Diferente da aba "Mensagens", que edita o texto de e-mails automáticos:
   aqui o envio acontece na hora, para muita gente, e não tem desfazer.
   Por isso a tela obriga duas coisas antes do disparo: ver a contagem
   exata de destinatários e confirmar num segundo passo. */

/* Conta gratuita do Gmail entrega ~500 destinatários por dia. Acima disso
   o resto do lote falha, então a tela avisa antes em vez de deixar
   descobrir pelo log. */
const LIMITE_DIARIO_GMAIL = 500;
const ATRASO_PREVIA_MS = 400;

const VARIAVEIS = [
    { nome: 'nomeParticipante', descricao: 'Nome de quem recebe' },
    { nome: 'urlAreaParticipante', descricao: 'Link da área do participante' },
];

const STATUS_ROTULO = {
    EM_ANDAMENTO: 'Enviando…',
    CONCLUIDO: 'Concluído',
    CONCLUIDO_COM_FALHAS: 'Concluído com falhas',
};

export default function Comunicados() {
    const [publicos, setPublicos] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [assunto, setAssunto] = useState('');
    const [corpoMarkdown, setCorpoMarkdown] = useState('');
    const [publicoEscolhido, setPublicoEscolhido] = useState('');
    const [eventoEscolhido, setEventoEscolhido] = useState('');

    const [destinatarios, setDestinatarios] = useState(null);
    const [htmlPrevia, setHtmlPrevia] = useState('');
    const [erroPrevia, setErroPrevia] = useState('');

    const [confirmando, setConfirmando] = useState(false);
    const [disparando, setDisparando] = useState(false);
    const [enviandoTeste, setEnviandoTeste] = useState(false);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    const campoCorpoRef = useRef(null);

    const publicoAtual = publicos.find((p) => p.publico === publicoEscolhido) || null;
    const precisaEvento = publicoAtual?.exigeEvento === true;
    const publicoCompleto = publicoEscolhido && (!precisaEvento || eventoEscolhido);
    const prontoParaDisparar = assunto.trim() && corpoMarkdown.trim() && publicoCompleto
        && destinatarios && destinatarios.total > 0;

    useEffect(() => {
        let ativo = true;
        Promise.all([listarPublicos(), listarEventos(), listarHistorico()])
            .then(([listaPublicos, listaEventos, listaHistorico]) => {
                if (!ativo) return;
                setPublicos(listaPublicos);
                setEventos(listaEventos);
                setHistorico(listaHistorico);
            })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    /* Recontar sempre que o público muda: a contagem é o que a pessoa lê
       antes de confirmar, então não pode ficar desatualizada na tela. */
    useEffect(() => {
        if (!publicoCompleto) {
            setDestinatarios(null);
            return undefined;
        }
        let ativo = true;
        setConfirmando(false);
        contarDestinatarios(publicoEscolhido, eventoEscolhido || null)
            .then((resposta) => { if (ativo) setDestinatarios(resposta); })
            .catch((e) => { if (ativo) setErro(e.message); });
        return () => { ativo = false; };
    }, [publicoEscolhido, eventoEscolhido, publicoCompleto]);

    useEffect(() => {
        if (!corpoMarkdown.trim() || !assunto.trim()) return undefined;
        let ativo = true;
        const temporizador = setTimeout(() => {
            previaComunicado({ assunto, corpoMarkdown })
                .then((resposta) => {
                    if (!ativo) return;
                    setHtmlPrevia(resposta.html);
                    setErroPrevia('');
                })
                .catch((e) => { if (ativo) setErroPrevia(e.message); });
        }, ATRASO_PREVIA_MS);
        return () => { ativo = false; clearTimeout(temporizador); };
    }, [assunto, corpoMarkdown]);

    /* Qualquer edição depois de pedir confirmação cancela a confirmação:
       ninguém confirma um texto e dispara outro. */
    useEffect(() => { setConfirmando(false); }, [assunto, corpoMarkdown]);

    function inserirVariavel(nome) {
        const campo = campoCorpoRef.current;
        const marcador = `{{${nome}}}`;
        if (!campo) {
            setCorpoMarkdown(`${corpoMarkdown}${marcador}`);
            return;
        }
        const inicio = campo.selectionStart ?? corpoMarkdown.length;
        const fim = campo.selectionEnd ?? corpoMarkdown.length;
        setCorpoMarkdown(corpoMarkdown.slice(0, inicio) + marcador + corpoMarkdown.slice(fim));
        requestAnimationFrame(() => {
            campo.focus();
            campo.setSelectionRange(inicio + marcador.length, inicio + marcador.length);
        });
    }

    async function enviarTeste() {
        setEnviandoTeste(true);
        setErro('');
        setAviso('');
        try {
            await enviarTesteComunicado({ assunto, corpoMarkdown });
            setAviso('E-mail de teste enviado para o seu endereço. Confira também a caixa de spam.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setEnviandoTeste(false);
        }
    }

    async function disparar() {
        setDisparando(true);
        setErro('');
        setAviso('');
        try {
            const criado = await dispararComunicado({
                assunto,
                corpoMarkdown,
                publico: publicoEscolhido,
                eventoId: eventoEscolhido || null,
            });
            setHistorico([criado, ...historico]);
            setAviso(`Disparo iniciado para ${criado.totalDestinatarios} destinatário(s). `
                + 'O envio é espaçado de propósito e continua em segundo plano — '
                + 'atualize o histórico abaixo para acompanhar.');
            setAssunto('');
            setCorpoMarkdown('');
            setConfirmando(false);
        } catch (e) {
            setErro(e.message);
        } finally {
            setDisparando(false);
        }
    }

    async function atualizarHistorico() {
        try {
            setHistorico(await listarHistorico());
        } catch (e) {
            setErro(e.message);
        }
    }

    if (carregando) {
        return <p class="avisoCarregandoComunicados">Carregando…</p>;
    }

    const acimaDoLimite = destinatarios && destinatarios.total > LIMITE_DIARIO_GMAIL;

    return (
        <div class="containerSecaoComunicados">

            <div class="gradeEditorComunicados">

                <div class="colunaEditorComunicados">

                    <label class="rotuloCampoComunicados" for="campoPublicoComunicados">Para quem</label>
                    <select
                        id="campoPublicoComunicados"
                        class="campoSelecaoComunicados"
                        value={publicoEscolhido}
                        onChange={(e) => { setPublicoEscolhido(e.currentTarget.value); setEventoEscolhido(''); }}
                    >
                        <option value="">Escolha o público…</option>
                        {publicos.map((p) => (
                            <option key={p.publico} value={p.publico}>
                                {p.rotulo}{p.total !== null ? ` (${p.total})` : ''}
                            </option>
                        ))}
                    </select>

                    {precisaEvento && (
                        <>
                            <label class="rotuloCampoComunicados" for="campoEventoComunicados">Qual evento</label>
                            <select
                                id="campoEventoComunicados"
                                class="campoSelecaoComunicados"
                                value={eventoEscolhido}
                                onChange={(e) => setEventoEscolhido(e.currentTarget.value)}
                            >
                                <option value="">Escolha o evento…</option>
                                {eventos.map((evento) => (
                                    <option key={evento.id} value={evento.id}>{evento.nome}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {destinatarios && (
                        <p class={`resumoDestinatariosComunicados${acimaDoLimite ? ' resumoDestinatariosAlerta' : ''}`}>
                            <strong>{destinatarios.total}</strong> destinatário(s)
                            {destinatarios.amostra.length > 0 && `: ${destinatarios.amostra.join(', ')}`}
                            {destinatarios.total > destinatarios.amostra.length && ' e outros…'}
                            {acimaDoLimite && (
                                <span class="textoAlertaLimiteComunicados">
                                    Acima do limite diário do Gmail ({LIMITE_DIARIO_GMAIL}).
                                    As mensagens que passarem disso vão falhar.
                                </span>
                            )}
                        </p>
                    )}

                    <label class="rotuloCampoComunicados" for="campoAssuntoComunicados">Assunto</label>
                    <input
                        id="campoAssuntoComunicados"
                        class="campoAssuntoComunicados"
                        type="text"
                        maxLength={200}
                        value={assunto}
                        onInput={(e) => setAssunto(e.currentTarget.value)}
                    />

                    <label class="rotuloCampoComunicados" for="campoCorpoComunicados">Mensagem</label>
                    <textarea
                        id="campoCorpoComunicados"
                        class="campoCorpoComunicados"
                        ref={campoCorpoRef}
                        rows={14}
                        value={corpoMarkdown}
                        onInput={(e) => setCorpoMarkdown(e.currentTarget.value)}
                    />

                    <div class="blocoVariaveisComunicados">
                        <span class="rotuloVariaveisComunicados">Clique para inserir no texto:</span>
                        <div class="listaVariaveisComunicados">
                            {VARIAVEIS.map((variavel) => (
                                <button
                                    key={variavel.nome}
                                    type="button"
                                    class="botaoVariavelComunicados"
                                    title={variavel.descricao}
                                    onClick={() => inserirVariavel(variavel.nome)}
                                >
                                    {`{{${variavel.nome}}}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div class="linhaBotoesComunicados">
                        <button
                            type="button"
                            class="botaoEnviarTesteComunicados"
                            disabled={enviandoTeste || !assunto.trim() || !corpoMarkdown.trim()}
                            onClick={enviarTeste}
                        >
                            {enviandoTeste ? 'Enviando…' : 'Enviar teste pra mim'}
                        </button>

                        {!confirmando ? (
                            <button
                                type="button"
                                class="botaoDispararComunicados"
                                disabled={!prontoParaDisparar}
                                onClick={() => setConfirmando(true)}
                            >
                                Disparar comunicado
                            </button>
                        ) : (
                            <div class="blocoConfirmacaoComunicados">
                                <p class="textoConfirmacaoComunicados">
                                    Enviar para <strong>{destinatarios.total}</strong> pessoa(s)?
                                    Não há como cancelar depois.
                                </p>
                                <button
                                    type="button"
                                    class="botaoConfirmarDisparoComunicados"
                                    disabled={disparando}
                                    onClick={disparar}
                                >
                                    {disparando ? 'Disparando…' : 'Confirmar envio'}
                                </button>
                                <button
                                    type="button"
                                    class="botaoCancelarDisparoComunicados"
                                    disabled={disparando}
                                    onClick={() => setConfirmando(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>

                    {erro && <p class="avisoErroComunicados">{erro}</p>}
                    {aviso && <p class="avisoSucessoComunicados">{aviso}</p>}
                </div>

                <div class="colunaPreviaComunicados">
                    <span class="rotuloPreviaComunicados">Prévia</span>
                    <p class="textoAssuntoPreviaComunicados">
                        <strong>Assunto:</strong> {assunto || '(vazio)'}
                    </p>
                    {erroPrevia && <p class="avisoErroComunicados">{erroPrevia}</p>}
                    {/* sandbox sem allow-scripts: a prévia é só para olhar. */}
                    <iframe
                        class="iframePreviaComunicados"
                        title="Prévia do comunicado"
                        sandbox=""
                        srcDoc={htmlPrevia}
                    />
                </div>
            </div>

            <div class="blocoHistoricoComunicados">
                <div class="cabecalhoHistoricoComunicados">
                    <h3 class="tituloHistoricoComunicados">Histórico de disparos</h3>
                    <button type="button" class="botaoAtualizarHistorico" onClick={atualizarHistorico}>
                        Atualizar
                    </button>
                </div>

                {historico.length === 0 ? (
                    <p class="avisoVazioComunicados">Nenhum comunicado disparado ainda.</p>
                ) : (
                    <table class="tabelaHistoricoComunicados">
                        <thead>
                            <tr>
                                <th>Quando</th>
                                <th>Assunto</th>
                                <th>Público</th>
                                <th>Resultado</th>
                                <th>Por</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historico.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.criadoEm}</td>
                                    <td>{item.assunto}</td>
                                    <td>
                                        {item.rotuloPublico}
                                        {item.nomeEvento && ` — ${item.nomeEvento}`}
                                    </td>
                                    <td>
                                        <span class={`marcadorStatusComunicados marcadorStatus${item.status}`}>
                                            {STATUS_ROTULO[item.status] || item.status}
                                        </span>
                                        <span class="textoContagemComunicados">
                                            {item.enviados}/{item.totalDestinatarios}
                                            {item.falhas > 0 && ` · ${item.falhas} falha(s)`}
                                        </span>
                                    </td>
                                    <td>{item.enviadoPor || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

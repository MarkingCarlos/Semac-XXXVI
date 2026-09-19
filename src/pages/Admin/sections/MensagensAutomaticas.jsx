import { useState, useEffect, useRef } from 'preact/hooks';
import {
    listarMensagens,
    salvarMensagem,
    previaMensagem,
    enviarTesteMensagem,
} from '../data/apiMensagens.js';
import './mensagens.css';

/* Sub-aba "Automáticas" de /admin -> Mensagens: os textos dos e-mails
   disparados pelo próprio sistema (tabela `modelo_email`).

   A comissão edita assunto e corpo sem deploy. O corpo é Markdown, não
   HTML: o layout (cabeçalho, rodapé, cores) é fixo no backend, então não
   dá para quebrar a aparência do e-mail por aqui.

   A prévia é renderizada pelo backend, não no navegador — assim o que
   aparece no iframe é exatamente o HTML que sai no envio, e não uma
   segunda implementação de Markdown que poderia divergir. */

const LARGURA_CELULAR = 400;
const ATRASO_PREVIA_MS = 400;

export default function MensagensAutomaticas() {
    const [mensagens, setMensagens] = useState([]);
    const [chaveSelecionada, setChaveSelecionada] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [enviandoTeste, setEnviandoTeste] = useState(false);

    const [assunto, setAssunto] = useState('');
    const [corpoMarkdown, setCorpoMarkdown] = useState('');
    const [ativo, setAtivo] = useState(true);

    const [htmlPrevia, setHtmlPrevia] = useState('');
    const [erroPrevia, setErroPrevia] = useState('');
    const [visaoCelular, setVisaoCelular] = useState(false);

    const campoCorpoRef = useRef(null);

    const mensagemAtual = mensagens.find((m) => m.chave === chaveSelecionada) || null;
    const houveMudanca = mensagemAtual
        && (assunto !== mensagemAtual.assunto
            || corpoMarkdown !== mensagemAtual.corpoMarkdown
            || ativo !== mensagemAtual.ativo);

    useEffect(() => {
        let ativoEfeito = true;
        listarMensagens()
            .then((lista) => {
                if (!ativoEfeito) return;
                setMensagens(lista);
                if (lista.length > 0) selecionar(lista[0]);
            })
            .catch((e) => { if (ativoEfeito) setErro(e.message); })
            .finally(() => { if (ativoEfeito) setCarregando(false); });
        return () => { ativoEfeito = false; };
    }, []);

    /* Prévia com atraso: sem isso cada tecla digitada viraria um request. */
    useEffect(() => {
        if (!chaveSelecionada || !corpoMarkdown.trim() || !assunto.trim()) return undefined;
        let ativoEfeito = true;
        const temporizador = setTimeout(() => {
            previaMensagem(chaveSelecionada, { assunto, corpoMarkdown })
                .then((resposta) => {
                    if (!ativoEfeito) return;
                    setHtmlPrevia(resposta.html);
                    setErroPrevia('');
                })
                .catch((e) => { if (ativoEfeito) setErroPrevia(e.message); });
        }, ATRASO_PREVIA_MS);
        return () => { ativoEfeito = false; clearTimeout(temporizador); };
    }, [chaveSelecionada, assunto, corpoMarkdown]);

    function selecionar(mensagem) {
        setChaveSelecionada(mensagem.chave);
        setAssunto(mensagem.assunto);
        setCorpoMarkdown(mensagem.corpoMarkdown);
        setAtivo(mensagem.ativo);
        setErro('');
        setAviso('');
        setErroPrevia('');
    }

    /* Insere a variável na posição do cursor, não no fim do texto. */
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

    async function salvar() {
        setSalvando(true);
        setErro('');
        setAviso('');
        try {
            const atualizada = await salvarMensagem(chaveSelecionada, { assunto, corpoMarkdown, ativo });
            setMensagens(mensagens.map((m) => (m.chave === chaveSelecionada ? atualizada : m)));
            setAviso('Mensagem salva. Os próximos envios já usam este texto.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvando(false);
        }
    }

    async function enviarTeste() {
        setEnviandoTeste(true);
        setErro('');
        setAviso('');
        try {
            await enviarTesteMensagem(chaveSelecionada, { assunto, corpoMarkdown });
            setAviso('E-mail de teste enviado para o seu endereço. Confira também a caixa de spam.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setEnviandoTeste(false);
        }
    }

    function restaurar() {
        if (mensagemAtual) selecionar(mensagemAtual);
    }

    if (carregando) {
        return <p class="avisoCarregandoMensagens">Carregando mensagens…</p>;
    }
    if (erro && mensagens.length === 0) {
        return <p class="avisoErroMensagens">{erro}</p>;
    }
    if (mensagens.length === 0) {
        return (
            <p class="avisoVazioMensagens">
                Nenhuma mensagem cadastrada. Reinicie a aplicação para o catálogo ser semeado.
            </p>
        );
    }

    return (
        <div class="containerSecaoMensagens">

            <div class="listaAbasMensagens">
                {mensagens.map((mensagem) => (
                    <button
                        key={mensagem.chave}
                        type="button"
                        class={`botaoAbaMensagens${mensagem.chave === chaveSelecionada ? ' botaoAbaMensagensAtivo' : ''}`}
                        onClick={() => selecionar(mensagem)}
                    >
                        {mensagem.nomeExibicao}
                        {!mensagem.ativo && <span class="marcadorDesligadoMensagens">desligada</span>}
                    </button>
                ))}
            </div>

            {mensagemAtual && (
                <>
                    <p class="textoDescricaoMensagens">{mensagemAtual.descricao}</p>

                    <div class="gradeEditorMensagens">

                        <div class="colunaEditorMensagens">

                            <label class="rotuloCampoMensagens" for="campoAssuntoMensagens">Assunto</label>
                            <input
                                id="campoAssuntoMensagens"
                                class="campoAssuntoMensagens"
                                type="text"
                                maxLength={200}
                                value={assunto}
                                onInput={(e) => setAssunto(e.currentTarget.value)}
                            />

                            <label class="rotuloCampoMensagens" for="campoCorpoMensagens">Corpo da mensagem</label>
                            <textarea
                                id="campoCorpoMensagens"
                                class="campoCorpoMensagens"
                                ref={campoCorpoRef}
                                rows={18}
                                value={corpoMarkdown}
                                onInput={(e) => setCorpoMarkdown(e.currentTarget.value)}
                            />

                            <div class="blocoVariaveisMensagens">
                                <span class="rotuloVariaveisMensagens">Clique para inserir no texto:</span>
                                <div class="listaVariaveisMensagens">
                                    {mensagemAtual.variaveis.map((variavel) => (
                                        <button
                                            key={variavel.nome}
                                            type="button"
                                            class="botaoVariavelMensagens"
                                            title={`${variavel.descricao} — ex.: ${variavel.exemplo}`}
                                            onClick={() => inserirVariavel(variavel.nome)}
                                        >
                                            {`{{${variavel.nome}}}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <details class="blocoAjudaMensagens">
                                <summary>Como formatar</summary>
                                <ul>
                                    <li><code>**negrito**</code> e <code>*itálico*</code></li>
                                    <li><code>- item</code> no começo da linha vira lista</li>
                                    <li><code>[texto do link](endereço)</code> vira link</li>
                                    <li>Um link sozinho no parágrafo vira <strong>botão</strong></li>
                                    <li><code>&gt; texto</code> vira caixa de destaque</li>
                                    <li>Linha em branco separa parágrafos</li>
                                </ul>
                                <p>
                                    HTML não funciona aqui de propósito: o layout do e-mail é fixo,
                                    então não há como quebrá-lo sem querer.
                                </p>
                            </details>

                            <label class="rotuloAtivoMensagens">
                                <input
                                    type="checkbox"
                                    checked={ativo}
                                    onChange={(e) => setAtivo(e.currentTarget.checked)}
                                />
                                Mensagem ligada (desligada, este e-mail deixa de ser enviado)
                            </label>

                            <div class="linhaBotoesMensagens">
                                <button
                                    type="button"
                                    class="botaoSalvarMensagens"
                                    disabled={salvando || !houveMudanca}
                                    onClick={salvar}
                                >
                                    {salvando ? 'Salvando…' : 'Salvar'}
                                </button>
                                <button
                                    type="button"
                                    class="botaoDesfazerMensagens"
                                    disabled={!houveMudanca}
                                    onClick={restaurar}
                                >
                                    Desfazer
                                </button>
                                <button
                                    type="button"
                                    class="botaoEnviarTesteMensagens"
                                    disabled={enviandoTeste}
                                    onClick={enviarTeste}
                                >
                                    {enviandoTeste ? 'Enviando…' : 'Enviar teste pra mim'}
                                </button>
                            </div>

                            {erro && <p class="avisoErroMensagens">{erro}</p>}
                            {aviso && <p class="avisoSucessoMensagens">{aviso}</p>}

                            {mensagemAtual.atualizadoEm && (
                                <p class="textoAuditoriaMensagens">
                                    Editada em {mensagemAtual.atualizadoEm}
                                    {mensagemAtual.atualizadoPor ? ` por ${mensagemAtual.atualizadoPor}` : ''}.
                                </p>
                            )}
                        </div>

                        <div class="colunaPreviaMensagens">
                            <div class="cabecalhoPreviaMensagens">
                                <span class="rotuloPreviaMensagens">Prévia</span>
                                <div class="alternadorLarguraPrevia">
                                    <button
                                        type="button"
                                        class={`botaoLarguraPrevia${visaoCelular ? '' : ' botaoLarguraPreviaAtivo'}`}
                                        onClick={() => setVisaoCelular(false)}
                                    >
                                        Computador
                                    </button>
                                    <button
                                        type="button"
                                        class={`botaoLarguraPrevia${visaoCelular ? ' botaoLarguraPreviaAtivo' : ''}`}
                                        onClick={() => setVisaoCelular(true)}
                                    >
                                        Celular
                                    </button>
                                </div>
                            </div>

                            <p class="textoAssuntoPrevia">
                                <strong>Assunto:</strong> {assunto || '(vazio)'}
                            </p>

                            {erroPrevia && <p class="avisoErroMensagens">{erroPrevia}</p>}

                            {/* sandbox sem allow-scripts: a prévia é só para
                                olhar, e o iframe não deve executar nada. */}
                            <iframe
                                class="iframePreviaMensagens"
                                title="Prévia do e-mail"
                                sandbox=""
                                srcDoc={htmlPrevia}
                                style={visaoCelular ? `width:${LARGURA_CELULAR}px` : 'width:100%'}
                            />
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}

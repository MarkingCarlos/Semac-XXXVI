import { useEffect, useRef, useState } from 'preact/hooks';
import PainelLateral from './PainelLateral.jsx';
import {
    listarComprovantesPrevisao, enviarComprovantePrevisao,
    baixarComprovantePrevisao, excluirComprovantePrevisao,
    TIPOS_COMPROVANTE_ACEITOS, TAMANHO_MAXIMO_COMPROVANTE,
} from '../data/apiPrevisao.js';
import './painelComprovantesPrevisao.css';

const ACEITE_INPUT_COMPROVANTE = '.pdf,.jpg,.jpeg,.png,.webp,' + TIPOS_COMPROVANTE_ACEITOS.join(',');

function formatarTamanhoArquivo(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function formatarDataEnvio(dataIso) {
    return new Date(dataIso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

/* Conferência no navegador só para avisar antes de gastar o upload; quem
   decide de verdade é o backend, pelos magic bytes. */
function validarArquivoComprovante(arquivo) {
    if (!TIPOS_COMPROVANTE_ACEITOS.includes(arquivo.type)) {
        return 'formato não aceito (use PDF, JPG, PNG ou WEBP)';
    }
    if (arquivo.size > TAMANHO_MAXIMO_COMPROVANTE) {
        return 'passa de 5 MB';
    }
    return null;
}

/* Comprovantes de compra de um item da previsão: lista, envio de vários
   arquivos de uma vez e exclusão. `aoAlterarTotal` devolve a contagem
   nova para a tabela atualizar o selo sem recarregar a previsão. */
export default function PainelComprovantesPrevisao({ item, aoFechar, aoAlterarTotal }) {
    const [comprovantes, setComprovantes] = useState([]);
    const [carregandoComprovantes, setCarregandoComprovantes] = useState(false);
    const [errosEnvioComprovantes, setErrosEnvioComprovantes] = useState([]);
    const [erroComprovantes, setErroComprovantes] = useState('');
    const [progressoEnvioComprovantes, setProgressoEnvioComprovantes] = useState(null);
    const [arrastandoSobreZonaComprovantes, setArrastandoSobreZonaComprovantes] = useState(false);
    const [idComprovanteConfirmandoExclusao, setIdComprovanteConfirmandoExclusao] = useState(null);
    const inputArquivosComprovantes = useRef(null);

    const itemId = item?.id ?? null;
    const enviandoComprovantes = progressoEnvioComprovantes !== null;

    useEffect(() => {
        if (itemId === null) return;
        let ativo = true;
        setComprovantes([]);
        setErrosEnvioComprovantes([]);
        setErroComprovantes('');
        setIdComprovanteConfirmandoExclusao(null);
        setCarregandoComprovantes(true);
        listarComprovantesPrevisao(itemId)
            .then((lista) => { if (ativo) setComprovantes(lista ?? []); })
            .catch((e) => { if (ativo) setErroComprovantes(e.message); })
            .finally(() => { if (ativo) setCarregandoComprovantes(false); });
        return () => { ativo = false; };
    }, [itemId]);

    const atualizarListaComprovantes = (listaNova) => {
        setComprovantes(listaNova);
        aoAlterarTotal(itemId, listaNova.length);
    };

    /* Um arquivo por vez, em sequência: cada envio tem o próprio erro, e
       um arquivo recusado não derruba os outros. */
    const enviarArquivosComprovantes = async (listaArquivos) => {
        const arquivos = Array.from(listaArquivos ?? []);
        if (arquivos.length === 0 || enviandoComprovantes) return;

        setErroComprovantes('');
        const errosNovos = [];
        let listaAtual = comprovantes;

        for (let indice = 0; indice < arquivos.length; indice++) {
            const arquivo = arquivos[indice];
            setProgressoEnvioComprovantes({ atual: indice + 1, total: arquivos.length });

            const motivoRecusa = validarArquivoComprovante(arquivo);
            if (motivoRecusa) {
                errosNovos.push(`${arquivo.name}: ${motivoRecusa}.`);
                continue;
            }
            try {
                const comprovanteCriado = await enviarComprovantePrevisao(itemId, arquivo);
                if (comprovanteCriado) {
                    listaAtual = [...listaAtual, comprovanteCriado];
                    atualizarListaComprovantes(listaAtual);
                }
            } catch (e) {
                errosNovos.push(`${arquivo.name}: ${e.message}`);
            }
        }

        setErrosEnvioComprovantes(errosNovos);
        setProgressoEnvioComprovantes(null);
        if (inputArquivosComprovantes.current) inputArquivosComprovantes.current.value = '';
    };

    /* A janela é aberta ANTES do await: aberta depois, o navegador já não
       reconhece o clique e bloqueia como pop-up. */
    const abrirComprovante = async (comprovante) => {
        setErroComprovantes('');
        const janelaComprovante = window.open('', '_blank');
        try {
            const blobComprovante = await baixarComprovantePrevisao(itemId, comprovante.id);
            if (!blobComprovante) {
                janelaComprovante?.close();
                return;
            }
            const urlComprovante = URL.createObjectURL(blobComprovante);
            if (janelaComprovante) {
                janelaComprovante.location.href = urlComprovante;
            } else {
                salvarBlobComoArquivo(urlComprovante, comprovante.nomeOriginal);
            }
            setTimeout(() => URL.revokeObjectURL(urlComprovante), 60000);
        } catch (e) {
            janelaComprovante?.close();
            setErroComprovantes(e.message);
        }
    };

    const baixarComprovante = async (comprovante) => {
        setErroComprovantes('');
        try {
            const blobComprovante = await baixarComprovantePrevisao(itemId, comprovante.id);
            if (!blobComprovante) return;
            const urlComprovante = URL.createObjectURL(blobComprovante);
            salvarBlobComoArquivo(urlComprovante, comprovante.nomeOriginal);
            setTimeout(() => URL.revokeObjectURL(urlComprovante), 60000);
        } catch (e) {
            setErroComprovantes(e.message);
        }
    };

    const excluirComprovante = async (comprovanteId) => {
        if (idComprovanteConfirmandoExclusao !== comprovanteId) {
            setIdComprovanteConfirmandoExclusao(comprovanteId);
            return;
        }
        setErroComprovantes('');
        try {
            await excluirComprovantePrevisao(itemId, comprovanteId);
            atualizarListaComprovantes(comprovantes.filter((comprovante) => comprovante.id !== comprovanteId));
        } catch (e) {
            setErroComprovantes(e.message);
        } finally {
            setIdComprovanteConfirmandoExclusao(null);
        }
    };

    const aoSoltarArquivosComprovantes = (evento) => {
        evento.preventDefault();
        setArrastandoSobreZonaComprovantes(false);
        enviarArquivosComprovantes(evento.dataTransfer?.files);
    };

    return (
        <PainelLateral
            aberto={Boolean(item)}
            titulo={item ? `Comprovantes — ${item.descricao}` : 'Comprovantes'}
            aoFechar={aoFechar}
        >
            <div className="conteudoComprovantesPrevisao">
                <label
                    className={
                        arrastandoSobreZonaComprovantes
                            ? 'zonaEnvioComprovantesPrevisao zonaEnvioAtivaComprovantesPrevisao'
                            : 'zonaEnvioComprovantesPrevisao'
                    }
                    aria-disabled={enviandoComprovantes}
                    onDragOver={(evento) => {
                        evento.preventDefault();
                        setArrastandoSobreZonaComprovantes(true);
                    }}
                    onDragLeave={() => setArrastandoSobreZonaComprovantes(false)}
                    onDrop={aoSoltarArquivosComprovantes}
                >
                    <input
                        ref={inputArquivosComprovantes}
                        type="file"
                        multiple
                        accept={ACEITE_INPUT_COMPROVANTE}
                        className="inputArquivosComprovantesPrevisao"
                        disabled={enviandoComprovantes}
                        onChange={(evento) => enviarArquivosComprovantes(evento.currentTarget.files)}
                    />
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="textoZonaEnvioComprovantesPrevisao">
                        {enviandoComprovantes
                            ? `Enviando ${progressoEnvioComprovantes.atual} de ${progressoEnvioComprovantes.total}…`
                            : 'Clique ou arraste os comprovantes aqui'}
                    </span>
                    <span className="ajudaZonaEnvioComprovantesPrevisao">
                        PDF, JPG, PNG ou WEBP · até 5 MB cada · vários de uma vez
                    </span>
                </label>

                {(erroComprovantes || errosEnvioComprovantes.length > 0) && (
                    <div className="avisoErroComprovantesPrevisao" role="alert">
                        {erroComprovantes && <p className="linhaErroComprovantesPrevisao">{erroComprovantes}</p>}
                        {errosEnvioComprovantes.map((mensagemErro) => (
                            <p key={mensagemErro} className="linhaErroComprovantesPrevisao">{mensagemErro}</p>
                        ))}
                    </div>
                )}

                {carregandoComprovantes && (
                    <p className="estadoVazioComprovantesPrevisao">Carregando comprovantes…</p>
                )}
                {!carregandoComprovantes && comprovantes.length === 0 && (
                    <p className="estadoVazioComprovantesPrevisao">Nenhum comprovante anexado ainda.</p>
                )}

                {comprovantes.length > 0 && (
                    <ul className="listaComprovantesPrevisao">
                        {comprovantes.map((comprovante) => (
                            <li key={comprovante.id} className="itemComprovantePrevisao">
                                <span className="seloTipoComprovantePrevisao" aria-hidden="true">
                                    {comprovante.tipoConteudo === 'application/pdf' ? 'PDF' : 'IMG'}
                                </span>
                                <div className="infoComprovantePrevisao">
                                    <span className="nomeComprovantePrevisao" title={comprovante.nomeOriginal}>
                                        {comprovante.nomeOriginal}
                                    </span>
                                    <span className="detalheComprovantePrevisao">
                                        {formatarTamanhoArquivo(comprovante.tamanhoBytes)} · {formatarDataEnvio(comprovante.enviadoEm)}
                                    </span>
                                </div>
                                <div className="grupoAcoesLinhaFinancas">
                                    <button
                                        type="button"
                                        className="botaoAcaoLinhaFinancas"
                                        aria-label={`Abrir ${comprovante.nomeOriginal}`}
                                        title="Abrir"
                                        onClick={() => abrirComprovante(comprovante)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className="botaoAcaoLinhaFinancas"
                                        aria-label={`Baixar ${comprovante.nomeOriginal}`}
                                        title="Baixar"
                                        onClick={() => baixarComprovante(comprovante)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className={
                                            idComprovanteConfirmandoExclusao === comprovante.id
                                                ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                : 'botaoAcaoLinhaFinancas'
                                        }
                                        aria-label={
                                            idComprovanteConfirmandoExclusao === comprovante.id
                                                ? `Confirmar exclusão de ${comprovante.nomeOriginal}`
                                                : `Excluir ${comprovante.nomeOriginal}`
                                        }
                                        title={
                                            idComprovanteConfirmandoExclusao === comprovante.id
                                                ? 'Clique novamente para confirmar'
                                                : 'Excluir'
                                        }
                                        onClick={() => excluirComprovante(comprovante.id)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </PainelLateral>
    );
}

function salvarBlobComoArquivo(urlBlob, nomeArquivo) {
    const linkDownloadComprovante = document.createElement('a');
    linkDownloadComprovante.href = urlBlob;
    linkDownloadComprovante.download = nomeArquivo;
    document.body.appendChild(linkDownloadComprovante);
    linkDownloadComprovante.click();
    linkDownloadComprovante.remove();
}

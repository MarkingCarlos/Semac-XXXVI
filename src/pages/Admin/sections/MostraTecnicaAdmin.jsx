import { useState, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import QRCode from 'qrcode';
import {
    listarTrabalhosMostraAdmin,
    criarTrabalhoMostra,
    atualizarTrabalhoMostra,
    removerTrabalhoMostra,
    linkVisitaTrabalhoMostra,
} from '../data/apiMostraAdmin.js';
import './mostraTecnicaAdmin.css';

/* Mostra Técnica — os trabalhos expostos nos stands (tabela
   `trabalho_mostra`). Bloco da sub-aba Gamificação de Informações SEMAC,
   mesmo público do Termo (quem monta ou não este componente é o
   InformacoesSemac.jsx).

   Cada trabalho ganha um QR code com o link /mostra/<codigoQr>. O
   participante lê com a câmera do celular e a visita fica registrada;
   quem visita todos ganha a conquista "Explorador da Mostra".

   "Imprimir QR codes" monta uma folha A4 por trabalho num portal no
   <body>. O crachas.css também tem um @media print global, então a folha
   só aparece com a classe `imprimindoMostraAdmin` no <body>, ligada só
   durante a impressão daqui. */

const ANO_ATUAL = new Date().getFullYear();
const FORMULARIO_VAZIO = { titulo: '', apresentadores: '', stand: '' };
const CLASSE_BODY_IMPRESSAO = 'imprimindoMostraAdmin';

/* QR preto em fundo branco, com correção de erro alta: a folha fica
   colada num stand e pode amassar ou levar reflexo de luz. */
function gerarSvgQrCodeMostra(link) {
    return QRCode.toString(link, {
        type: 'svg',
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
    });
}

const rotuloVisitas = (total) => (total === 1 ? '1 visita' : `${total} visitas`);

export default function MostraTecnicaAdmin() {
    const [trabalhos, setTrabalhos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    const [formularioNovoTrabalho, setFormularioNovoTrabalho] = useState(FORMULARIO_VAZIO);
    const [salvandoNovoTrabalho, setSalvandoNovoTrabalho] = useState(false);

    /* Edição inline: um trabalho por vez. */
    const [idTrabalhoEditando, setIdTrabalhoEditando] = useState(null);
    const [formularioEdicaoTrabalho, setFormularioEdicaoTrabalho] = useState(FORMULARIO_VAZIO);
    const [salvandoEdicaoTrabalho, setSalvandoEdicaoTrabalho] = useState(false);

    /* Remover pede um segundo clique: leva junto as visitas do trabalho. */
    const [idTrabalhoConfirmandoRemocao, setIdTrabalhoConfirmandoRemocao] = useState(null);
    const [idTrabalhoRemovendo, setIdTrabalhoRemovendo] = useState(null);

    const [idTrabalhoQrAberto, setIdTrabalhoQrAberto] = useState(null);
    const [svgsQrCodePorCodigo, setSvgsQrCodePorCodigo] = useState({});

    useEffect(() => {
        let ativo = true;
        listarTrabalhosMostraAdmin(ANO_ATUAL)
            .then((lista) => { if (ativo && lista) setTrabalhos(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    /* Gera o SVG de cada QR que ainda não tem — serve tanto para a prévia
       quanto para as folhas de impressão. */
    useEffect(() => {
        const faltando = trabalhos.filter((t) => !svgsQrCodePorCodigo[t.codigoQr]);
        if (faltando.length === 0) return;
        let ativo = true;
        Promise.all(faltando.map(async (t) => [t.codigoQr, await gerarSvgQrCodeMostra(linkVisitaTrabalhoMostra(t.codigoQr))]))
            .then((pares) => {
                if (ativo) setSvgsQrCodePorCodigo((prev) => ({ ...prev, ...Object.fromEntries(pares) }));
            })
            .catch(() => { if (ativo) setErro('Não foi possível gerar os QR codes.'); });
        return () => { ativo = false; };
    }, [trabalhos]);

    const limparMensagens = () => { setErro(''); setAviso(''); };

    const cadastrarTrabalho = async () => {
        limparMensagens();
        setSalvandoNovoTrabalho(true);
        try {
            const criado = await criarTrabalhoMostra({ ano: ANO_ATUAL, ...formularioNovoTrabalho });
            setTrabalhos((prev) => [...prev, criado]);
            setFormularioNovoTrabalho(FORMULARIO_VAZIO);
            setAviso('Trabalho cadastrado.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvandoNovoTrabalho(false);
        }
    };

    const abrirEdicao = (trabalho) => {
        limparMensagens();
        setIdTrabalhoConfirmandoRemocao(null);
        setIdTrabalhoEditando(trabalho.id);
        setFormularioEdicaoTrabalho({
            titulo: trabalho.titulo,
            apresentadores: trabalho.apresentadores,
            stand: trabalho.stand ?? '',
        });
    };

    const salvarEdicao = async () => {
        limparMensagens();
        setSalvandoEdicaoTrabalho(true);
        try {
            const salvo = await atualizarTrabalhoMostra(idTrabalhoEditando, { ano: ANO_ATUAL, ...formularioEdicaoTrabalho });
            setTrabalhos((prev) => prev.map((t) => (t.id === salvo.id ? salvo : t)));
            setIdTrabalhoEditando(null);
            setAviso('Trabalho salvo.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvandoEdicaoTrabalho(false);
        }
    };

    const removerTrabalho = async (id) => {
        if (idTrabalhoConfirmandoRemocao !== id) {
            setIdTrabalhoConfirmandoRemocao(id);
            return;
        }
        limparMensagens();
        setIdTrabalhoRemovendo(id);
        try {
            await removerTrabalhoMostra(id);
            setTrabalhos((prev) => prev.filter((t) => t.id !== id));
            setIdTrabalhoConfirmandoRemocao(null);
            setAviso('Trabalho removido.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setIdTrabalhoRemovendo(null);
        }
    };

    const copiarLink = async (codigoQr) => {
        try {
            await navigator.clipboard.writeText(linkVisitaTrabalhoMostra(codigoQr));
            setAviso('Link copiado.');
        } catch {
            setErro('Não foi possível copiar o link.');
        }
    };

    /* Liga a classe só durante a impressão: o @media print do crachas.css
       continua valendo para os crachás, e o daqui só para estas folhas. */
    const imprimirQrCodes = () => {
        const desligar = () => {
            document.body.classList.remove(CLASSE_BODY_IMPRESSAO);
            window.removeEventListener('afterprint', desligar);
        };
        document.body.classList.add(CLASSE_BODY_IMPRESSAO);
        window.addEventListener('afterprint', desligar);
        window.print();
    };

    const formularioNovoValido = formularioNovoTrabalho.titulo.trim() && formularioNovoTrabalho.apresentadores.trim();
    const formularioEdicaoValido = formularioEdicaoTrabalho.titulo.trim() && formularioEdicaoTrabalho.apresentadores.trim();
    const totalVisitas = trabalhos.reduce((soma, t) => soma + t.visitas, 0);
    const qrCodesProntos = trabalhos.length > 0 && trabalhos.every((t) => svgsQrCodePorCodigo[t.codigoQr]);

    return (
        <section className="blocoInfoSemac" aria-label="Mostra Técnica">
            <div className="cabecalhoBlocoInfoSemac">
                <div>
                    <h2 className="tituloBlocoInfoSemac">Mostra Técnica</h2>
                </div>
                <button
                    type="button"
                    className="botaoFantasmaFinancas"
                    disabled={!qrCodesProntos}
                    onClick={imprimirQrCodes}
                >
                    Imprimir QR codes
                </button>
            </div>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

            <p className="textoExplicacaoMostraAdmin">
                Cada trabalho ganha um QR code para o stand. Quem ler o QR de todos ganha a conquista
                "Explorador da Mostra".
            </p>

            <div className="faixaResumoAdmin">
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Trabalhos</span>
                    <strong className="valorItemResumoAdmin valorDestaqueAdmin">{trabalhos.length}</strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Visitas registradas</span>
                    <strong className="valorItemResumoAdmin">{totalVisitas}</strong>
                </div>
            </div>

            <form
                className="formularioNovoTrabalhoMostraAdmin"
                onSubmit={(evento) => { evento.preventDefault(); cadastrarTrabalho(); }}
            >
                <label className="campoFormularioFinancas campoTituloMostraAdmin">
                    <span className="rotuloCampoFinancas">Título do trabalho</span>
                    <input
                        className="entradaFormularioFinancas"
                        maxLength={200}
                        value={formularioNovoTrabalho.titulo}
                        onInput={(e) => setFormularioNovoTrabalho((f) => ({ ...f, titulo: e.currentTarget.value }))}
                        required
                    />
                </label>
                <label className="campoFormularioFinancas">
                    <span className="rotuloCampoFinancas">Apresentadores</span>
                    <input
                        className="entradaFormularioFinancas"
                        maxLength={300}
                        placeholder="Ana Silva e João Souza"
                        value={formularioNovoTrabalho.apresentadores}
                        onInput={(e) => setFormularioNovoTrabalho((f) => ({ ...f, apresentadores: e.currentTarget.value }))}
                        required
                    />
                </label>
                <label className="campoFormularioFinancas campoStandMostraAdmin">
                    <span className="rotuloCampoFinancas">Stand (opcional)</span>
                    <input
                        className="entradaFormularioFinancas"
                        maxLength={50}
                        placeholder="12"
                        value={formularioNovoTrabalho.stand}
                        onInput={(e) => setFormularioNovoTrabalho((f) => ({ ...f, stand: e.currentTarget.value }))}
                    />
                </label>
                <div className="acoesFormularioMostraAdmin">
                    {aviso && <span className="avisoSalvoMostraAdmin">{aviso}</span>}
                    <button
                        type="submit"
                        className="botaoPrimarioFinancas"
                        disabled={salvandoNovoTrabalho || !formularioNovoValido}
                    >
                        {salvandoNovoTrabalho ? 'Salvando…' : 'Cadastrar'}
                    </button>
                </div>
            </form>

            {carregando && <p className="estadoCarregandoParticipantesAdmin">Carregando trabalhos…</p>}

            {!carregando && trabalhos.length === 0 && (
                <p className="textoVazioMostraAdmin">Nenhum trabalho cadastrado ainda.</p>
            )}

            {!carregando && trabalhos.length > 0 && (
                <ul className="listaTrabalhosMostraAdmin">
                    {trabalhos.map((trabalho) => {
                        const editandoEste = idTrabalhoEditando === trabalho.id;
                        const qrAberto = idTrabalhoQrAberto === trabalho.id;
                        const confirmandoRemocao = idTrabalhoConfirmandoRemocao === trabalho.id;

                        if (editandoEste) {
                            return (
                                <li key={trabalho.id} className="itemTrabalhoMostraAdmin">
                                    <form
                                        className="formularioEdicaoTrabalhoMostraAdmin"
                                        onSubmit={(evento) => { evento.preventDefault(); salvarEdicao(); }}
                                    >
                                        <label className="campoFormularioFinancas">
                                            <span className="rotuloCampoFinancas">Título</span>
                                            <input
                                                className="entradaFormularioFinancas"
                                                maxLength={200}
                                                value={formularioEdicaoTrabalho.titulo}
                                                onInput={(e) => setFormularioEdicaoTrabalho((f) => ({ ...f, titulo: e.currentTarget.value }))}
                                                required
                                            />
                                        </label>
                                        <label className="campoFormularioFinancas">
                                            <span className="rotuloCampoFinancas">Apresentadores</span>
                                            <input
                                                className="entradaFormularioFinancas"
                                                maxLength={300}
                                                value={formularioEdicaoTrabalho.apresentadores}
                                                onInput={(e) => setFormularioEdicaoTrabalho((f) => ({ ...f, apresentadores: e.currentTarget.value }))}
                                                required
                                            />
                                        </label>
                                        <label className="campoFormularioFinancas">
                                            <span className="rotuloCampoFinancas">Stand</span>
                                            <input
                                                className="entradaFormularioFinancas"
                                                maxLength={50}
                                                value={formularioEdicaoTrabalho.stand}
                                                onInput={(e) => setFormularioEdicaoTrabalho((f) => ({ ...f, stand: e.currentTarget.value }))}
                                            />
                                        </label>
                                        <div className="divAcoesTrabalhoMostraAdmin">
                                            <button
                                                type="button"
                                                className="botaoAcaoTrabalhoMostraAdmin"
                                                onClick={() => setIdTrabalhoEditando(null)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="botaoPrimarioFinancas"
                                                disabled={salvandoEdicaoTrabalho || !formularioEdicaoValido}
                                            >
                                                {salvandoEdicaoTrabalho ? 'Salvando…' : 'Salvar'}
                                            </button>
                                        </div>
                                    </form>
                                </li>
                            );
                        }

                        return (
                            <li key={trabalho.id} className="itemTrabalhoMostraAdmin">
                                <div className="linhaTrabalhoMostraAdmin">
                                    <div className="textoTrabalhoMostraAdmin">
                                        <strong className="tituloTrabalhoMostraAdmin">{trabalho.titulo}</strong>
                                        <span className="detalhesTrabalhoMostraAdmin">
                                            {trabalho.apresentadores}
                                            {trabalho.stand && ` · Stand ${trabalho.stand}`}
                                            {' · '}{rotuloVisitas(trabalho.visitas)}
                                        </span>
                                    </div>
                                    <div className="divAcoesTrabalhoMostraAdmin">
                                        <button
                                            type="button"
                                            className="botaoAcaoTrabalhoMostraAdmin"
                                            aria-expanded={qrAberto}
                                            onClick={() => setIdTrabalhoQrAberto(qrAberto ? null : trabalho.id)}
                                        >
                                            {qrAberto ? 'Fechar QR' : 'QR code'}
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoAcaoTrabalhoMostraAdmin"
                                            onClick={() => abrirEdicao(trabalho)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            className={confirmandoRemocao
                                                ? 'botaoAcaoTrabalhoMostraAdmin botaoConfirmarRemocaoMostraAdmin'
                                                : 'botaoAcaoTrabalhoMostraAdmin'}
                                            disabled={idTrabalhoRemovendo === trabalho.id}
                                            title={trabalho.visitas > 0
                                                ? 'Remove também as visitas já registradas para este trabalho'
                                                : 'Remover trabalho'}
                                            onClick={() => removerTrabalho(trabalho.id)}
                                            onBlur={() => { if (confirmandoRemocao) setIdTrabalhoConfirmandoRemocao(null); }}
                                        >
                                            {idTrabalhoRemovendo === trabalho.id
                                                ? 'Removendo…'
                                                : confirmandoRemocao ? 'Confirmar remoção' : 'Remover'}
                                        </button>
                                    </div>
                                </div>

                                {qrAberto && (
                                    <div className="divPreviaQrMostraAdmin">
                                        {svgsQrCodePorCodigo[trabalho.codigoQr] && (
                                            <div
                                                className="divSvgPreviaQrMostraAdmin"
                                                // SVG gerado localmente pela lib `qrcode`.
                                                dangerouslySetInnerHTML={{ __html: svgsQrCodePorCodigo[trabalho.codigoQr] }}
                                            />
                                        )}
                                        <div className="divLinkPreviaQrMostraAdmin">
                                            <code className="codeLinkQrMostraAdmin">
                                                {linkVisitaTrabalhoMostra(trabalho.codigoQr)}
                                            </code>
                                            <button
                                                type="button"
                                                className="botaoAcaoTrabalhoMostraAdmin"
                                                onClick={() => copiarLink(trabalho.codigoQr)}
                                            >
                                                Copiar link
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {createPortal(
                <div className="portalImpressaoMostraAdmin">
                    {trabalhos.map((trabalho) => (
                        <div key={trabalho.id} className="folhaA4MostraAdmin">
                            <span className="rotuloEventoFolhaMostraAdmin">MOSTRA TÉCNICA · SEMAC XXXVI</span>
                            {trabalho.stand && <span className="standFolhaMostraAdmin">STAND {trabalho.stand}</span>}
                            <h1 className="tituloFolhaMostraAdmin">{trabalho.titulo}</h1>
                            <p className="apresentadoresFolhaMostraAdmin">{trabalho.apresentadores}</p>
                            {svgsQrCodePorCodigo[trabalho.codigoQr] && (
                                <div
                                    className="divQrFolhaMostraAdmin"
                                    dangerouslySetInnerHTML={{ __html: svgsQrCodePorCodigo[trabalho.codigoQr] }}
                                />
                            )}
                            <p className="instrucaoFolhaMostraAdmin">
                                Aponte a câmera do celular para registrar sua visita.
                                Visite todos os trabalhos e ganhe a conquista "Explorador da Mostra"!
                            </p>
                            <span className="linkFolhaMostraAdmin">{linkVisitaTrabalhoMostra(trabalho.codigoQr)}</span>
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </section>
    );
}

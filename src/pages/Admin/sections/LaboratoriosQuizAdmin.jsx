import { useState, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import QRCode from 'qrcode';
import {
    listarLaboratoriosAdmin,
    criarLaboratorio,
    atualizarLaboratorio,
    definirQuizAbertoLaboratorio,
    removerLaboratorio,
    linkQuizLaboratorio,
} from '../data/apiLaboratoriosAdmin.js';
import ModalLaboratoriosQuiz from './ModalLaboratoriosQuiz.jsx';
import ModalEditorLaboratorioQuiz from './ModalEditorLaboratorioQuiz.jsx';
import './mostraTecnicaAdmin.css';
import './laboratoriosQuizAdmin.css';

/* Quiz dos Laboratórios — os laboratórios da Mostra Técnica de quinta
   (29/10) e os quizzes que eles prepararam (tabela `laboratorio`). Bloco
   da sub-aba Gamificação de Informações SEMAC, mesmo público da Mostra
   (quem monta ou não este componente é o InformacoesSemac.jsx).

   Cada laboratório ganha um QR com o link /laboratorio/<codigoQr>. O
   participante lê, responde uma vez e, se gabaritar, ganha 2 XP. O quiz
   nasce fechado: a comissão cadastra antes e libera na hora ("Abrir quiz"
   no modal da lista).

   "Imprimir QR codes" monta uma folha A4 por laboratório num portal no
   <body>, ligado só durante a impressão (classe
   `imprimindoLaboratoriosAdmin`), como na Mostra. */

const ANO_ATUAL = new Date().getFullYear();
const CLASSE_BODY_IMPRESSAO = 'imprimindoLaboratoriosAdmin';

/* QR preto em fundo branco, com correção de erro alta: a folha fica
   colada na bancada e pode amassar ou levar reflexo de luz. */
function gerarSvgQrCodeLaboratorio(link) {
    return QRCode.toString(link, {
        type: 'svg',
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
    });
}

export default function LaboratoriosQuizAdmin() {
    const [laboratorios, setLaboratorios] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    const [modalListaLaboratoriosAberto, setModalListaLaboratoriosAberto] = useState(false);
    /* null = editor fechado; { laboratorio: null } = novo; { laboratorio } = edição. */
    const [edicaoLaboratorio, setEdicaoLaboratorio] = useState(null);
    const [svgsQrCodePorCodigo, setSvgsQrCodePorCodigo] = useState({});

    useEffect(() => {
        let ativo = true;
        listarLaboratoriosAdmin(ANO_ATUAL)
            .then((lista) => { if (ativo && lista) setLaboratorios(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    /* Gera o SVG de cada QR que ainda não tem — prévia e impressão. */
    useEffect(() => {
        const faltando = laboratorios.filter((l) => !svgsQrCodePorCodigo[l.codigoQr]);
        if (faltando.length === 0) return;
        let ativo = true;
        Promise.all(faltando.map(async (l) => [l.codigoQr, await gerarSvgQrCodeLaboratorio(linkQuizLaboratorio(l.codigoQr))]))
            .then((pares) => {
                if (ativo) setSvgsQrCodePorCodigo((prev) => ({ ...prev, ...Object.fromEntries(pares) }));
            })
            .catch(() => { if (ativo) setErro('Não foi possível gerar os QR codes.'); });
        return () => { ativo = false; };
    }, [laboratorios]);

    const substituirNaLista = (salvo) =>
        setLaboratorios((prev) => prev.map((l) => (l.id === salvo.id ? salvo : l)));

    /* Chamados pelos modais, que mostram o erro: aqui só falam com a API e
       atualizam a lista — e com ela o resumo e as folhas de impressão. */
    const salvarLaboratorio = async (dados) => {
        const laboratorioEditado = edicaoLaboratorio?.laboratorio;
        const corpo = { ano: ANO_ATUAL, ...dados };
        if (laboratorioEditado) {
            substituirNaLista(await atualizarLaboratorio(laboratorioEditado.id, corpo));
            setAviso('Laboratório salvo.');
        } else {
            const criado = await criarLaboratorio(corpo);
            setLaboratorios((prev) => [...prev, criado]);
            setAviso('Laboratório cadastrado. O quiz começa fechado: abra em "Ver laboratórios".');
        }
    };

    const alternarQuiz = async (id, aberto) => {
        substituirNaLista(await definirQuizAbertoLaboratorio(id, aberto));
    };

    const removerDaLista = async (id) => {
        await removerLaboratorio(id);
        setLaboratorios((prev) => prev.filter((l) => l.id !== id));
    };

    const abrirEditor = (laboratorio) => {
        setErro('');
        setAviso('');
        setEdicaoLaboratorio({ laboratorio });
    };

    const imprimirQrCodes = () => {
        const desligar = () => {
            document.body.classList.remove(CLASSE_BODY_IMPRESSAO);
            window.removeEventListener('afterprint', desligar);
        };
        document.body.classList.add(CLASSE_BODY_IMPRESSAO);
        window.addEventListener('afterprint', desligar);
        window.print();
    };

    const totalRespostas = laboratorios.reduce((soma, l) => soma + l.respostas, 0);
    const totalGabaritos = laboratorios.reduce((soma, l) => soma + l.gabaritos, 0);
    const quizzesAbertos = laboratorios.filter((l) => l.quizAberto).length;
    const qrCodesProntos = laboratorios.length > 0 && laboratorios.every((l) => svgsQrCodePorCodigo[l.codigoQr]);

    return (
        <section className="blocoInfoSemac" aria-label="Quiz dos Laboratórios">
            <div className="cabecalhoBlocoInfoSemac">
                <div>
                    <h2 className="tituloBlocoInfoSemac">Quiz dos Laboratórios</h2>
                </div>
                <div className="divBotoesCabecalhoLaboratoriosAdmin">
                    <button
                        type="button"
                        className="botaoFantasmaFinancas"
                        disabled={!qrCodesProntos}
                        onClick={imprimirQrCodes}
                    >
                        Imprimir QR codes
                    </button>
                    <button
                        type="button"
                        className="botaoPrimarioFinancas"
                        onClick={() => abrirEditor(null)}
                    >
                        Novo laboratório
                    </button>
                </div>
            </div>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

            <p className="textoExplicacaoMostraAdmin">
                Cada laboratório ganha um QR code. O participante lê, responde uma vez e, se acertar todas,
                ganha 2 XP. O quiz começa fechado: abra quando o laboratório estiver pronto.
            </p>

            <div className="faixaResumoAdmin">
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Laboratórios</span>
                    <strong className="valorItemResumoAdmin valorDestaqueAdmin">{laboratorios.length}</strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Quizzes abertos</span>
                    <strong className="valorItemResumoAdmin">{quizzesAbertos}</strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Respostas</span>
                    <strong className="valorItemResumoAdmin">{totalRespostas}</strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Gabaritos</span>
                    <strong className="valorItemResumoAdmin">{totalGabaritos}</strong>
                </div>
            </div>

            {aviso && <p className="avisoSalvoMostraAdmin avisoBlocoLaboratoriosAdmin">{aviso}</p>}

            {carregando && <p className="estadoCarregandoParticipantesAdmin">Carregando laboratórios…</p>}

            {!carregando && laboratorios.length === 0 && (
                <p className="textoVazioMostraAdmin">Nenhum laboratório cadastrado ainda.</p>
            )}

            {!carregando && laboratorios.length > 0 && (
                <button
                    type="button"
                    className="botaoVerTrabalhosMostraAdmin"
                    onClick={() => setModalListaLaboratoriosAberto(true)}
                >
                    Ver laboratórios ({laboratorios.length})
                </button>
            )}

            {modalListaLaboratoriosAberto && (
                <ModalLaboratoriosQuiz
                    laboratorios={laboratorios}
                    svgsQrCodePorCodigo={svgsQrCodePorCodigo}
                    aoAlternarQuiz={alternarQuiz}
                    aoEditar={abrirEditor}
                    aoRemover={removerDaLista}
                    aoFechar={() => setModalListaLaboratoriosAberto(false)}
                />
            )}

            {edicaoLaboratorio && (
                <ModalEditorLaboratorioQuiz
                    laboratorio={edicaoLaboratorio.laboratorio}
                    aoSalvar={salvarLaboratorio}
                    aoFechar={() => setEdicaoLaboratorio(null)}
                />
            )}

            {createPortal(
                <div className="portalImpressaoLaboratoriosAdmin">
                    {laboratorios.map((laboratorio) => (
                        <div key={laboratorio.id} className="folhaA4MostraAdmin">
                            <span className="rotuloEventoFolhaMostraAdmin">QUIZ DOS LABORATÓRIOS · SEMAC XXXVI</span>
                            <h1 className="tituloFolhaMostraAdmin">{laboratorio.nome}</h1>
                            {laboratorio.responsaveis && (
                                <p className="apresentadoresFolhaMostraAdmin">{laboratorio.responsaveis}</p>
                            )}
                            {svgsQrCodePorCodigo[laboratorio.codigoQr] && (
                                <div
                                    className="divQrFolhaMostraAdmin"
                                    dangerouslySetInnerHTML={{ __html: svgsQrCodePorCodigo[laboratorio.codigoQr] }}
                                />
                            )}
                            <p className="instrucaoFolhaMostraAdmin">
                                Aponte a câmera do celular e responda o quiz deste laboratório.
                                Acertou todas? Ganhe 2 XP no ranking!
                            </p>
                            <span className="linkFolhaMostraAdmin">{linkQuizLaboratorio(laboratorio.codigoQr)}</span>
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </section>
    );
}

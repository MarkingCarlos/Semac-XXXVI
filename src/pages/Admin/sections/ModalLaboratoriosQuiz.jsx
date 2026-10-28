import { useState } from 'preact/hooks';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';
import { linkQuizLaboratorio } from '../data/apiLaboratoriosAdmin.js';

/* Laboratórios cadastrados do Quiz dos Laboratórios. Mesmo padrão do
   ModalTrabalhosMostra: o bloco só mostra quantos são e abre este modal
   (centralizado no desktop, de baixo para cima no mobile).

   Aqui ficam o QR, abrir/fechar o quiz e a remoção. "Editar" fecha este
   modal e só depois abre o editor (`aoEditar`), sem empilhar um sobre o
   outro. Quem fala com a API e atualiza a lista é o LaboratoriosQuizAdmin. */

const rotuloQuantidade = (total, singular, plural) => (total === 1 ? `1 ${singular}` : `${total} ${plural}`);

export default function ModalLaboratoriosQuiz({
    laboratorios,
    svgsQrCodePorCodigo,
    aoAlternarQuiz,
    aoEditar,
    aoRemover,
    aoFechar,
}) {
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    /* Remover pede um segundo clique: leva junto as perguntas e respostas. */
    const [idLaboratorioConfirmandoRemocao, setIdLaboratorioConfirmandoRemocao] = useState(null);
    const [idLaboratorioOcupado, setIdLaboratorioOcupado] = useState(null);
    const [idLaboratorioQrAberto, setIdLaboratorioQrAberto] = useState(null);

    const limparMensagens = () => { setErro(''); setAviso(''); };

    const alternarQuiz = async (laboratorio) => {
        limparMensagens();
        setIdLaboratorioOcupado(laboratorio.id);
        try {
            await aoAlternarQuiz(laboratorio.id, !laboratorio.quizAberto);
            setAviso(laboratorio.quizAberto ? 'Quiz fechado.' : 'Quiz aberto.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setIdLaboratorioOcupado(null);
        }
    };

    const removerLaboratorio = async (id) => {
        if (idLaboratorioConfirmandoRemocao !== id) {
            setIdLaboratorioConfirmandoRemocao(id);
            return;
        }
        limparMensagens();
        setIdLaboratorioOcupado(id);
        try {
            await aoRemover(id);
            setIdLaboratorioConfirmandoRemocao(null);
            setAviso('Laboratório removido.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setIdLaboratorioOcupado(null);
        }
    };

    const copiarLink = async (codigoQr) => {
        try {
            await navigator.clipboard.writeText(linkQuizLaboratorio(codigoQr));
            setAviso('Link copiado.');
        } catch {
            setErro('Não foi possível copiar o link.');
        }
    };

    return (
        <ModalInferiorAdmin
            titulo={`Laboratórios · ${laboratorios.length}`}
            aoFechar={aoFechar}
            centralizadoNoDesktop
        >
            {(fechar) => (<>
                {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}
                {aviso && <p className="avisoSalvoMostraAdmin avisoModalTrabalhosMostraAdmin">{aviso}</p>}

                {laboratorios.length === 0 ? (
                    <p className="textoVazioMostraAdmin">Nenhum laboratório cadastrado ainda.</p>
                ) : (
                    <ul className="listaTrabalhosMostraAdmin">
                        {laboratorios.map((laboratorio) => {
                            const qrAberto = idLaboratorioQrAberto === laboratorio.id;
                            const confirmandoRemocao = idLaboratorioConfirmandoRemocao === laboratorio.id;
                            const ocupado = idLaboratorioOcupado === laboratorio.id;

                            return (
                                <li key={laboratorio.id} className="itemTrabalhoMostraAdmin">
                                    <div className="linhaTrabalhoMostraAdmin">
                                        <div className="textoTrabalhoMostraAdmin">
                                            <strong className="tituloTrabalhoMostraAdmin">
                                                {laboratorio.nome}
                                                <span
                                                    className={laboratorio.quizAberto
                                                        ? 'seloStatusLaboratorioAdmin seloAbertoLaboratorioAdmin'
                                                        : 'seloStatusLaboratorioAdmin'}
                                                >
                                                    {laboratorio.quizAberto ? 'Aberto' : 'Fechado'}
                                                </span>
                                            </strong>
                                            <span className="detalhesTrabalhoMostraAdmin">
                                                {laboratorio.responsaveis && <>{laboratorio.responsaveis}{' · '}</>}
                                                {rotuloQuantidade(laboratorio.perguntas.length, 'pergunta', 'perguntas')}
                                                {' · '}{rotuloQuantidade(laboratorio.respostas, 'resposta', 'respostas')}
                                                {' · '}{rotuloQuantidade(laboratorio.gabaritos, 'gabarito', 'gabaritos')}
                                            </span>
                                        </div>
                                        <div className="divAcoesTrabalhoMostraAdmin">
                                            <button
                                                type="button"
                                                className={laboratorio.quizAberto
                                                    ? 'botaoAcaoTrabalhoMostraAdmin'
                                                    : 'botaoAcaoTrabalhoMostraAdmin botaoConfirmarRemocaoMostraAdmin'}
                                                disabled={ocupado || (!laboratorio.quizAberto && laboratorio.perguntas.length === 0)}
                                                title={!laboratorio.quizAberto && laboratorio.perguntas.length === 0
                                                    ? 'Cadastre ao menos uma pergunta antes de abrir'
                                                    : undefined}
                                                onClick={() => alternarQuiz(laboratorio)}
                                            >
                                                {laboratorio.quizAberto ? 'Fechar quiz' : 'Abrir quiz'}
                                            </button>
                                            <button
                                                type="button"
                                                className="botaoAcaoTrabalhoMostraAdmin"
                                                aria-expanded={qrAberto}
                                                onClick={() => setIdLaboratorioQrAberto(qrAberto ? null : laboratorio.id)}
                                            >
                                                {qrAberto ? 'Fechar QR' : 'QR code'}
                                            </button>
                                            {/* Abre o quiz em nova guia, mesmo fechado, sem
                                                gravar tentativa nem creditar xp. */}
                                            {laboratorio.perguntas.length > 0 && (
                                                <a
                                                    className="botaoAcaoTrabalhoMostraAdmin linkTestarLaboratorioQuizAdmin"
                                                    href={`/laboratorio/teste?laboratorio=${laboratorio.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Testar
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                className="botaoAcaoTrabalhoMostraAdmin"
                                                onClick={() => fechar(() => aoEditar(laboratorio))}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className={confirmandoRemocao
                                                    ? 'botaoAcaoTrabalhoMostraAdmin botaoConfirmarRemocaoMostraAdmin'
                                                    : 'botaoAcaoTrabalhoMostraAdmin'}
                                                disabled={ocupado}
                                                title={laboratorio.respostas > 0
                                                    ? 'Remove também as respostas já registradas (o XP dado continua)'
                                                    : 'Remover laboratório'}
                                                onClick={() => removerLaboratorio(laboratorio.id)}
                                                onBlur={() => { if (confirmandoRemocao) setIdLaboratorioConfirmandoRemocao(null); }}
                                            >
                                                {confirmandoRemocao ? 'Confirmar remoção' : 'Remover'}
                                            </button>
                                        </div>
                                    </div>

                                    {qrAberto && (
                                        <div className="divPreviaQrMostraAdmin">
                                            {svgsQrCodePorCodigo[laboratorio.codigoQr] && (
                                                <div
                                                    className="divSvgPreviaQrMostraAdmin"
                                                    // SVG gerado localmente pela lib `qrcode`.
                                                    dangerouslySetInnerHTML={{ __html: svgsQrCodePorCodigo[laboratorio.codigoQr] }}
                                                />
                                            )}
                                            <div className="divLinkPreviaQrMostraAdmin">
                                                <code className="codeLinkQrMostraAdmin">
                                                    {linkQuizLaboratorio(laboratorio.codigoQr)}
                                                </code>
                                                <button
                                                    type="button"
                                                    className="botaoAcaoTrabalhoMostraAdmin"
                                                    onClick={() => copiarLink(laboratorio.codigoQr)}
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
            </>)}
        </ModalInferiorAdmin>
    );
}

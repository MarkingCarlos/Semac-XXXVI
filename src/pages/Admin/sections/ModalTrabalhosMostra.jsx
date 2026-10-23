import { useState } from 'preact/hooks';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';
import { linkVisitaTrabalhoMostra } from '../data/apiMostraAdmin.js';

/* Trabalhos cadastrados da Mostra Técnica. Fica fora do bloco para a tela
   do admin não virar uma lista enorme — o bloco só mostra quantos são e
   abre este modal, mesmo padrão das palavras do Termo (centralizado no
   desktop, de baixo para cima no mobile — ver ModalInferiorAdmin).

   A edição, o QR aberto e a confirmação de remoção vivem aqui dentro:
   fechar o modal desmonta o componente e tudo volta ao início. Quem fala
   com a API e atualiza a lista é o MostraTecnicaAdmin, para o resumo e as
   folhas de impressão acompanharem.

   Erros e avisos também ficam aqui: os do bloco estariam atrás do fundo
   escuro e ninguém veria. */

const FORMULARIO_VAZIO = { titulo: '', apresentadores: '' };

const rotuloVisitas = (total) => (total === 1 ? '1 visita' : `${total} visitas`);

export default function ModalTrabalhosMostra({ trabalhos, svgsQrCodePorCodigo, aoSalvarEdicao, aoRemover, aoFechar }) {
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    /* Edição inline: um trabalho por vez. */
    const [idTrabalhoEditando, setIdTrabalhoEditando] = useState(null);
    const [formularioEdicaoTrabalho, setFormularioEdicaoTrabalho] = useState(FORMULARIO_VAZIO);
    const [salvandoEdicaoTrabalho, setSalvandoEdicaoTrabalho] = useState(false);

    /* Remover pede um segundo clique: leva junto as visitas do trabalho. */
    const [idTrabalhoConfirmandoRemocao, setIdTrabalhoConfirmandoRemocao] = useState(null);
    const [idTrabalhoRemovendo, setIdTrabalhoRemovendo] = useState(null);

    const [idTrabalhoQrAberto, setIdTrabalhoQrAberto] = useState(null);

    const limparMensagens = () => { setErro(''); setAviso(''); };

    const abrirEdicao = (trabalho) => {
        limparMensagens();
        setIdTrabalhoConfirmandoRemocao(null);
        setIdTrabalhoEditando(trabalho.id);
        setFormularioEdicaoTrabalho({
            titulo: trabalho.titulo,
            apresentadores: trabalho.apresentadores,
        });
    };

    const salvarEdicao = async () => {
        limparMensagens();
        setSalvandoEdicaoTrabalho(true);
        try {
            await aoSalvarEdicao(idTrabalhoEditando, formularioEdicaoTrabalho);
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
            await aoRemover(id);
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

    const formularioEdicaoValido = formularioEdicaoTrabalho.titulo.trim() && formularioEdicaoTrabalho.apresentadores.trim();

    return (
        <ModalInferiorAdmin
            titulo={`Trabalhos da Mostra · ${trabalhos.length}`}
            aoFechar={aoFechar}
            centralizadoNoDesktop
        >
            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}
            {aviso && <p className="avisoSalvoMostraAdmin avisoModalTrabalhosMostraAdmin">{aviso}</p>}

            {trabalhos.length === 0 ? (
                <p className="textoVazioMostraAdmin">Nenhum trabalho cadastrado ainda.</p>
            ) : (
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
        </ModalInferiorAdmin>
    );
}

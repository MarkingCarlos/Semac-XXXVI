import { useEffect, useState } from 'preact/hooks';
import ModalTopoDashboard from '../../components/dashboardAdmin/ModalTopoDashboard.jsx';
import { listarPerguntasDebate, excluirPerguntaDebate } from './data/apiPerguntasDebate.js';
import './modalPerguntasDebateAdmin.css';

/* Perguntas mandadas previamente para um debate (botão "Ver perguntas" da
   aba Conteúdo), mais antigas primeiro — a ordem em que a mediação costuma
   ler. Usa a casca dos modais da dashboard: no mobile o painel sobe de
   baixo.

   Cada pergunta tem a lixeira de dois toques do /admin (mesmo padrão da
   exclusão de professor nos crachás): o primeiro arma, o segundo apaga de
   vez. Quem abre este modal (diretoria e presidência) é quem a API deixa
   excluir. */

/* 'YYYY-MM-DDTHH:mm:ss' → 'DD/MM · HH:mm' (sem Date para não sofrer com fuso) */
function formatarEnvioPerguntaDebate(textoIso) {
    if (!textoIso) return '';
    const [data, hora = ''] = textoIso.split('T');
    const [, mes, dia] = data.split('-');
    return `${dia}/${mes} · ${hora.slice(0, 5)}`;
}

export default function ModalPerguntasDebateAdmin({ evento, aoFechar }) {
    const [perguntasDebateAdmin, setPerguntasDebateAdmin] = useState([]);
    const [carregandoPerguntasDebateAdmin, setCarregandoPerguntasDebateAdmin] = useState(true);
    const [erroPerguntasDebateAdmin, setErroPerguntasDebateAdmin] = useState('');
    const [idPerguntaConfirmandoExclusaoAdmin, setIdPerguntaConfirmandoExclusaoAdmin] = useState(null);
    const [idPerguntaExcluindoAdmin, setIdPerguntaExcluindoAdmin] = useState(null);
    const [erroExclusaoPerguntaAdmin, setErroExclusaoPerguntaAdmin] = useState('');

    useEffect(() => {
        let ativo = true;
        listarPerguntasDebate(evento.id)
            .then((lista) => { if (ativo) setPerguntasDebateAdmin(lista); })
            .catch((erro) => { if (ativo) setErroPerguntasDebateAdmin(erro.message); })
            .finally(() => { if (ativo) setCarregandoPerguntasDebateAdmin(false); });
        return () => { ativo = false; };
    }, [evento.id]);

    async function excluirPergunta(perguntaId) {
        if (idPerguntaExcluindoAdmin !== null) return;
        if (idPerguntaConfirmandoExclusaoAdmin !== perguntaId) {
            setIdPerguntaConfirmandoExclusaoAdmin(perguntaId);
            return;
        }
        setIdPerguntaExcluindoAdmin(perguntaId);
        setErroExclusaoPerguntaAdmin('');
        try {
            await excluirPerguntaDebate(perguntaId);
            setPerguntasDebateAdmin((anteriores) => anteriores.filter((pergunta) => pergunta.id !== perguntaId));
        } catch (erro) {
            setErroExclusaoPerguntaAdmin(erro.message);
        } finally {
            setIdPerguntaExcluindoAdmin(null);
            setIdPerguntaConfirmandoExclusaoAdmin(null);
        }
    }

    const totalPerguntasDebateAdmin = perguntasDebateAdmin.length;
    const subtituloPerguntasDebateAdmin = carregandoPerguntasDebateAdmin
        ? 'Carregando…'
        : `${totalPerguntasDebateAdmin} ${totalPerguntasDebateAdmin === 1 ? 'pergunta' : 'perguntas'}`;

    return (
        <ModalTopoDashboard
            titulo={`Perguntas · ${evento.nome}`}
            subtitulo={subtituloPerguntasDebateAdmin}
            aoFechar={aoFechar}
        >
            {carregandoPerguntasDebateAdmin && (
                <p className="estadoModalDashboard">Carregando perguntas…</p>
            )}
            {!carregandoPerguntasDebateAdmin && erroPerguntasDebateAdmin && (
                <p className="estadoModalDashboard erroModalDashboard">{erroPerguntasDebateAdmin}</p>
            )}
            {!carregandoPerguntasDebateAdmin && !erroPerguntasDebateAdmin && totalPerguntasDebateAdmin === 0 && (
                <p className="estadoModalDashboard">Nenhuma pergunta enviada para este debate ainda.</p>
            )}
            {erroExclusaoPerguntaAdmin && (
                <p className="estadoModalDashboard erroModalDashboard" role="alert">{erroExclusaoPerguntaAdmin}</p>
            )}
            {totalPerguntasDebateAdmin > 0 && (
                <ol className="listaModalDashboard">
                    {perguntasDebateAdmin.map((pergunta, indice) => (
                        <li key={pergunta.id} className="linhaModalDashboard itemPerguntaDebateAdmin">
                            <span className="posicaoLinhaModalDashboard">{indice + 1}</span>
                            <div className="blocoTextoLinhaModalDashboard">
                                <p className="textoPerguntaDebateAdmin">{pergunta.texto}</p>
                                <span className="autorPerguntaDebateAdmin">
                                    {pergunta.nomeParticipante}
                                    {/* Nome digitado na página pública, sem conta: não é verificado. */}
                                    {!pergunta.autorIdentificado && ' (sem login)'}
                                    {' · '}{formatarEnvioPerguntaDebate(pergunta.enviadaEm)}
                                </span>
                            </div>
                            <button
                                type="button"
                                className={
                                    idPerguntaConfirmandoExclusaoAdmin === pergunta.id
                                        ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas botaoExcluirPerguntaDebateAdmin'
                                        : 'botaoAcaoLinhaFinancas botaoExcluirPerguntaDebateAdmin'
                                }
                                aria-label={
                                    idPerguntaConfirmandoExclusaoAdmin === pergunta.id
                                        ? `Confirmar exclusão da pergunta ${indice + 1}`
                                        : `Excluir a pergunta ${indice + 1}`
                                }
                                title={
                                    idPerguntaConfirmandoExclusaoAdmin === pergunta.id
                                        ? 'Clique novamente para confirmar'
                                        : 'Excluir pergunta'
                                }
                                disabled={idPerguntaExcluindoAdmin === pergunta.id}
                                onClick={() => excluirPergunta(pergunta.id)}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </ModalTopoDashboard>
    );
}

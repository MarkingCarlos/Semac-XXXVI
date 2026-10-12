import { useEffect, useState } from 'preact/hooks';
import ModalTopoDashboard from '../../components/dashboardAdmin/ModalTopoDashboard.jsx';
import { listarPerguntasDebate } from './data/apiPerguntasDebate.js';
import './modalPerguntasDebateAdmin.css';

/* Perguntas que os participantes mandaram previamente para um debate
   (botão "Ver perguntas" da aba Conteúdo). Só leitura, mais antigas
   primeiro — a ordem em que a mediação costuma ler. Usa a casca dos
   modais da dashboard: no mobile o painel sobe de baixo. */

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

    useEffect(() => {
        let ativo = true;
        listarPerguntasDebate(evento.id)
            .then((lista) => { if (ativo) setPerguntasDebateAdmin(lista); })
            .catch((erro) => { if (ativo) setErroPerguntasDebateAdmin(erro.message); })
            .finally(() => { if (ativo) setCarregandoPerguntasDebateAdmin(false); });
        return () => { ativo = false; };
    }, [evento.id]);

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
            {totalPerguntasDebateAdmin > 0 && (
                <ol className="listaModalDashboard">
                    {perguntasDebateAdmin.map((pergunta, indice) => (
                        <li key={pergunta.id} className="linhaModalDashboard itemPerguntaDebateAdmin">
                            <span className="posicaoLinhaModalDashboard">{indice + 1}</span>
                            <div className="blocoTextoLinhaModalDashboard">
                                <p className="textoPerguntaDebateAdmin">{pergunta.texto}</p>
                                <span className="autorPerguntaDebateAdmin">
                                    {pergunta.nomeParticipante} · {formatarEnvioPerguntaDebate(pergunta.enviadaEm)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </ModalTopoDashboard>
    );
}

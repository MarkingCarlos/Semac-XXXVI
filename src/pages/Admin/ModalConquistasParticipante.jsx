import { useEffect, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import {
    listarConquistasDoParticipante,
    revogarConquistaDoParticipante,
} from './data/apiConquistas.js';

/* Conquistas de um participante, com a opção de revogar.

   Revogar estorna exatamente o xp que a conquista creditou (guardado no
   vínculo, não recalculado do catálogo — os pontos podem ter mudado desde
   a concessão) e recalcula o nível. Por isso o aviso é explícito e a ação
   exige dois cliques, mesmo padrão da exclusão na tabela.

   Serve a dois casos: QR lido por engano durante o evento, e destravar a
   desativação de uma conquista que já tem gente vinculada. */
export default function ModalConquistasParticipante({ participante, aoFechar, aoRevogar }) {
    const [conquistas, setConquistas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [idConfirmando, setIdConfirmando] = useState(null);
    const [idProcessando, setIdProcessando] = useState(null);

    useEffect(() => {
        let ativo = true;
        listarConquistasDoParticipante(participante.id)
            .then((lista) => { if (ativo) setConquistas(lista ?? []); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, [participante.id]);

    async function revogar(conquista) {
        if (idConfirmando !== conquista.conquistaId) {
            setIdConfirmando(conquista.conquistaId);
            return;
        }
        setErro('');
        setIdProcessando(conquista.conquistaId);
        try {
            await revogarConquistaDoParticipante(participante.id, conquista.conquistaId);
            setConquistas((lista) => lista.filter((c) => c.conquistaId !== conquista.conquistaId));
            aoRevogar?.();
        } catch (e) {
            setErro(e.message);
        } finally {
            setIdProcessando(null);
            setIdConfirmando(null);
        }
    }

    return createPortal(
        <div className="sobreposicaoModalConfirmarParticipantesAdmin" onClick={aoFechar}>
            <div className="modalConfirmarParticipantesAdmin" onClick={(e) => e.stopPropagation()}>
                <h2 className="tituloModalConquistasAdmin">CONQUISTAS DE {participante.nome.toUpperCase()}</h2>

                {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

                {carregando ? (
                    <p className="estadoCarregandoParticipantesAdmin">Carregando…</p>
                ) : conquistas.length === 0 ? (
                    <p className="estadoCarregandoParticipantesAdmin">
                        Este participante ainda não tem nenhuma conquista.
                    </p>
                ) : (
                    <ul className="listaConquistasParticipanteAdmin">
                        {conquistas.map((conquista) => (
                            <li className="itemConquistaParticipanteAdmin" key={conquista.conquistaId}>
                                <div className="textoItemConquistaParticipanteAdmin">
                                    <span className="nomeItemConquistaParticipanteAdmin">{conquista.nome}</span>
                                    <span className="detalheItemConquistaParticipanteAdmin">
                                        {conquista.xpCreditado ?? 0} xp
                                        {conquista.concedidaPorNome
                                            ? ` · concedida por ${conquista.concedidaPorNome}`
                                            : ' · concedida pelo sistema'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className={
                                        idConfirmando === conquista.conquistaId
                                            ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                            : 'botaoAcaoLinhaFinancas'
                                    }
                                    disabled={idProcessando === conquista.conquistaId}
                                    title={
                                        idConfirmando === conquista.conquistaId
                                            ? `Clique novamente para estornar ${conquista.xpCreditado ?? 0} xp`
                                            : 'Revogar e estornar o xp'
                                    }
                                    onClick={() => revogar(conquista)}
                                >
                                    {idConfirmando === conquista.conquistaId ? 'Confirmar' : 'Revogar'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="rodapeFormularioFinancas">
                    <button type="button" className="botaoFantasmaFinancas" onClick={aoFechar}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

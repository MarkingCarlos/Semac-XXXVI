import { useEffect, useState } from 'preact/hooks';
import { buscarParticipantesPorTermo, registrarPresencaManual } from './data/apiCheckin.js';
import './ModalBuscaManualPresenca.css';

export default function ModalBuscaManualPresenca({ eventoId, onFechar, onConfirmado, onErro }) {
    const [termo, setTermo] = useState('');
    const [resultados, setResultados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroBusca, setErroBusca] = useState('');
    const [participanteIdConfirmando, setParticipanteIdConfirmando] = useState(null);

    useEffect(() => {
        let cancelado = false;
        setCarregando(true);
        const timer = setTimeout(() => {
            buscarParticipantesPorTermo(termo)
                .then((lista) => {
                    if (!cancelado) setResultados(lista);
                })
                .catch((erro) => {
                    if (!cancelado) setErroBusca(erro.message);
                })
                .finally(() => {
                    if (!cancelado) setCarregando(false);
                });
        }, 250);

        return () => {
            cancelado = true;
            clearTimeout(timer);
        };
    }, [termo]);

    async function confirmarParticipante(participante) {
        setParticipanteIdConfirmando(participante.id);
        try {
            const dto = await registrarPresencaManual(eventoId, participante.id);
            onConfirmado(dto);
        } catch (erro) {
            onErro(erro.message);
        } finally {
            setParticipanteIdConfirmando(null);
        }
    }

    return (
        <div className="sobreposicaoModalBuscaManualPresenca">
            <div className="painelModalBuscaManualPresenca">
                <div className="cabecalhoModalBuscaManualPresenca">
                    <div className="tituloModalBuscaManualPresenca">BUSCA MANUAL</div>
                    <button type="button" onClick={onFechar} className="botaoFecharModalBuscaManualPresenca">
                        FECHAR
                    </button>
                </div>

                <input
                    type="text"
                    value={termo}
                    onInput={(evento) => setTermo(evento.currentTarget.value)}
                    placeholder="Nome ou e-mail"
                    className="campoBuscaModalBuscaManualPresenca"
                />

                <div className="listaResultadosModalBuscaManualPresenca">
                    {carregando && <p className="mensagemEstadoModalBuscaManualPresenca">Buscando...</p>}
                    {erroBusca && <p className="mensagemEstadoModalBuscaManualPresenca">{erroBusca}</p>}
                    {!carregando && !erroBusca && resultados.length === 0 && (
                        <p className="mensagemEstadoModalBuscaManualPresenca">Nenhum participante encontrado.</p>
                    )}
                    {!carregando &&
                        resultados.map((participante) => (
                            <button
                                key={participante.id}
                                type="button"
                                disabled={participanteIdConfirmando !== null}
                                onClick={() => confirmarParticipante(participante)}
                                className="botaoResultadoModalBuscaManualPresenca"
                            >
                                <div className="nomeResultadoModalBuscaManualPresenca">
                                    {participante.nome}
                                    {participanteIdConfirmando === participante.id && ' — confirmando...'}
                                </div>
                                <div className="emailResultadoModalBuscaManualPresenca">{participante.email}</div>
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
}

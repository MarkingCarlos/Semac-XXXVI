import { useState, useEffect } from 'preact/hooks';
import { normalizar } from '../../Financas/utils/moeda.js';
import { listarResumoAvaliacoesEventos } from '../data/apiAvaliacoesEventos.js';
import ListaItensMobileAdmin from '../../../components/ListaItensMobileAdmin/ListaItensMobileAdmin.jsx';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';

/* Avaliações — sub-aba da seção Conteúdo: resumo da pesquisa de
   satisfação (nota de 0 a 10 que o participante dá a cada evento em que
   esteve, no /participantes). Uma linha por evento avaliável — abertura,
   credenciamento, coffee break e encerramento ficam de fora — com a
   média, quantas notas e a taxa de resposta sobre quem teve presença.
   Só leitura. */

function formatarDataHoraAvaliacaoEvento(textoIso) {
    if (!textoIso) return '—';
    const [data, hora] = textoIso.split('T');
    const [, mes, dia] = data.split('-');
    return `${dia}/${mes} · ${hora.slice(0, 5)}`;
}

function formatarMediaAvaliacaoEvento(media) {
    return media === null || media === undefined ? '—' : media.toFixed(1).replace('.', ',');
}

function formatarRespostaAvaliacaoEvento(resumo) {
    if (resumo.presentes === 0) return `${resumo.avaliacoes} de 0`;
    const taxa = Math.round((resumo.avaliacoes / resumo.presentes) * 100);
    return `${resumo.avaliacoes} de ${resumo.presentes} (${taxa}%)`;
}

export default function AvaliacoesEventosAdmin() {
    const [resumoAvaliacoesEventos, setResumoAvaliacoesEventos] = useState([]);
    const [carregandoAvaliacoesEventos, setCarregandoAvaliacoesEventos] = useState(true);
    const [erroAvaliacoesEventos, setErroAvaliacoesEventos] = useState('');
    const [filtroAvaliacoesEventos, setFiltroAvaliacoesEventos] = useState('');
    const [idEventoAvaliacaoDetalhado, setIdEventoAvaliacaoDetalhado] = useState(null);

    useEffect(() => {
        let ativo = true;
        listarResumoAvaliacoesEventos()
            .then((lista) => { if (ativo) setResumoAvaliacoesEventos(lista); })
            .catch((e) => { if (ativo) setErroAvaliacoesEventos(e.message); })
            .finally(() => { if (ativo) setCarregandoAvaliacoesEventos(false); });
        return () => { ativo = false; };
    }, []);

    const termoFiltroAvaliacoesEventos = normalizar(filtroAvaliacoesEventos.trim());
    const resumoFiltradoAvaliacoesEventos = resumoAvaliacoesEventos.filter((resumo) =>
        !termoFiltroAvaliacoesEventos
            || normalizar(resumo.nome).includes(termoFiltroAvaliacoesEventos)
            || normalizar(resumo.tipo).includes(termoFiltroAvaliacoesEventos),
    );

    /* Média geral ponderada pelas notas, não média das médias. */
    const totalNotasAvaliacoesEventos = resumoAvaliacoesEventos.reduce((soma, resumo) => soma + resumo.avaliacoes, 0);
    const mediaGeralAvaliacoesEventos = totalNotasAvaliacoesEventos === 0
        ? null
        : resumoAvaliacoesEventos.reduce((soma, resumo) => soma + (resumo.media ?? 0) * resumo.avaliacoes, 0)
            / totalNotasAvaliacoesEventos;

    const eventoAvaliacaoDetalhado = resumoAvaliacoesEventos.find(
        (resumo) => resumo.eventoId === idEventoAvaliacaoDetalhado,
    ) ?? null;

    const textoVazioAvaliacoesEventos = carregandoAvaliacoesEventos
        ? 'Carregando avaliações…'
        : filtroAvaliacoesEventos.trim()
            ? 'Nenhum evento encontrado para esse filtro.'
            : 'Nenhum evento avaliável cadastrado ainda.';

    return (
        <>
            <div className="controlesCabecalhoFinancas barraFerramentasAvaliacoesEventosAdmin">
                <div className="filtroTabelaFinancas">
                    <span className="iconeFiltroFinancas">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </span>
                    <input
                        className="entradaFiltroFinancas"
                        type="search"
                        placeholder="Filtrar por evento ou tipo…"
                        value={filtroAvaliacoesEventos}
                        onInput={(e) => setFiltroAvaliacoesEventos(e.currentTarget.value)}
                        aria-label="Filtrar avaliações por evento ou tipo"
                    />
                </div>
                <span className="resumoGeralAvaliacoesEventosAdmin">
                    Média geral: <strong>{formatarMediaAvaliacaoEvento(mediaGeralAvaliacoesEventos)}</strong>
                    {' · '}
                    {totalNotasAvaliacoesEventos} {totalNotasAvaliacoesEventos === 1 ? 'nota' : 'notas'}
                </span>
            </div>

            {erroAvaliacoesEventos && <p className="avisoErroAdmin" role="alert">{erroAvaliacoesEventos}</p>}

            <div className="envelopeTabelaFinancas">
                {/* Mobile: só os nomes; o toque abre o modal de detalhes. */}
                <ListaItensMobileAdmin
                    itens={carregandoAvaliacoesEventos
                        ? []
                        : resumoFiltradoAvaliacoesEventos.map((resumo) => ({ ...resumo, id: resumo.eventoId }))}
                    textoVazio={textoVazioAvaliacoesEventos}
                    aoSelecionar={(resumo) => setIdEventoAvaliacaoDetalhado(resumo.eventoId)}
                />

                <table className="tabelaFinancas tabelaOcultaMobileAdmin">
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Tipo</th>
                            <th>Início</th>
                            <th>Média</th>
                            <th>Respostas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(carregandoAvaliacoesEventos || resumoFiltradoAvaliacoesEventos.length === 0) && (
                            <tr>
                                <td colSpan={5} className="celulaVaziaFinancas">{textoVazioAvaliacoesEventos}</td>
                            </tr>
                        )}
                        {!carregandoAvaliacoesEventos && resumoFiltradoAvaliacoesEventos.map((resumo) => (
                            <tr key={resumo.eventoId}>
                                <td><span className="nomeDoadorDoacoes">{resumo.nome}</span></td>
                                <td>{resumo.tipo}</td>
                                <td>{formatarDataHoraAvaliacaoEvento(resumo.dataHoraInicio)}</td>
                                <td><strong>{formatarMediaAvaliacaoEvento(resumo.media)}</strong></td>
                                <td>{formatarRespostaAvaliacaoEvento(resumo)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Modal de detalhes da avaliação (mobile) ───────── */}
            {eventoAvaliacaoDetalhado && (
                <ModalInferiorAdmin
                    titulo={eventoAvaliacaoDetalhado.nome}
                    subtitulo={eventoAvaliacaoDetalhado.tipo}
                    aoFechar={() => setIdEventoAvaliacaoDetalhado(null)}
                >
                    {() => (
                        <dl className="listaDetalhesItemModalInferiorAdmin">
                            <div className="linhaDetalheItemModalInferiorAdmin">
                                <dt className="rotuloDetalheItemModalInferiorAdmin">Início</dt>
                                <dd className="valorDetalheItemModalInferiorAdmin">
                                    {formatarDataHoraAvaliacaoEvento(eventoAvaliacaoDetalhado.dataHoraInicio)}
                                </dd>
                            </div>
                            <div className="linhaDetalheItemModalInferiorAdmin">
                                <dt className="rotuloDetalheItemModalInferiorAdmin">Média</dt>
                                <dd className="valorDetalheItemModalInferiorAdmin">
                                    {formatarMediaAvaliacaoEvento(eventoAvaliacaoDetalhado.media)}
                                </dd>
                            </div>
                            <div className="linhaDetalheItemModalInferiorAdmin">
                                <dt className="rotuloDetalheItemModalInferiorAdmin">Respostas</dt>
                                <dd className="valorDetalheItemModalInferiorAdmin">
                                    {formatarRespostaAvaliacaoEvento(eventoAvaliacaoDetalhado)}
                                </dd>
                            </div>
                        </dl>
                    )}
                </ModalInferiorAdmin>
            )}
        </>
    );
}

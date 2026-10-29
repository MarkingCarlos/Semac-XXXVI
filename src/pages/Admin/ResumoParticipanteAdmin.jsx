import { useEffect, useState } from 'preact/hooks';
import { useLocation, useParams } from 'wouter';
import { buscarResumoParticipante } from './data/apiParticipantes.js';
import './resumoParticipanteAdmin.css';

/* Resumo de um participante para a diretoria, aberto pelo botão "Resumo"
   da tabela de participantes (/admin -> Pessoas).

   Topo: nome, pontos (xp e nível) e o time. Abaixo, as conquistas e as
   presenças confirmadas e os Termos e Cifras acertados, cada lista com o
   total. Só leitura — revogar
   conquista continua no modal da tabela. */

const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

function textoDataHora(valor) {
    return valor ? formatadorDataHora.format(new Date(valor)) : '—';
}

/* `data` do desafio vem como "AAAA-MM-DD" (LocalDate); montar a Date
   pelas partes evita o fuso deslocar o dia. */
function textoDataDesafio(valor) {
    if (!valor) return '';
    const [ano, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${ano}`;
}

/* Termo e Cifra do Dia acertados: mesma lista das conquistas, com o dia
   (ou a palestra), o horário do acerto e as tentativas usadas. */
function SecaoDesafiosVencidosResumoParticipante({ titulo, desafios, textoVazio }) {
    return (
        <section className="secaoListaResumoParticipanteAdmin">
            <h2 className="tituloSecaoResumoParticipanteAdmin">
                {titulo}
                <span className="contadorSecaoResumoParticipanteAdmin">{desafios.length}</span>
            </h2>
            {desafios.length === 0 ? (
                <p className="estadoResumoParticipanteAdmin">{textoVazio}</p>
            ) : (
                <ul className="listaItensResumoParticipanteAdmin">
                    {desafios.map((desafio) => (
                        <li className="itemListaResumoParticipanteAdmin" key={desafio.id}>
                            <div className="textoItemResumoParticipanteAdmin">
                                <span className="nomeItemResumoParticipanteAdmin">
                                    {desafio.titulo}
                                    {desafio.data && ` · ${textoDataDesafio(desafio.data)}`}
                                </span>
                                <span className="detalheItemResumoParticipanteAdmin">
                                    Acertou {textoDataHora(desafio.acertadoEm)}
                                    {` · ${desafio.tentativasUsadas} ${desafio.tentativasUsadas === 1 ? 'tentativa' : 'tentativas'}`}
                                </span>
                            </div>
                            <span className="xpItemResumoParticipanteAdmin">+{desafio.xpCreditado ?? 0} xp</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default function ResumoParticipanteAdmin() {
    const { id } = useParams();
    const [, navegar] = useLocation();
    const [resumo, setResumo] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro('');
        buscarResumoParticipante(id)
            .then((dados) => { if (ativo) setResumo(dados); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, [id]);

    const voltarParaPessoas = () => navegar('/admin?secao=pessoas');

    return (
        <div className="paginaResumoParticipanteAdmin">
            <div className="conteudoResumoParticipanteAdmin">
                <button
                    type="button"
                    className="botaoVoltarResumoParticipanteAdmin"
                    onClick={voltarParaPessoas}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Participantes
                </button>

                {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

                {carregando ? (
                    <p className="estadoResumoParticipanteAdmin">Carregando resumo...</p>
                ) : resumo && (
                    <>
                        <header className="cabecalhoResumoParticipanteAdmin">
                            <div className="blocoNomeResumoParticipanteAdmin">
                                <h1 className="tituloNomeResumoParticipanteAdmin">{resumo.nome}</h1>
                                <span className="emailResumoParticipanteAdmin">{resumo.email}</span>
                            </div>

                            <div className="gradeDestaquesResumoParticipanteAdmin">
                                <div className="cartaoDestaqueResumoParticipanteAdmin">
                                    <span className="rotuloDestaqueResumoParticipanteAdmin">Pontos</span>
                                    <span className="valorDestaqueResumoParticipanteAdmin">{resumo.xp ?? 0} xp</span>
                                    <span className="detalheDestaqueResumoParticipanteAdmin">
                                        {resumo.nivel ? `Nível ${resumo.nivel.nome}` : 'Sem nível'}
                                    </span>
                                </div>

                                <div
                                    className="cartaoDestaqueResumoParticipanteAdmin cartaoTimeResumoParticipanteAdmin"
                                    style={resumo.time?.cor ? { '--corTimeResumoParticipanteAdmin': resumo.time.cor } : undefined}
                                >
                                    <span className="rotuloDestaqueResumoParticipanteAdmin">Time</span>
                                    <span className="valorDestaqueResumoParticipanteAdmin">
                                        {resumo.time && <span className="bolinhaCorTimeResumoParticipanteAdmin" aria-hidden="true" />}
                                        {resumo.time?.nome ?? 'Sem time'}
                                    </span>
                                    <span className="detalheDestaqueResumoParticipanteAdmin">
                                        {resumo.time ? 'Sorteado' : 'Times ainda não sorteados'}
                                    </span>
                                </div>
                            </div>
                        </header>

                        <section className="secaoListaResumoParticipanteAdmin">
                            <h2 className="tituloSecaoResumoParticipanteAdmin">
                                Conquistas
                                <span className="contadorSecaoResumoParticipanteAdmin">{resumo.conquistas.length}</span>
                            </h2>
                            {resumo.conquistas.length === 0 ? (
                                <p className="estadoResumoParticipanteAdmin">Nenhuma conquista ainda.</p>
                            ) : (
                                <ul className="listaItensResumoParticipanteAdmin">
                                    {resumo.conquistas.map((conquista) => (
                                        <li className="itemListaResumoParticipanteAdmin" key={conquista.conquistaId}>
                                            <div className="textoItemResumoParticipanteAdmin">
                                                <span className="nomeItemResumoParticipanteAdmin">{conquista.nome}</span>
                                                <span className="detalheItemResumoParticipanteAdmin">
                                                    {textoDataHora(conquista.obtidaEm)}
                                                    {conquista.concedidaPorNome
                                                        ? ` · concedida por ${conquista.concedidaPorNome}`
                                                        : ' · automática'}
                                                </span>
                                            </div>
                                            <span className="xpItemResumoParticipanteAdmin">+{conquista.xpCreditado ?? 0} xp</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="secaoListaResumoParticipanteAdmin">
                            <h2 className="tituloSecaoResumoParticipanteAdmin">
                                Presenças
                                <span className="contadorSecaoResumoParticipanteAdmin">{resumo.presencas.length}</span>
                            </h2>
                            {resumo.presencas.length === 0 ? (
                                <p className="estadoResumoParticipanteAdmin">Nenhuma presença registrada.</p>
                            ) : (
                                <ul className="listaItensResumoParticipanteAdmin">
                                    {resumo.presencas.map((presenca) => (
                                        <li className="itemListaResumoParticipanteAdmin" key={presenca.eventoId}>
                                            <div className="textoItemResumoParticipanteAdmin">
                                                <span className="nomeItemResumoParticipanteAdmin">{presenca.eventoNome}</span>
                                                <span className="detalheItemResumoParticipanteAdmin">
                                                    {presenca.tipoEventoNome} · check-in {textoDataHora(presenca.presencaEm)}
                                                    {presenca.registradoPorNome && ` · por ${presenca.registradoPorNome}`}
                                                </span>
                                            </div>
                                            <span className="xpItemResumoParticipanteAdmin">+{presenca.xpCreditado ?? 0} xp</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <SecaoDesafiosVencidosResumoParticipante
                            titulo="Termo"
                            desafios={resumo.termosVencidos}
                            textoVazio="Nenhum Termo acertado."
                        />
                        <SecaoDesafiosVencidosResumoParticipante
                            titulo="Cifra do Dia"
                            desafios={resumo.cifrasVencidas}
                            textoVazio="Nenhuma Cifra completada."
                        />
                    </>
                )}
            </div>
        </div>
    );
}

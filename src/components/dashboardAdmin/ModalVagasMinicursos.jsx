import { useEffect, useState } from 'preact/hooks';
import ModalTopoDashboard from './ModalTopoDashboard.jsx';
import { buscarInscritosMinicursoDashboard } from './data/apiDashboard.js';
import { formatarDiaHora, porcentagem } from './formatoDashboard.js';

/* Detalhe do card de vagas: a lista de minicursos com a ocupação de cada
   um e, ao escolher um, quem está inscrito nele.

   Props:
     dados    — resposta de GET /api/dashboard/minicursos
     aoFechar — () => void */
export default function ModalVagasMinicursos({ dados, aoFechar }) {
    const [minicursoSelecionado, setMinicursoSelecionado] = useState(null);

    /* Uma casca só para as duas telas: trocar de tela muda título e
       conteúdo sem refazer a animação de descida. */
    return (
        <ModalTopoDashboard
            titulo={minicursoSelecionado ? minicursoSelecionado.nome : 'Vagas em minicursos'}
            subtitulo={minicursoSelecionado
                ? `${minicursoSelecionado.inscritos} de ${minicursoSelecionado.capacidade} vagas preenchidas`
                : `${dados.vagasRestantesTotal} vagas restantes`}
            aoVoltar={minicursoSelecionado ? () => setMinicursoSelecionado(null) : null}
            aoFechar={aoFechar}
        >
            {minicursoSelecionado
                ? <InscritosMinicurso key={minicursoSelecionado.id} minicurso={minicursoSelecionado} />
                : <ListaMinicursos dados={dados} aoEscolher={setMinicursoSelecionado} />}
        </ModalTopoDashboard>
    );
}

/* Totais e um minicurso por linha, com a barra de ocupação. */
function ListaMinicursos({ dados, aoEscolher }) {
    return (
        <>
            <div className="resumoTotaisModalDashboard">
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{dados.capacidadeTotal}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Vagas</span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{dados.inscritosTotal}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Preenchidas</span>
                </div>
                <div className="itemResumoTotaisModalDashboard">
                    <span className="valorResumoTotaisModalDashboard">{dados.vagasRestantesTotal}</span>
                    <span className="rotuloResumoTotaisModalDashboard">Restantes</span>
                </div>
            </div>

            {dados.minicursos.length === 0 ? (
                <p className="estadoModalDashboard">Nenhum minicurso cadastrado.</p>
            ) : (
                <ul className="listaModalDashboard">
                    {dados.minicursos.map((minicurso) => {
                        const lotado = minicurso.vagasRestantes === 0;
                        const ocupacao = porcentagem(minicurso.inscritos, minicurso.capacidade);
                        return (
                            <li key={minicurso.id}>
                                <button
                                    type="button"
                                    className="linhaClicavelModalDashboard"
                                    onClick={() => aoEscolher(minicurso)}
                                >
                                    <span className="blocoTextoLinhaModalDashboard">
                                        <span className="nomeLinhaModalDashboard">{minicurso.nome}</span>
                                        <span className="detalheLinhaModalDashboard">
                                            {formatarDiaHora(minicurso.dataHoraInicio)}
                                            {minicurso.local ? ` · ${minicurso.local}` : ''}
                                        </span>
                                        <span
                                            className="barraModalDashboard"
                                            role="progressbar"
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            aria-valuenow={ocupacao}
                                            aria-label={`Ocupação de ${minicurso.nome}`}
                                        >
                                            <span
                                                className={`preenchimentoBarraModalDashboard ${lotado ? 'preenchimentoCheioBarraModalDashboard' : ''}`}
                                                style={{ width: `${ocupacao}%` }}
                                            />
                                        </span>
                                    </span>
                                    {lotado ? (
                                        <span className="etiquetaModalDashboard etiquetaVermelhaModalDashboard">Lotado</span>
                                    ) : (
                                        <span className="valorLinhaModalDashboard">
                                            {minicurso.inscritos}/{minicurso.capacidade}
                                            <span className="rotuloValorLinhaModalDashboard">
                                                {minicurso.vagasRestantes} {minicurso.vagasRestantes === 1 ? 'vaga' : 'vagas'}
                                            </span>
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}

/* Participantes com vaga no minicurso, carregados sob demanda. */
function InscritosMinicurso({ minicurso }) {
    const [inscritos, setInscritos] = useState(null);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let ativo = true;
        buscarInscritosMinicursoDashboard(minicurso.id)
            .then((lista) => { if (ativo) setInscritos(lista); })
            .catch((e) => { if (ativo) setErro(e.message); });
        return () => { ativo = false; };
    }, [minicurso.id]);

    if (erro) return <p className="estadoModalDashboard erroModalDashboard">{erro}</p>;
    if (!inscritos) return <p className="estadoModalDashboard">Carregando inscritos...</p>;
    if (inscritos.length === 0) return <p className="estadoModalDashboard">Ninguém inscrito ainda.</p>;

    return (
        <ul className="listaModalDashboard">
            {inscritos.map((inscrito) => (
                <li key={inscrito.id} className="linhaModalDashboard">
                    <span className="blocoTextoLinhaModalDashboard">
                        <span className="nomeLinhaModalDashboard">{inscrito.nome}</span>
                        <span className="detalheLinhaModalDashboard">{inscrito.email}</span>
                    </span>
                    {inscrito.presente && (
                        <span className="etiquetaModalDashboard etiquetaAmarelaModalDashboard">Presente</span>
                    )}
                </li>
            ))}
        </ul>
    );
}

import { useState } from 'preact/hooks';
import StatsGrid from '../StatsGrid.jsx';
import TabelaParticipantes from '../TabelaParticipantes.jsx';
import TabelaComissao from '../TabelaComissao.jsx';
import Crachas from './Crachas.jsx';

/* Invólucro da aba "Pessoas" do /admin. Reúne participantes e comissão
   numa entrada só da navbar, que já estava cheia.

   As duas telas são dois lados do mesmo dado: confirmar alguém pode
   tirá-lo da lista de participantes e pô-lo na de comissão. Por isso as
   listas e os handlers continuam no Admin.jsx e chegam aqui por props —
   `aoAtualizarPessoa` precisa mexer nas duas ao mesmo tempo, e duplicar
   esse estado aqui dentro só criaria chance de as listas divergirem.

   Padrão é "Participantes": é a lista consultada no dia a dia do evento.

   "Crachás" gera os crachás impressos e busca os próprios dados
   (GET /api/cracha) — inclui palestrantes, que não estão nas outras
   listas. */

const SUBABAS = [
    { id: 'participantes', rotulo: 'Participantes' },
    { id: 'comissao', rotulo: 'Comissão' },
    { id: 'crachas', rotulo: 'Crachás' },
];

export default function Pessoas({
    participantes,
    carregandoParticipantes,
    erroParticipantes,
    comissao,
    carregandoComissao,
    erroComissao,
    aoAtualizarPessoa,
    aoExcluirPessoa,
}) {
    const [subabaAtiva, setSubabaAtiva] = useState('participantes');

    return (
        <div class="containerSecaoComSubabasAdmin">

            <div class="listaSubabasAdmin" role="tablist">
                {SUBABAS.map((subaba) => (
                    <button
                        key={subaba.id}
                        type="button"
                        role="tab"
                        aria-selected={subabaAtiva === subaba.id}
                        class={`botaoSubabaAdmin${subabaAtiva === subaba.id ? ' botaoSubabaAdminAtivo' : ''}`}
                        onClick={() => setSubabaAtiva(subaba.id)}
                    >
                        {subaba.rotulo}
                    </button>
                ))}
            </div>

            {subabaAtiva === 'participantes' && (
                <div className="conteudoParticipantesAdmin">
                    <header className="cabecalhoSecaoFinancas">
                        <div>
                            <h1 className="tituloSecaoFinancas">Participantes</h1>
                            <p className="subtituloSecaoFinancas">
                                Inscritos confirmados e presença por evento
                            </p>
                        </div>
                    </header>
                    {erroParticipantes && (
                        <p className="avisoErroAdmin">{erroParticipantes}</p>
                    )}
                    {carregandoParticipantes ? (
                        <p className="estadoCarregandoParticipantesAdmin">Carregando participantes...</p>
                    ) : (
                        <>
                            <StatsGrid participantes={participantes} />
                            <TabelaParticipantes
                                participantes={participantes}
                                aoConfirmar={aoAtualizarPessoa}
                                aoExcluir={aoExcluirPessoa}
                            />
                        </>
                    )}
                </div>
            )}

            {subabaAtiva === 'comissao' && (
                <div className="conteudoParticipantesAdmin">
                    <header className="cabecalhoSecaoFinancas">
                        <div>
                            <h1 className="tituloSecaoFinancas">Comissão</h1>
                            <p className="subtituloSecaoFinancas">
                                Membros e diretorias da organização
                            </p>
                        </div>
                    </header>
                    {erroComissao && (
                        <p className="avisoErroAdmin">{erroComissao}</p>
                    )}
                    {carregandoComissao ? (
                        <p className="estadoCarregandoParticipantesAdmin">Carregando comissão...</p>
                    ) : (
                        <TabelaComissao comissao={comissao} aoAtualizar={aoAtualizarPessoa} aoExcluir={aoExcluirPessoa} />
                    )}
                </div>
            )}

            {subabaAtiva === 'crachas' && <Crachas />}
        </div>
    );
}

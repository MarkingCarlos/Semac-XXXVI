import { useState } from 'preact/hooks';
import StatsGrid from '../StatsGrid.jsx';
import TabelaParticipantes from '../TabelaParticipantes.jsx';
import TabelaComissao from '../TabelaComissao.jsx';
import Crachas from './Crachas.jsx';
import Certificados from './Certificados.jsx';
import EntregaKits from './EntregaKits.jsx';
import SeletorModalSubabas from '../../../components/SeletorModalSubabas/SeletorModalSubabas.jsx';
import { temAcessoGestaoParticipantes } from '../../../auth/sessao.js';

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
   listas. "Certificados" gera os PDFs dos palestrantes (GET
   /api/certificado), um por palestrante em cada evento.

   "Kits" marca a entrega do kit no credenciamento e busca os próprios
   dados (GET /api/pessoa/kits). É a única sub-aba aberta a toda a
   comissão (MEMBRO incluído): quem não tem gestão de participantes vê só ela. */

const SUBABAS = [
    { id: 'participantes', rotulo: 'Participantes' },
    { id: 'comissao', rotulo: 'Comissão' },
    { id: 'kits', rotulo: 'Kits' },
    { id: 'crachas', rotulo: 'Crachás' },
    { id: 'certificados', rotulo: 'Certificados' },
];

const SUBABAS_SO_KITS = SUBABAS.filter(subaba => subaba.id === 'kits');

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
    const podeGerenciarPessoas = temAcessoGestaoParticipantes();
    const subabasVisiveis = podeGerenciarPessoas ? SUBABAS : SUBABAS_SO_KITS;
    const [subabaAtiva, setSubabaAtiva] = useState(podeGerenciarPessoas ? 'participantes' : 'kits');

    return (
        <div class="containerSecaoComSubabasAdmin">

            {/* Pílulas no desktop; no mobile, uma pílula só que abre um modal de baixo para cima.
                Com uma sub-aba só (diretoria sem gestão) não há o que trocar. */}
            {subabasVisiveis.length > 1 && (
                <SeletorModalSubabas
                    subabas={subabasVisiveis}
                    subabaAtiva={subabaAtiva}
                    aoTrocar={setSubabaAtiva}
                    tituloModal="Pessoas"
                    rotuloAcessivel="Sub-abas de Pessoas"
                />
            )}

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

            {subabaAtiva === 'kits' && <EntregaKits />}
            {subabaAtiva === 'crachas' && <Crachas />}
            {subabaAtiva === 'certificados' && <Certificados />}
        </div>
    );
}

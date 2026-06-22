// Página de administração — acessível em /admin.
// Autenticação não implementada ainda (a ser adicionada futuramente).
//
// Mesmo shell do módulo financeiro (sidebar + abas + painel lateral).
// Reaproveita PainelLateral, CampoMoeda e os estilos de tabela/formulário
// do Financeiro (financas.css) para manter a identidade visual.
//
// Abas:
//   Doações        → tabela `doador` (nome, valor, data)
//   Conteúdo       → eventos (`evento` + `palestrante`)
//   Participantes  → StatsGrid + tabela (visão existente, preservada)
//
// Patrocinadores são gerenciados no módulo financeiro (/financeiro).
// Estado local apenas (mock); a integração com a API virá depois.

import { useState, useEffect } from 'preact/hooks';
import { Link } from 'wouter';
import { lerSessao } from '../../auth/sessao.js';
import '../Financas/financas.css';
import './admin.css';

import Doacoes from './sections/Doacoes.jsx';
import Conteudo from './sections/Conteudo.jsx';
import InformacoesSemac from './sections/InformacoesSemac.jsx';
import StatsGrid from './StatsGrid.jsx';
import TabelaParticipantes from './TabelaParticipantes.jsx';
import TabelaComissao from './TabelaComissao.jsx';

import { listarParticipantes, listarComissao } from './data/apiParticipantes.js';
import { listarEventos } from './data/apiEventos.js';

/* Ícones da navegação — SVGs inline, stroke herda currentColor */
const ICONES_NAVEGACAO = {
    doacoes: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
    ),
    conteudo: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    ),
    participantes: (
        <svg  color="white" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    comissao: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    informacoes: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
        </svg>
    ),
};

/* `papeis` opcional: quando presente, a seção só aparece para os roles listados. */
const SECOES = [
    { id: 'doacoes', rotulo: 'Doações' },
    { id: 'conteudo', rotulo: 'Conteúdo' },
    { id: 'participantes', rotulo: 'Participantes' },
    { id: 'comissao', rotulo: 'Comissão' },
    { id: 'informacoes', rotulo: 'Informações SEMAC', papeis: ['DIRETOR_SITE', 'PRESIDENTE'] },
];

export default function Admin() {
    const roleAtual = lerSessao()?.role;
    const secoesVisiveis = SECOES.filter(s => !s.papeis || s.papeis.includes(roleAtual));

    const [secaoAtiva, setSecaoAtiva] = useState('doacoes');

    const [eventos, setEventos] = useState([]);
    const [carregandoEventos, setCarregandoEventos] = useState(true);
    const [erroEventos, setErroEventos] = useState('');

    const [participantes, setParticipantes] = useState([]);
    const [carregandoParticipantes, setCarregandoParticipantes] = useState(true);
    const [erroParticipantes, setErroParticipantes] = useState(null);

    const [comissao, setComissao] = useState([]);
    const [carregandoComissao, setCarregandoComissao] = useState(true);
    const [erroComissao, setErroComissao] = useState(null);

    useEffect(() => {
        let ativo = true;
        listarParticipantes()
            .then((dados) => { if (ativo) setParticipantes(dados); })
            .catch(() => { if (ativo) setErroParticipantes('Não foi possível carregar os participantes.'); })
            .finally(() => { if (ativo) setCarregandoParticipantes(false); });
        return () => { ativo = false; };
    }, []);

    useEffect(() => {
        let ativo = true;
        listarComissao()
            .then((dados) => { if (ativo) setComissao(dados); })
            .catch(() => { if (ativo) setErroComissao('Não foi possível carregar a comissão.'); })
            .finally(() => { if (ativo) setCarregandoComissao(false); });
        return () => { ativo = false; };
    }, []);

    useEffect(() => {
        let ativo = true;
        listarEventos()
            .then((dados) => { if (ativo) setEventos(dados); })
            .catch(() => { if (ativo) setErroEventos('Não foi possível carregar os eventos.'); })
            .finally(() => { if (ativo) setCarregandoEventos(false); });
        return () => { ativo = false; };
    }, []);

    // Após confirmar: qualquer papel de comissão (≠ PARTICIPANTE) sai da
    // tabela de participantes e entra na lista da comissão na hora;
    // PARTICIPANTE permanece com o registro atualizado (papel + ingresso).
    function aoConfirmarParticipante(atualizado) {
        if (atualizado.role !== 'PARTICIPANTE') {
            setParticipantes((prev) => prev.filter((p) => p.id !== atualizado.id));
            setComissao((prev) => {
                const semEle = prev.filter((m) => m.id !== atualizado.id);
                return [...semEle, atualizado].sort((a, b) => a.nome.localeCompare(b.nome));
            });
        } else {
            setParticipantes((prev) =>
                prev.map((p) => (p.id === atualizado.id ? atualizado : p))
            );
        }
    }

    // Atualiza um membro da comissão após alterar função ou ativar/desativar.
    function aoAtualizarComissao(atualizado) {
        setComissao((prev) =>
            prev.map((m) => (m.id === atualizado.id ? atualizado : m))
        );
    }

    return (
        <div className="paginaAdmin">
            {/* ── Sidebar ─────────────────────────────────── */}
            <aside className="sidebarAdmin">
                <div className="cabecalhoSidebarAdmin">
                    <span className="marcaSidebarAdmin">SEMAC</span>
                    <span className="moduloSidebarAdmin">Administração</span>
                </div>

                <nav className="navegacaoSidebarAdmin" aria-label="Seções do módulo de administração">
                    {secoesVisiveis.map((secao) => (
                        <button
                            key={secao.id}
                            type="button"
                            className={
                                secaoAtiva === secao.id
                                    ? 'itemNavegacaoAdmin itemNavegacaoAtivoAdmin'
                                    : 'itemNavegacaoAdmin'
                            }
                            aria-current={secaoAtiva === secao.id ? 'page' : undefined}
                            onClick={() => setSecaoAtiva(secao.id)}
                        >
                            {ICONES_NAVEGACAO[secao.id]}
                            <span>{secao.rotulo}</span>
                        </button>
                    ))}
                </nav>

                <Link href="/" className="linkVoltarSiteAdmin">
                    ← Voltar ao site
                </Link>
            </aside>

            {/* ── Conteúdo ────────────────────────────────── */}
            <main className="conteudoAdmin">
                <section key={secaoAtiva} className="secaoAdmin">
                    {secaoAtiva === 'doacoes' && <Doacoes />}
                    {secaoAtiva === 'conteudo' && (
                        <Conteudo
                            eventos={eventos}
                            setEventos={setEventos}
                            carregando={carregandoEventos}
                            erro={erroEventos}
                        />
                    )}
                    {secaoAtiva === 'participantes' && (
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
                                        aoConfirmar={aoConfirmarParticipante}
                                    />
                                </>
                            )}
                        </div>
                    )}
                    {secaoAtiva === 'comissao' && (
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
                                <TabelaComissao comissao={comissao} aoAtualizar={aoAtualizarComissao} />
                            )}
                        </div>
                    )}
                    {secaoAtiva === 'informacoes' && <InformacoesSemac />}
                </section>
            </main>
        </div>
    );
}

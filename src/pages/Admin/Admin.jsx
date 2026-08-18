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

import { useState, useEffect, useRef } from 'preact/hooks';
import { Link, useLocation } from 'wouter';
import { lerSessao, limparSessao, temAcessoFinanceiro } from '../../auth/sessao.js';
import '../Financas/financas.css';
import './admin.css';

import AdminHeader from './AdminHeader.jsx';
import Inicio from './sections/Inicio.jsx';
import Doacoes from './sections/Doacoes.jsx';
import Conteudo from './sections/Conteudo.jsx';
import InformacoesSemac from './sections/InformacoesSemac.jsx';
import StatsGrid from './StatsGrid.jsx';
import TabelaParticipantes from './TabelaParticipantes.jsx';
import TabelaComissao from './TabelaComissao.jsx';

import { listarParticipantes, listarComissao } from './data/apiParticipantes.js';
import { listarEventos } from './data/apiEventos.js';

/* `papeis` opcional: quando presente, a seção só aparece para os roles listados. */
const SECOES = [
    { id: 'inicio', rotulo: 'Início' },
    { id: 'doacoes', rotulo: 'Doações',papeis: ['DIRETOR_SITE', 'PRESIDENTE'] },
    { id: 'conteudo', rotulo: 'Conteúdo', papeis: ['DIRETOR_SITE', 'PRESIDENTE', 'DIRETOR_CONTEUDO']  },
    { id: 'participantes', rotulo: 'Participantes', papeis: ['DIRETOR_SITE', 'PRESIDENTE']  },
    { id: 'comissao', rotulo: 'Comissão',papeis: ['DIRETOR_SITE', 'PRESIDENTE']  },
    { id: 'informacoes', rotulo: 'Informações SEMAC', papeis: ['DIRETOR_SITE', 'PRESIDENTE'] },
];

export default function Admin() {
    const [, navegar] = useLocation();
    const roleAtual = lerSessao()?.role;
    const secoesVisiveis = SECOES.filter(s => !s.papeis || s.papeis.includes(roleAtual));
    const podeAcessarFinanceiro = temAcessoFinanceiro();

    // Encerra a sessão e volta para o site público.
    function sair() {
        limparSessao();
        navegar('/');
    }

    const [secaoAtiva, setSecaoAtiva] = useState('inicio');

    // Indicador deslizante da navbar flutuante: mede a posição/largura do
    // botão ativo e anima o retângulo amarelo até ele (trilho sem padding
    // própria, para o cálculo de left/width não precisar descontar o
    // padding do <nav>).
    const trilhoNavRef = useRef(null);
    const botoesNavRef = useRef({});
    const [indicadorNav, setIndicadorNav] = useState({ left: 0, width: 0 });

    useEffect(() => {
        function medirIndicador() {
            const trilho = trilhoNavRef.current;
            const botaoAtivo = botoesNavRef.current[secaoAtiva];
            if (!trilho || !botaoAtivo) return;
            const trilhoRect = trilho.getBoundingClientRect();
            const botaoRect = botaoAtivo.getBoundingClientRect();
            setIndicadorNav({ left: botaoRect.left - trilhoRect.left, width: botaoRect.width });
        }
        medirIndicador();
        window.addEventListener('resize', medirIndicador);
        return () => window.removeEventListener('resize', medirIndicador);
    }, [secaoAtiva, secoesVisiveis.length]);

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
            <AdminHeader />

            {/* ── Conteúdo ────────────────────────────────── */}
            <main className="conteudoAdmin">
                <section key={secaoAtiva} className="secaoAdmin">
                    {secaoAtiva === 'inicio' && <Inicio podeAcessarFinanceiro={podeAcessarFinanceiro} />}
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

            {/* ── Navbar flutuante ─────────────────────────── */}
            <nav className="navFlutuanteAdmin" aria-label="Seções do módulo de administração">
                <div className="trilhoNavFlutuanteAdmin" ref={trilhoNavRef}>
                    <div
                        className="indicadorNavFlutuanteAdmin"
                        style={{ left: `${indicadorNav.left}px`, width: `${indicadorNav.width}px` }}
                        aria-hidden="true"
                    />
                    {secoesVisiveis.map((secao) => (
                        <button
                            key={secao.id}
                            type="button"
                            ref={(el) => { botoesNavRef.current[secao.id] = el; }}
                            className={
                                secaoAtiva === secao.id
                                    ? 'itemNavFlutuanteAdmin itemNavFlutuanteAtivoAdmin'
                                    : 'itemNavFlutuanteAdmin'
                            }
                            aria-current={secaoAtiva === secao.id ? 'page' : undefined}
                            onClick={() => setSecaoAtiva(secao.id)}
                        >
                            {secao.rotulo}
                        </button>
                    ))}
                    <button type="button" className="itemNavFlutuanteAdmin itemNavFlutuanteSairAdmin" onClick={sair}>
                        Sair
                    </button>
                </div>
            </nav>
        </div>
    );
}

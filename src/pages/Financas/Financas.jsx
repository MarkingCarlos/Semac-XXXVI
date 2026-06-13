import { useState } from 'preact/hooks';
import { Link } from 'wouter';
import Resumo from './sections/Resumo.jsx';
import Patrocinios from './sections/Patrocinios.jsx';
import Compras from './sections/Compras.jsx';
import Fornecedores from './sections/Fornecedores.jsx';
import Inscricoes from './sections/Inscricoes.jsx';
import {
    MOCK_PATROCINADORES,
    MOCK_COMPRAS,
    MOCK_FORNECEDORES,
    MOCK_INSCRICOES,
} from './data/mockFinancas.js';
import './financas.css';

/* Ícones da navegação — SVGs inline, stroke herda currentColor */
const ICONES_NAVEGACAO = {
    resumo: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 13l3-3 4 4 5-6" />
        </svg>
    ),
    patrocinios: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5" />
        </svg>
    ),
    compras: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
    ),
    fornecedores: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 3h15v13H1z" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    ),
    inscricoes: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2M13 17v2M13 11v2" />
        </svg>
    ),
};

const SECOES = [
    { id: 'resumo', rotulo: 'Resumo' },
    { id: 'patrocinios', rotulo: 'Patrocínios' },
    { id: 'compras', rotulo: 'Compras' },
    { id: 'fornecedores', rotulo: 'Fornecedores' },
    { id: 'inscricoes', rotulo: 'Inscrições' },
];

/* Módulo financeiro da SEMAC — rota /financeiro.
   Estado local apenas (mock); a integração com a API virá depois.
   Acesso será restrito a diretores e presidente quando o login existir. */
export default function Financas() {
    const [secaoAtiva, setSecaoAtiva] = useState('resumo');
    const [patrocinadores, setPatrocinadores] = useState(MOCK_PATROCINADORES);
    const [compras, setCompras] = useState(MOCK_COMPRAS);
    const [fornecedores, setFornecedores] = useState(MOCK_FORNECEDORES);
    const [inscricoes] = useState(MOCK_INSCRICOES);

    return (
        <div className="paginaFinancas">
            {/* ── Sidebar ─────────────────────────────────── */}
            <aside className="sidebarFinancas">
                <div className="cabecalhoSidebarFinancas">
                    <span className="marcaSidebarFinancas">SEMAC</span>
                    <span className="moduloSidebarFinancas">Financeiro</span>
                </div>

                <nav className="navegacaoSidebarFinancas" aria-label="Seções do módulo financeiro">
                    {SECOES.map((secao) => (
                        <button
                            key={secao.id}
                            type="button"
                            className={
                                secaoAtiva === secao.id
                                    ? 'itemNavegacaoFinancas itemNavegacaoAtivoFinancas'
                                    : 'itemNavegacaoFinancas'
                            }
                            aria-current={secaoAtiva === secao.id ? 'page' : undefined}
                            onClick={() => setSecaoAtiva(secao.id)}
                        >
                            {ICONES_NAVEGACAO[secao.id]}
                            <span>{secao.rotulo}</span>
                        </button>
                    ))}
                </nav>

                <Link href="/" className="linkVoltarSiteFinancas">
                    ← Voltar ao site
                </Link>
            </aside>

            {/* ── Conteúdo ────────────────────────────────── */}
            <main className="conteudoFinancas">
                <section key={secaoAtiva} className="secaoFinancas">
                    {secaoAtiva === 'resumo' && (
                        <Resumo
                            patrocinadores={patrocinadores}
                            compras={compras}
                            inscricoes={inscricoes}
                        />
                    )}
                    {secaoAtiva === 'patrocinios' && (
                        <Patrocinios
                            patrocinadores={patrocinadores}
                            setPatrocinadores={setPatrocinadores}
                        />
                    )}
                    {secaoAtiva === 'compras' && (
                        <Compras
                            compras={compras}
                            setCompras={setCompras}
                            fornecedores={fornecedores}
                            setFornecedores={setFornecedores}
                        />
                    )}
                    {secaoAtiva === 'fornecedores' && (
                        <Fornecedores
                            fornecedores={fornecedores}
                            setFornecedores={setFornecedores}
                            compras={compras}
                        />
                    )}
                    {secaoAtiva === 'inscricoes' && <Inscricoes inscricoes={inscricoes} />}
                </section>
            </main>
        </div>
    );
}

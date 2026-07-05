import { useState, useEffect } from 'preact/hooks';
import { Link, useLocation } from 'wouter';
import { limparSessao } from '../../auth/sessao.js';
import Resumo from './sections/Resumo.jsx';
import Patrocinios from './sections/Patrocinios.jsx';
import Compras from './sections/Compras.jsx';
import Fornecedores from './sections/Fornecedores.jsx';
import Inscricoes from './sections/Inscricoes.jsx';
import Doacoes from './sections/Doacoes.jsx';
import { listarDoadores } from './data/apiDoacoes.js';
import { listarPatrocinadores } from './data/apiPatrocinios.js';
import { listarFornecedores } from './data/apiFornecedores.js';
import { listarInscricoes } from './data/apiInscricoes.js';
import { listarCompras } from './data/apiCompras.js';
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
    doacoes: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
    ),
};

const SECOES = [
    { id: 'resumo', rotulo: 'Resumo' },
    { id: 'patrocinios', rotulo: 'Patrocínios' },
    { id: 'compras', rotulo: 'Compras' },
    { id: 'fornecedores', rotulo: 'Fornecedores' },
    { id: 'inscricoes', rotulo: 'Inscrições' },
    { id: 'doacoes', rotulo: 'Doações' },
];

/* Módulo financeiro da SEMAC — rota /financeiro.
   Estado local apenas (mock); a integração com a API virá depois.
   Acesso será restrito a diretores e presidente quando o login existir. */
export default function Financas() {
    const [, navegar] = useLocation();
    const [secaoAtiva, setSecaoAtiva] = useState('resumo');

    // Encerra a sessão e volta para o site público.
    function sair() {
        limparSessao();
        navegar('/');
    }

    // Compras vêm da API; entram no saldo como saídas.
    const [compras, setCompras] = useState([]);
    const [carregandoCompras, setCarregandoCompras] = useState(true);
    const [erroCompras, setErroCompras] = useState('');

    // Inscrições reais: participantes confirmados (role = PARTICIPANTE)
    // com ingresso e valor vindos do banco. Somente leitura aqui.
    const [inscricoes, setInscricoes] = useState([]);
    const [carregandoInscricoes, setCarregandoInscricoes] = useState(true);
    const [erroInscricoes, setErroInscricoes] = useState('');

    // Patrocínios vêm da API; entram no saldo quando recebidos.
    const [patrocinadores, setPatrocinadores] = useState([]);
    const [carregandoPatrocinios, setCarregandoPatrocinios] = useState(true);
    const [erroPatrocinios, setErroPatrocinios] = useState('');

    // Doações vêm da API (cadastradas no /admin); contabilizadas no caixa.
    const [doadores, setDoadores] = useState([]);
    const [carregandoDoacoes, setCarregandoDoacoes] = useState(true);
    const [erroDoacoes, setErroDoacoes] = useState('');

    // Fornecedores vêm da API; referenciados pelas compras.
    const [fornecedores, setFornecedores] = useState([]);
    const [carregandoFornecedores, setCarregandoFornecedores] = useState(true);
    const [erroFornecedores, setErroFornecedores] = useState('');

    useEffect(() => {
        let ativo = true;
        listarPatrocinadores()
            .then((lista) => {
                if (ativo) setPatrocinadores(lista);
            })
            .catch((e) => {
                if (ativo) setErroPatrocinios(e.message);
            })
            .finally(() => {
                if (ativo) setCarregandoPatrocinios(false);
            });
        listarDoadores()
            .then((lista) => {
                if (ativo) setDoadores(lista);
            })
            .catch((e) => {
                if (ativo) setErroDoacoes(e.message);
            })
            .finally(() => {
                if (ativo) setCarregandoDoacoes(false);
            });
        listarFornecedores()
            .then((lista) => {
                if (ativo) setFornecedores(lista);
            })
            .catch((e) => {
                if (ativo) setErroFornecedores(e.message);
            })
            .finally(() => {
                if (ativo) setCarregandoFornecedores(false);
            });
        listarInscricoes()
            .then((lista) => {
                if (ativo) setInscricoes(lista);
            })
            .catch((e) => {
                if (ativo) setErroInscricoes(e.message);
            })
            .finally(() => {
                if (ativo) setCarregandoInscricoes(false);
            });
        listarCompras()
            .then((lista) => {
                if (ativo) setCompras(lista);
            })
            .catch((e) => {
                if (ativo) setErroCompras(e.message);
            })
            .finally(() => {
                if (ativo) setCarregandoCompras(false);
            });
        return () => {
            ativo = false;
        };
    }, []);

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

                <div className="rodapeSidebarFinancas">
                    <button type="button" className="botaoSairFinancas" onClick={sair}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <path d="M16 17l5-5-5-5" />
                            <path d="M21 12H9" />
                        </svg>
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* ── Conteúdo ────────────────────────────────── */}
            <main className="conteudoFinancas">
                <section key={secaoAtiva} className="secaoFinancas">
                    {secaoAtiva === 'resumo' && (
                        <Resumo
                            patrocinadores={patrocinadores}
                            compras={compras}
                            inscricoes={inscricoes}
                            doadores={doadores}
                        />
                    )}
                    {secaoAtiva === 'patrocinios' && (
                        <Patrocinios
                            patrocinadores={patrocinadores}
                            setPatrocinadores={setPatrocinadores}
                            carregando={carregandoPatrocinios}
                            erro={erroPatrocinios}
                        />
                    )}
                    {secaoAtiva === 'compras' && (
                        <Compras
                            compras={compras}
                            setCompras={setCompras}
                            fornecedores={fornecedores}
                            setFornecedores={setFornecedores}
                            carregando={carregandoCompras}
                            erro={erroCompras}
                        />
                    )}
                    {secaoAtiva === 'fornecedores' && (
                        <Fornecedores
                            fornecedores={fornecedores}
                            setFornecedores={setFornecedores}
                            compras={compras}
                            carregando={carregandoFornecedores}
                            erro={erroFornecedores}
                        />
                    )}
                    {secaoAtiva === 'inscricoes' && (
                        <Inscricoes
                            inscricoes={inscricoes}
                            carregando={carregandoInscricoes}
                            erro={erroInscricoes}
                        />
                    )}
                    {secaoAtiva === 'doacoes' && (
                        <Doacoes
                            doadores={doadores}
                            carregando={carregandoDoacoes}
                            erro={erroDoacoes}
                        />
                    )}
                </section>
            </main>
        </div>
    );
}

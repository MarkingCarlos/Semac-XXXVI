import { useState, useEffect, useRef } from 'preact/hooks';
import { useLocation } from 'wouter';
import { limparSessao, temAcessoFinanceiro } from '../../auth/sessao.js';
import Resumo from './sections/Resumo.jsx';
import Patrocinios from './sections/Patrocinios.jsx';
import Compras from './sections/Compras.jsx';
import Cotacoes from './sections/Cotacoes.jsx';
import Fornecedores from './sections/Fornecedores.jsx';
import Inscricoes from './sections/Inscricoes.jsx';
import Doacoes from './sections/Doacoes.jsx';
import Previsao from './sections/Previsao.jsx';
import { listarDoadores } from './data/apiDoacoes.js';
import { listarPatrocinadores } from './data/apiPatrocinios.js';
import { listarFornecedores } from './data/apiFornecedores.js';
import { listarInscricoes } from './data/apiInscricoes.js';
import { listarCompras } from './data/apiCompras.js';
import { listarCotacoes } from './data/apiCotacoes.js';
import { listarCaixas } from './data/apiCaixa.js';
import { lerResumoPrevisao } from './data/apiPrevisao.js';
import './financas.css';

const SECOES = [
    { id: 'resumo', rotulo: 'Resumo' },
    { id: 'previsao', rotulo: 'Previsão' },
    { id: 'patrocinios', rotulo: 'Patrocínios' },
    { id: 'compras', rotulo: 'Compras' },
    { id: 'cotacoes', rotulo: 'Cotação' },
    { id: 'fornecedores', rotulo: 'Fornecedores' },
    { id: 'inscricoes', rotulo: 'Inscrições' },
    { id: 'doacoes', rotulo: 'Doações' },
];

/* Módulo financeiro da SEMAC — rota /financeiro.
   Estado local apenas (mock); a integração com a API virá depois.
   Acesso será restrito a diretores e presidente quando o login existir. */
export default function Financas() {
    const [, navegar] = useLocation();

    // Diretores de conteúdo, patrocínio, apoio e marketing entram aqui só
    // para ver a Previsão: as demais abas somem e nada é editável. As
    // outras listas nem são buscadas — a API responderia 403 para eles.
    const podeEditarFinanceiro = temAcessoFinanceiro();
    const secoesVisiveis = podeEditarFinanceiro ? SECOES : SECOES.filter((secao) => secao.id === 'previsao');
    const [secaoAtiva, setSecaoAtiva] = useState(podeEditarFinanceiro ? 'resumo' : 'previsao');

    // Encerra a sessão e volta para o site público.
    function sair() {
        limparSessao();
        navegar('/');
    }

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
    }, [secaoAtiva]);

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

    // Fornecedores vêm da API; referenciados pelas compras e cotações.
    const [fornecedores, setFornecedores] = useState([]);
    const [carregandoFornecedores, setCarregandoFornecedores] = useState(true);
    const [erroFornecedores, setErroFornecedores] = useState('');

    // Cotações vêm da API; itens ainda não comprados, com preços por fornecedor.
    const [cotacoes, setCotacoes] = useState([]);
    const [carregandoCotacoes, setCarregandoCotacoes] = useState(true);
    const [erroCotacoes, setErroCotacoes] = useState('');

    // Caixa: uma linha por conta (COMISSAO e FUNDUNESP), editável no card
    // do Resumo. Exibido à parte — não entra no saldo operacional.
    // Diferente das demais seções não há flag de carregando: o card usa a
    // própria lista (vazia enquanto não chega) como estado de espera.
    const [caixas, setCaixas] = useState([]);
    const [erroCaixas, setErroCaixas] = useState('');

    // O que a comissão arrecadou (patrocínios + doações + inscrições + lucro
    // das camisetas avulsas) e a reserva da FUNDUNESP vêm calculados do backend
    // (/api/previsao/resumo). Refazer a soma aqui abriria um segundo
    // lugar para a regra divergir.
    const [entradasResumo, setEntradasResumo] = useState(null);
    const [reservaFundunesp, setReservaFundunesp] = useState(0);

    function recarregarContas() {
        return lerResumoPrevisao()
            .then((resumo) => {
                setEntradasResumo(resumo.entradas);
                setReservaFundunesp(resumo.reservaFundunesp);
            })
            .catch((e) => setErroCaixas(e.message));
    }

    useEffect(() => {
        if (!podeEditarFinanceiro) return undefined;
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
        listarCotacoes()
            .then((lista) => {
                if (ativo) setCotacoes(lista);
            })
            .catch((e) => {
                if (ativo) setErroCotacoes(e.message);
            })
            .finally(() => {
                if (ativo) setCarregandoCotacoes(false);
            });
        listarCaixas()
            .then((lista) => {
                if (ativo) setCaixas(lista);
            })
            .catch((e) => {
                if (ativo) setErroCaixas(e.message);
            });
        lerResumoPrevisao()
            .then((resumo) => {
                if (!ativo) return;
                setEntradasResumo(resumo.entradas);
                setReservaFundunesp(resumo.reservaFundunesp);
            })
            .catch((e) => {
                if (ativo) setErroCaixas(e.message);
            });
        return () => {
            ativo = false;
        };
    }, []);

    return (
        <div className="paginaFinancas">
            <header className="cabecalhoFinancas">
                <span className="marcaCabecalhoFinancas">SEMAC</span>
                <span className="moduloCabecalhoFinancas">Financeiro</span>
            </header>

            {/* ── Conteúdo ────────────────────────────────── */}
            <main className="conteudoFinancas">
                <section key={secaoAtiva} className="secaoFinancas">
                    {secaoAtiva === 'resumo' && (
                        <Resumo
                            patrocinadores={patrocinadores}
                            compras={compras}
                            inscricoes={inscricoes}
                            doadores={doadores}
                            caixas={caixas}
                            setCaixas={setCaixas}
                            entradasResumo={entradasResumo}
                            reservaFundunesp={reservaFundunesp}
                            recarregarContas={recarregarContas}
                            erroCaixas={erroCaixas}
                        />
                    )}
                    {secaoAtiva === 'previsao' && (
                        <Previsao
                            fornecedores={fornecedores}
                            setFornecedores={setFornecedores}
                            somenteLeitura={!podeEditarFinanceiro}
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
                    {secaoAtiva === 'cotacoes' && (
                        <Cotacoes
                            cotacoes={cotacoes}
                            setCotacoes={setCotacoes}
                            fornecedores={fornecedores}
                            setFornecedores={setFornecedores}
                            carregando={carregandoCotacoes}
                            erro={erroCotacoes}
                        />
                    )}
                    {secaoAtiva === 'fornecedores' && (
                        <Fornecedores
                            fornecedores={fornecedores}
                            setFornecedores={setFornecedores}
                            compras={compras}
                            cotacoes={cotacoes}
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

            {/* ── Navbar flutuante ─────────────────────────── */}
            <nav className="navFlutuanteFinancas" aria-label="Seções do módulo financeiro">
                <div className="trilhoNavFlutuanteFinancas" ref={trilhoNavRef}>
                    <div
                        className="indicadorNavFlutuanteFinancas"
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
                                    ? 'itemNavFlutuanteFinancas itemNavFlutuanteAtivoFinancas'
                                    : 'itemNavFlutuanteFinancas'
                            }
                            aria-current={secaoAtiva === secao.id ? 'page' : undefined}
                            onClick={() => setSecaoAtiva(secao.id)}
                        >
                            {secao.rotulo}
                        </button>
                    ))}
                    <button type="button" className="itemNavFlutuanteFinancas itemNavFlutuanteSairFinancas" onClick={sair}>
                        Sair
                    </button>
                </div>
            </nav>
        </div>
    );
}
